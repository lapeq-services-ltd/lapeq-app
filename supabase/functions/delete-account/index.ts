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

    try {
        // 1. Require a valid JWT from the calling user
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return json({ error: "Unauthorized: Missing Authorization header" }, 401);
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
        const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

        // Validate the JWT
        const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } }
        });

        const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
        if (authError || !user) {
            return json({ error: "Unauthorized: Invalid session" }, 401);
        }

        const userId = user.id;

        // Admin client with service role key to perform safe user deletion
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

        // Optional reason from body
        let reason = "";
        try {
            const body = await req.json();
            reason = body?.reason || "";
        } catch {}

        // 2. Clean up any user notifications or push subscriptions
        try {
            await supabaseAdmin.from("push_subscriptions").delete().eq("user_id", userId);
        } catch (e) {
            console.error("Error clearing push subscriptions:", e);
        }

        try {
            await supabaseAdmin.from("notifications").delete().eq("user_id", userId);
        } catch (e) {
            console.error("Error clearing notifications:", e);
        }

        // 3. Delete user via Supabase Auth Admin API
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (deleteError) {
            console.error("Failed to delete user via admin api:", deleteError);
            return json({ error: deleteError.message }, 500);
        }

        return json({ success: true, message: "Account successfully deleted" }, 200);
    } catch (err: any) {
        console.error("Unexpected error in delete-account edge function:", err);
        return json({ error: err.message || "Failed to delete account" }, 500);
    }
});
