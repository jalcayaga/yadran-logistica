const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    // Try to select date from itineraries
    const { data, error } = await supabase.from('itineraries').select('date').limit(1);

    if (error) {
        console.log("❌ Error fetching date:", error);
    } else {
        console.log("✅ Column 'date' exists (Fetched row or empty list)");
    }
}

checkSchema();
