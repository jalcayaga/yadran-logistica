const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    const { data, error } = await supabase.from('itineraries').select('*').limit(1);
    if (error) console.log(error);
    else console.log("Columns:", data && data.length > 0 ? Object.keys(data[0]) : "Table empty, can't infer columns from empty row via JS client easily without metadata query");
}

inspect();
