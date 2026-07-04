import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
    try {
        const body = await req.json();
        const phone: string = body.user?.phone;
        const otp: string = body.sms?.otp;

        if (!phone || !otp) {
            return new Response(JSON.stringify({ error: "Missing phone or otp" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        const apiKey = Deno.env.get("TERMII_API_KEY");
        const senderId = Deno.env.get("TERMII_SENDER_ID") ?? "N-Alert";

        if (!apiKey) {
            return new Response(JSON.stringify({ error: "TERMII_API_KEY not configured" }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            });
        }

        const res = await fetch("https://api.ng.termii.com/api/sms/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                to: phone,
                from: senderId,
                sms: `Your LAPEQ verification code is: ${otp}. Valid for 10 minutes. Do not share with anyone.`,
                type: "plain",
                channel: "generic",
                api_key: apiKey,
            }),
        });

        const rawText = await res.text();
        console.log("Termii status:", res.status);
        console.log("Termii response:", rawText);

        let result: any = {};
        try { result = JSON.parse(rawText); } catch (_) {}

        if (!res.ok) {
            return new Response(JSON.stringify({ error: result, raw: rawText }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            });
        }

        return new Response(JSON.stringify({ success: true, message_id: result.message_id }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error("Unexpected error:", err);
        return new Response(JSON.stringify({ error: String(err) }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
});
