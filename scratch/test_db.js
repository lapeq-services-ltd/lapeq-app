const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://iwedpnipbuurohaqibag.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3ZWRwbmlwYnV1cm9oYXFpYmFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyOTYwODcsImV4cCI6MjA5MTg3MjA4N30.lzYrxVgXPeuiBtwupjmRhhFWxz_mLw-n2G4vWf8nkwc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('Testing Supabase Connection...');
    const { data: list, error: listErr } = await supabase.from('venues').select('id, name').limit(2);
    console.log('Venues:', list, 'Error:', listErr);

    const { data, error } = await supabase.from('favorites').select('*').limit(5);
    console.log('Favorites (Anonymous Key):', data, 'Error:', error);
}
check();
