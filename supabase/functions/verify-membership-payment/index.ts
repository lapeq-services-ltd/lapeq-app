import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Black is invite-only ("Request Invitation" in the app) and never purchased
// through this flow, so it deliberately has no price entry — it can't be
// bought this way even if a client sends tier_id: "black" directly.
const TIER_PRICING: Record<string, Record<number, number>> = {
    silver: { 3: 350000, 6: 500000, 12: 850000 },
    gold: { 12: 2500000 },
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
        tier_id: string;
        expected_amount: number;
        duration_label?: string;
        duration_months?: number;
    };
    try {
        body = await req.json();
    } catch {
        return json({ error: "Invalid JSON body" }, 400);
    }

    const { tx_ref, tier_id, duration_label, duration_months } = body;
    if (!tx_ref || !tier_id || !duration_months) {
        return json({ error: "Missing required fields: tx_ref, tier_id, duration_months" }, 400);
    }

    // Real price is looked up server-side by tier + duration — never trust a
    // client-sent amount, or a lower-value real payment could be laundered
    // into a higher-value tier (e.g. pay ₦100, claim Black membership).
    const realAmount = TIER_PRICING[tier_id]?.[duration_months];
    if (!realAmount) {
        return json({ error: "Invalid tier_id/duration_months combination" }, 400);
    }

    // ── 3. Admin client for DB reads/writes (bypasses RLS) ──────────────────
    const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── 4. Idempotency — this tx_ref already processed, don't redo it ───────
    const { data: existing } = await supabaseAdmin
        .from("requests")
        .select("id")
        .eq("reference", tx_ref)
        .eq("service_type", "tier-purchase")
        .maybeSingle();

    if (existing) {
        return json({ success: true, already_processed: true });
    }

    // ── 5. Call Flutterwave's server-side verification endpoint ─────────────
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

    // ── 6. Validate the transaction data returned by Flutterwave ────────────
    const tx = flwData?.data;

    if (flwData?.status !== "success" || tx?.status !== "successful") {
        return json({ error: "Transaction not successful", flw_status: tx?.status }, 402);
    }

    if (Math.abs(tx.amount - realAmount) > 1) {
        return json({ error: "Amount mismatch", paid: tx.amount, expected: realAmount }, 402);
    }

    if (tx.currency !== "NGN") {
        return json({ error: "Currency mismatch", currency: tx.currency }, 402);
    }

    // ── 7. Reserve this tx_ref FIRST, before touching the tier — the unique
    // index on (reference) WHERE service_type='tier-purchase' is what actually
    // stops a raced/replayed tx_ref from landing a second, possibly higher,
    // tier. Reserving before granting means a losing race aborts cleanly
    // instead of the tier already being changed by the time it's caught.
    const tierName = tier_id.charAt(0).toUpperCase() + tier_id.slice(1);
    const { error: reqError } = await supabaseAdmin.from("requests").insert({
        user_id: user.id,
        reference: tx_ref,
        service_type: "tier-purchase",
        status: "completed",
        title: `${tierName} Membership`,
        details: { tier: tier_id, duration: duration_label, months: duration_months, amount: realAmount },
    });

    if (reqError) {
        if (reqError.code === "23505") {
            return json({ success: true, already_processed: true });
        }
        return json({ error: "Failed to record tier purchase", detail: reqError.message }, 500);
    }

    // ── 8. Now grant the tier. Uses the service role, so the client-side
    // tier-protection trigger no longer silently reverts this (see
    // 28_membership_payment_fix.sql).
    const { error: tierError } = await supabaseAdmin
        .from("profiles")
        .update({ tier: tier_id })
        .eq("id", user.id);

    if (tierError) {
        return json({ error: "Failed to update tier", detail: tierError.message }, 500);
    }

    // The "Welcome to Lapeq X" notification now fires automatically via the
    // notify_tier_upgrade() DB trigger on the profiles update above — no
    // need to insert it again here.

    return json({ success: true });
});
