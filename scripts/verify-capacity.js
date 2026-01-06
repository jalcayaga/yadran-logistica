
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing environment variables!');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function verifyCapacity() {
    console.log('🚀 Starting Capacity Verification...');

    // 0. Cleanup (Safe)
    console.log('0️⃣ Cleaning up potential leftovers...');
    const { data: oldVessel } = await supabase.from('vessels').select('id').eq('name', 'TEST_VESSEL_CAPACITY').single();
    if (oldVessel) {
        await supabase.from('vessels').delete().eq('id', oldVessel.id);
    }

    // 1. Create a Test Vessel (Capacity 1)
    console.log('1️⃣ Creating Test Vessel (Capacity 1)...');
    const { data: vessel, error: vError } = await supabase
        .from('vessels')
        .insert({ name: 'TEST_VESSEL_CAPACITY', capacity: 1, type: 'lancha' })
        .select()
        .single();
    if (vError) throw new Error('Vessel creation failed: ' + vError.message);

    // 2. Create Test Locations
    console.log('2️⃣ Creating Test Locations...');
    const { data: locOrigin } = await supabase.from('locations').upsert({ code: 'TEST_ORG', name: 'Test Origin', type: 'port' }, { onConflict: 'code' }).select().single();
    const { data: locDest } = await supabase.from('locations').upsert({ code: 'TEST_DST', name: 'Test Dest', type: 'port' }, { onConflict: 'code' }).select().single();

    // 3. Create Itinerary
    console.log('3️⃣ Creating Test Itinerary...');
    const { data: itinerary, error: iError } = await supabase
        .from('itineraries')
        .insert({
            vessel_id: vessel.id,
            date: '2025-12-31',
            start_time: '12:00:00'
        })
        .select()
        .single();
    if (iError) throw new Error('Itinerary creation failed: ' + iError.message);

    // 4. Create Stops (Origin -> Dest)
    console.log('4️⃣ Creating Stops...');
    const { data: stops, error: sError } = await supabase
        .from('itinerary_stops')
        .insert([
            { itinerary_id: itinerary.id, location_id: locOrigin.id, stop_order: 0 },
            { itinerary_id: itinerary.id, location_id: locDest.id, stop_order: 1 }
        ])
        .select();
    if (sError) throw new Error('Stops creation failed');

    // 5. Create First Booking (Should scucceed)
    console.log('5️⃣ Creating First Booking (Should succeed)...');
    const { data: p1, error: p1Error } = await supabase.from('people').upsert({ rut_normalized: '111111111', rut_display: '11.111.111-1', first_name: 'Test1', last_name: 'User1', company: 'Test Company' }, { onConflict: 'rut_normalized' }).select().single();

    if (p1Error) {
        throw new Error('Person creation failed: ' + p1Error.message);
    }
    if (!p1) {
        throw new Error('Person creation returned null data');
    }
    console.log('   Person created:', p1.id);

    // Using the API logic (RPC check is usually done in Application Layer before insert, 
    // but here we can try to call the RPC directly to see if it returns false, OR try to insert if we had a trigger)
    // The current implementation has the check in the API route.
    // Let's call the RPC manually to verify the logic "Database-side".

    // Insert first booking directly
    const { error: b1Error, data: b1 } = await supabase
        .from('bookings')
        .insert({
            itinerary_id: itinerary.id,
            passenger_id: p1.id,
            origin_stop_id: stops[0].id,
            destination_stop_id: stops[1].id,
            status: 'confirmed'
        })
        .select()
        .single();

    if (b1Error) throw new Error('First booking failed: ' + b1Error.message);
    console.log('   ✅ First booking created');

    // 6. Check Capacity via RPC for 2nd Booking (Should FAIL i.e. return False)
    console.log('6️⃣ Checking Capacity for 2nd Booking (Should fail)...');

    // Attempting to book same segment
    const { data: hasCapacity, error: rpcError } = await supabase
        .rpc('check_capacity', {
            p_itinerary_id: itinerary.id,
            p_active_booking_id: null,
            p_start_order: 0,
            p_end_order: 1
        });

    if (rpcError) throw new Error('RPC call failed: ' + rpcError.message);

    if (hasCapacity === false) {
        console.log('   ✅ CORRECT: Capacity check returned FALSE (Full)');
    } else {
        console.error('   ❌ FAILURE: Capacity check returned TRUE (Expected False)');
    }

    // Cleaning up
    console.log('🧹 Cleaning up...');
    await supabase.from('itineraries').delete().eq('id', itinerary.id); // Cascade deletes bookings/stops
    await supabase.from('vessels').delete().eq('id', vessel.id);

    console.log('✨ Verification Complete');
}

verifyCapacity().catch(console.error);
