const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://iwedpnipbuurohaqibag.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3ZWRwbmlwYnV1cm9oYXFpYmFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyOTYwODcsImV4cCI6MjA5MTg3MjA4N30.lzYrxVgXPeuiBtwupjmRhhFWxz_mLw-n2G4vWf8nkwc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('Fetching bug_reports table...');
    const { data, error } = await supabase.from('bug_reports').select('*').order('created_at', { ascending: false }).limit(5);
    if (error) {
        console.error('Error fetching bug_reports:', error);
    } else {
        console.log('Total fetched:', data.length);
        console.log('Latest bug reports:', data);
    }
}
check();
