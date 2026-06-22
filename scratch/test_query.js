const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://iwedpnipbuurohaqibag.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log("Testing connection...");
    // 1. Simple count
    const { count, error: countErr } = await supabase
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
    console.log("Pending count:", count, "Error:", countErr);

    // 2. Select with profiles join
    const { data, error: selectErr } = await supabase
        .from('requests')
        .select('*, profiles!requests_user_id_fkey(id, full_name, preferred_name, email, region, tier, phone)')
        .limit(5);
    console.log("Select with join:", data ? `${data.length} rows` : null, "Error:", selectErr);

    // 3. Let's see what tables and columns exist in public
    const { data: cols, error: colsErr } = await supabase
        .rpc('get_db_info'); // if exists
    if (colsErr) {
        // Fallback: run query via REST or list schema if possible
        console.log("Columns query error:", colsErr);
    }
}

test();
