const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://iwedpnipbuurohaqibag.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3ZWRwbmlwYnV1cm9oYXFpYmFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyOTYwODcsImV4cCI6MjA5MTg3MjA4N30.lzYrxVgXPeuiBtwupjmRhhFWxz_mLw-n2G4vWf8nkwc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    console.log('Testing insert into bug_reports...');
    const { data, error } = await supabase.from('bug_reports').insert({
        message: 'Test bug report from diagnostics script',
        route: 'diagnostics-test',
        screenshot_url: null
    }).select();
    
    if (error) {
        console.error('Insert failed with error:', error);
    } else {
        console.log('Insert succeeded! Row:', data);
    }
}
testInsert();
