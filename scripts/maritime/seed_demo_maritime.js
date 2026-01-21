const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Environment variables missing');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedDemoData() {
    console.log('🚀 Seeding Maritime Demo Data...');

    // 1. Ports Status
    const ports = ['PAG', 'PCH', 'MEL', 'QUE', 'TEN', 'CHA'];
    const statuses = ['ABIERTO', 'CERRADO', 'RESTRINGIDO'];

    for (const code of ports) {
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const { error } = await supabase
            .from('external_port_status')
            .upsert({
                port_code: code,
                status: status,
                last_update: new Date().toISOString()
            });
        if (error) console.error(`Error seeding port ${code}:`, error.message);
    }

    // 2. Weather Snapshots for centers
    const { data: locations } = await supabase
        .from('locations')
        .select('id, name')
        .eq('type', 'center');

    if (locations) {
        for (const loc of locations) {
            const wind = Math.floor(Math.random() * 45); // 0-45 kt
            const wave = (Math.random() * 4).toFixed(1); // 0-4 m
            const vis = Math.floor(Math.random() * 12) + 4; // 4-16 km
            const { error } = await supabase
                .from('center_weather_snapshots')
                .insert({
                    location_id: loc.id,
                    wind_speed: wind,
                    wind_gust: wind + Math.floor(Math.random() * 10),
                    wave_height: parseFloat(wave),
                    visibility: vis,
                    timestamp: new Date().toISOString()
                });
            if (error) console.error(`Error seeding weather for ${loc.name}:`, error.message);
        }
    }

    console.log('✅ Demo data seeded successfully!');
}

seedDemoData();
