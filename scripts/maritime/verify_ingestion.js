const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function verify() {
    console.log("--- Ports ---");
    const { data: ports } = await supabase.from('ports').select('*');
    console.table(ports);

    console.log("\n--- Vessel Types ---");
    const { data: vtypes } = await supabase.from('vessel_types').select('*');
    console.table(vtypes);

    console.log("\n--- Centers (Sample) ---");
    const { data: centers } = await supabase.from('centers').select('*').limit(5);
    console.table(centers);
}

verify();
