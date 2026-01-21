const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVessel() {
    const { data: vessels, error } = await supabase.from('vessels').select('*');
    if (error) console.error(error);
    else {
        console.log("Vessels found:", vessels.length);
        vessels.forEach(v => {
            console.log(`[${v.id}] ${v.name} (Cap: ${v.capacity})`);
            if (!v.id) console.error("⚠️ Vessel missing ID:", v);
        });
    }
}

checkVessel();
