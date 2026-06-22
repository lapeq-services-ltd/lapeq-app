const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://iwedpnipbuurohaqibag.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3ZWRwbmlwYnV1cm9oYXFpYmFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyOTYwODcsImV4cCI6MjA5MTg3MjA4N30.lzYrxVgXPeuiBtwupjmRhhFWxz_mLw-n2G4vWf8nkwc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('Fetching events table metadata/rows...');
    const { data, error } = await supabase.from('events').select('*').limit(1);
    if (error) {
        console.error('Error fetching events:', error);
    } else {
        console.log('Row fetched:', data);
        if (data.length > 0) {
            console.log('Columns in events:', Object.keys(data[0]));
            if ('instagram' in data[0]) {
                console.log('Success: "instagram" column exists in public.events!');
            } else {
                console.log('Warning: "instagram" column does NOT exist in public.events!');
            }
        } else {
            console.log('No events found in table.');
        }
    }
}
check();
