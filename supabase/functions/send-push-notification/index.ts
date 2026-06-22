// supabase/functions/send-push-notification/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? "",
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ""
    )

    const payload = await req.json()
    console.log('Notification webhook payload received:', payload)

    const { record } = payload
    if (!record || !record.user_id) {
      return new Response(JSON.stringify({ error: 'Invalid payload record' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Get the user's active push subscription tokens
    const { data: subscriptions, error: subError } = await supabaseClient
      .from('push_subscriptions')
      .select('token')
      .eq('user_id', record.user_id)

    if (subError) {
      throw subError
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log(`No push subscriptions found for user: ${record.user_id}`)
      return new Response(JSON.stringify({ success: true, message: 'No subscriptions found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Construct the Expo push payloads
    const messages = subscriptions.map((sub: { token: string }) => ({
      to: sub.token,
      sound: 'default',
      title: record.title || 'LAPEQ',
      body: record.body || '',
      data: {
        type: record.type || 'request',
        target_id: record.target_id || null,
      },
    }))

    console.log(`Sending ${messages.length} push notifications via Expo...`)

    // Send requests to Expo Push API
    const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    })

    const expoData = await expoResponse.json()
    console.log('Expo response:', expoData)

    return new Response(JSON.stringify({ success: true, expo: expoData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('Error executing push notification webhook:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
