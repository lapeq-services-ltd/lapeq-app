import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    const json = (body: object, status = 200) =>
        new Response(JSON.stringify(body), {
            status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    // ── 1. Require a valid JWT from the caller ──────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    // Verify the token by calling getUser() with the user's own JWT.
    // This is the only correct way to authenticate an Edge Function caller.
    const supabaseUser = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    // ── 2. Parse & validate body ────────────────────────────────────────────
    let body: {
        tx_ref: string;
        request_id: string;
        expected_amount: number;
        payment_type: "curation" | "option";
        option_title?: string;
    };
    try {
        body = await req.json();
    } catch {
        return json({ error: "Invalid JSON body" }, 400);
    }

    const { tx_ref, request_id, expected_amount, payment_type, option_title } = body;
    if (!tx_ref || !request_id || !expected_amount || !payment_type) {
        return json({ error: "Missing required fields: tx_ref, request_id, expected_amount, payment_type" }, 400);
    }

    // ── 3. Admin client for DB reads/writes (bypasses RLS) ──────────────────
    // Safe to use here because we already validated the caller's identity above.
    const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── 4. Fetch the request row & enforce ownership ─────────────────────────
    const { data: requestRow, error: fetchError } = await supabaseAdmin
        .from("requests")
        .select("id, user_id, payment_status, details")
        .eq("id", request_id)
        .single();

    if (fetchError || !requestRow) return json({ error: "Request not found" }, 404);
    if (requestRow.user_id !== user.id) return json({ error: "Forbidden" }, 403);

    // ── 5. Idempotency: already paid — return success without re-verifying ───
    if (requestRow.payment_status === "paid") {
        return json({ success: true, already_paid: true });
    }

    // ── 6. Call Flutterwave's server-side verification endpoint ─────────────
    const flwSecretKey = Deno.env.get("FLUTTERWAVE_SECRET_KEY");
    if (!flwSecretKey) return json({ error: "Payment verification not configured on server" }, 500);

    let flwData: any;
    try {
        const flwRes = await fetch(
            `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(tx_ref)}`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${flwSecretKey}`,
                    "Content-Type": "application/json",
                },
            }
        );
        flwData = await flwRes.json();
        if (!flwRes.ok) return json({ error: "Flutterwave API error", detail: flwData.message }, 502);
    } catch (e) {
        return json({ error: "Could not reach Flutterwave", detail: String(e) }, 502);
    }

    // ── 7. Validate the transaction data returned by Flutterwave ────────────
    const tx = flwData?.data;

    if (flwData?.status !== "success" || tx?.status !== "successful") {
        return json({ error: "Transaction not successful", flw_status: tx?.status }, 402);
    }

    // Amount must match within ₦1 (floating-point tolerance)
    if (Math.abs(tx.amount - expected_amount) > 1) {
        return json({ error: "Amount mismatch", paid: tx.amount, expected: expected_amount }, 402);
    }

    if (tx.currency !== "NGN") {
        return json({ error: "Currency mismatch", currency: tx.currency }, 402);
    }

    // ── 8. Build DB update payload ───────────────────────────────────────────
    const updatePayload: Record<string, any> = { payment_status: "paid" };

    if (payment_type === "option" && option_title) {
        const curated = requestRow.details?.curated_options ?? {};
        let selection = curated.recommended?.title === option_title
            ? curated.recommended
            : (curated.suggestions ?? []).find((s: any) => s.title === option_title)
                ?? { title: option_title, price: expected_amount };

        updatePayload.details = {
            ...requestRow.details,
            curated_options: { ...curated, selection },
        };
    }

    // ── 9. Write to DB ───────────────────────────────────────────────────────
    const { error: updateError } = await supabaseAdmin
        .from("requests")
        .update(updatePayload)
        .eq("id", request_id);

    if (updateError) {
        return json({ error: "Database update failed", detail: updateError.message }, 500);
    }

    return json({ success: true, selection: updatePayload.details?.curated_options?.selection ?? null });
});
