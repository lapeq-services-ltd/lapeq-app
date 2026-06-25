const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://iwedpnipbuurohaqibag.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3ZWRwbmlwYnV1cm9oYXFpYmFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyOTYwODcsImV4cCI6MjA5MTg3MjA4N30.lzYrxVgXPeuiBtwupjmRhhFWxz_mLw-n2G4vWf8nkwc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBucket() {
    console.log('Retrieving bug-reports bucket information...');
    const { data, error } = await supabase.storage.getBucket('bug-reports');
    if (error) {
        console.error('Error getting bucket:', error);
    } else {
        console.log('Bucket Details:', data);
    }
}
checkBucket();
