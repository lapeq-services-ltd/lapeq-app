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
        payment_type: "curation" | "option" | "ride_fare";
        option_title?: string;
    };
    try {
        body = await req.json();
    } catch {
        return json({ error: "Invalid JSON body" }, 400);
    }

    const { tx_ref, request_id, payment_type, option_title } = body;
    if (!tx_ref || !request_id || !payment_type) {
        return json({ error: "Missing required fields: tx_ref, request_id, payment_type" }, 400);
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
        .select("id, user_id, payment_status, details, quoted_fare, surcharge_amount")
        .eq("id", request_id)
        .single();

    if (fetchError || !requestRow) return json({ error: "Request not found" }, 404);
    if (requestRow.user_id !== user.id) return json({ error: "Forbidden" }, 403);

    // ── 5. Idempotency: already paid — return success without re-verifying ───
    if (requestRow.payment_status === "paid") {
        return json({ success: true, already_paid: true });
    }

    // ── 5b. Determine the REAL price server-side — never trust a client-sent
    // amount as the fraud check, or a lower-value real payment could be
    // laundered into a higher-value outcome (e.g. pay ₦100, claim a
    // ₦500,000 option). Each payment_type has its own server-owned source.
    const CURATION_FEE = 5000;
    let realAmount: number;
    let matchedOption: any = null;

    if (payment_type === "curation") {
        realAmount = CURATION_FEE;
    } else if (payment_type === "ride_fare") {
        realAmount = Number(requestRow.quoted_fare || 0) + Number(requestRow.surcharge_amount || 0);
        if (realAmount <= 0) return json({ error: "No ride fare owed on this request" }, 400);
    } else if (payment_type === "option") {
        if (!option_title) return json({ error: "Missing option_title" }, 400);
        const curated = requestRow.details?.curated_options ?? {};
        matchedOption = curated.recommended?.title === option_title
            ? curated.recommended
            : (curated.suggestions ?? []).find((s: any) => s.title === option_title);
        if (!matchedOption || typeof matchedOption.price !== "number") {
            return json({ error: "No matching option with a known price found on this request" }, 404);
        }
        realAmount = matchedOption.price;
    } else {
        return json({ error: "Invalid payment_type" }, 400);
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

    // Amount paid must match the server-computed real price (within ₦1
    // floating-point tolerance) — never the client-sent expected_amount.
    if (Math.abs(tx.amount - realAmount) > 1) {
        return json({ error: "Amount mismatch", paid: tx.amount, expected: realAmount }, 402);
    }

    if (tx.currency !== "NGN") {
        return json({ error: "Currency mismatch", currency: tx.currency }, 402);
    }

    // ── 8. Build DB update payload ───────────────────────────────────────────
    // payment_tx_ref is unique across all requests (DB constraint) — this is
    // what actually stops one real transaction from being replayed against a
    // different request_id, not just the amount/ownership checks above.
    const updatePayload: Record<string, any> = { payment_status: "paid", payment_tx_ref: tx_ref };

    if (payment_type === "option" && matchedOption) {
        const curated = requestRow.details?.curated_options ?? {};
        updatePayload.details = {
            ...requestRow.details,
            curated_options: { ...curated, selection: matchedOption },
        };
    }

    // ── 9. Write to DB ───────────────────────────────────────────────────────
    const { error: updateError } = await supabaseAdmin
        .from("requests")
        .update(updatePayload)
        .eq("id", request_id);

    if (updateError) {
        if (updateError.code === "23505") {
            return json({ error: "This payment has already been applied to a different request" }, 409);
        }
        return json({ error: "Database update failed", detail: updateError.message }, 500);
    }

    return json({ success: true, selection: updatePayload.details?.curated_options?.selection ?? null });
});
