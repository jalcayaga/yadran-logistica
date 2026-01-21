const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSimulation() {
    console.log("--- 🚢 INICIANDO SIMULACIÓN DE ESCENARIO 🚢 ---");
    console.log("Escenario: Ruta J711 -> M716 -> M717 -> BASE I -> J734 -> J730 -> B747 -> MKA");
    console.log("Pasajeros: 24 | Capacidad Nave: 30\n");

    // 0. Cleanup previous run
    await supabase.from('vessels').delete().eq('name', 'Nave Simulación');

    // 1. Create Vessel
    const { data: vessel, error: vesselError } = await supabase.from('vessels').insert({
        name: 'Nave Simulación',
        type: 'lancha',
        capacity: 30
    }).select().single();

    if (vesselError) {
        console.error("❌ Error creando nave:", vesselError);
        return;
    }

    console.log(`✅ Nave creada: ${vessel.name} (Capacidad: ${vessel.capacity})`);

    // 2. Create Locations (Ensure they exist or create dummy ones)
    const stopNames = ['J711', 'M716', 'M717', 'BASE I', 'J734', 'J730', 'B747', 'MKA'];
    const locationIds = [];

    for (const name of stopNames) {
        // Try find or create
        let { data: loc } = await supabase.from('locations').select('id').eq('code', name).single();
        if (!loc) {
            // Create dummy
            const { data: newLoc } = await supabase.from('locations').insert({
                name: name,
                code: name, // keeping simple
                type: 'center'
            }).select().single();
            loc = newLoc;
        }
        locationIds.push(loc.id);
    }

    // 3. Create Itinerary
    const { data: itinerary, error: itinError } = await supabase.from('itineraries').insert({
        vessel_id: vessel.id,
        date: new Date().toISOString().split('T')[0],
        start_time: '08:00',
        status: 'scheduled'
    }).select().single();

    if (itinError) {
        console.error("❌ Error creando itinerario:", itinError);
        return;
    }

    // 4. Create Stops
    const stopsData = locationIds.map((locId, idx) => ({
        itinerary_id: itinerary.id,
        location_id: locId,
        stop_order: idx
    }));
    await supabase.from('itinerary_stops').insert(stopsData);
    console.log(`✅ Itinerario creado con ${stopsData.length} paradas.`);

    // 5. Test Case A: Fill to 24 (Under Capacity)
    // Insert 24 bookings J711 (0) -> MKA (7)
    console.log(`\n🌊 Escenario A: Movimiento de 24 pax (J711 -> MKA)`);

    // Fetch stops first
    const { data: realStops } = await supabase.from('itinerary_stops').select('id, stop_order').eq('itinerary_id', itinerary.id).order('stop_order');
    const s0 = realStops.find(s => s.stop_order === 0);
    const s7 = realStops.find(s => s.stop_order === 7);

    // Prepare bookings
    const bookingsA = Array(24).fill(0).map(() => ({
        itinerary_id: itinerary.id,
        origin_stop_id: s0.id,
        destination_stop_id: s7.id,
        status: 'confirmed'
    }));

    // Check capacity for 1 pax
    const { data: check24 } = await supabase.rpc('check_capacity', {
        p_itinerary_id: itinerary.id,
        p_active_booking_id: null,
        p_start_order: 0,
        p_end_order: 7
    });
    console.log(` [1] ¿Hay espacio para el pasajero 1? ${check24 ? '✅ SI' : '❌ NO'}`);

    // Insert 24
    console.log(" ... Insertando 24 pasajeros...");
    const payload24 = Array(24).fill(0).map(() => ({
        itinerary_id: itinerary.id,
        origin_stop_id: s0.id,
        destination_stop_id: s7.id,
        status: 'confirmed'
    }));
    await supabase.from('bookings').insert(payload24);

    // 6. Test Case B: Boundary Test
    // Try to add 6 more (Total 30) -> Should say YES
    const { data: check30 } = await supabase.rpc('check_capacity', {
        p_itinerary_id: itinerary.id, p_active_booking_id: null, p_start_order: 0, p_end_order: 7
    });
    console.log(` [2] ¿Hay espacio para 6 pax más (uno por uno)? ${check30 ? '✅ SI' : '❌ NO'} (Esperado: SI, pq valida 1+24=25)`);

    // Fill to 30
    console.log(" ... Insertando 6 pasajeros más (Total 30/30)...");
    const payload6 = Array(6).fill(0).map(() => ({
        itinerary_id: itinerary.id, origin_stop_id: s0.id, destination_stop_id: s7.id, status: 'confirmed'
    }));
    await supabase.from('bookings').insert(payload6);

    // Try to add 31st -> Should say NO
    const { data: check31 } = await supabase.rpc('check_capacity', {
        p_itinerary_id: itinerary.id, p_active_booking_id: null, p_start_order: 0, p_end_order: 7
    });
    console.log(` [3] ¿Hay espacio para el pasajero 31? ${check31 ? '❌ SI (ERROR)' : '✅ NO (CORRECTO)'}`);

    // 7. Test Case C: Hop-on Logic
    // Vessel is FULL (30/30) from Stop 0 to 7. 
    // Can I hop on at Stop 2 -> Stop 3? NO.
    // Let's free up space in the middle.
    // Actually, let's create a NEW itinerary for Hop On test to be clean.
    console.log(`\n🌊 Escenario B: Logica Hop-on / Hop-off`);
    console.log(" Limpiando y creando nueva ruta: A(0)->B(1)->C(2)->D(3). Cap: 30.");

    // Clear bookings
    await supabase.from('bookings').delete().eq('itinerary_id', itinerary.id);

    // Scenario: 30 Pax go from A(0) -> B(1).
    // Leg 0->1 is FULL. Leg 1->2 is EMPTY. Leg 2->3 is EMPTY.

    const s1 = realStops.find(s => s.stop_order === 1);
    const s2 = realStops.find(s => s.stop_order === 2);
    const s3 = realStops.find(s => s.stop_order === 3);

    const payloadPart1 = Array(30).fill(0).map(() => ({
        itinerary_id: itinerary.id, origin_stop_id: s0.id, destination_stop_id: s1.id, status: 'confirmed'
    }));
    await supabase.from('bookings').insert(payloadPart1);
    console.log(" ... 30 pasajeros viajan A->B.");

    // Check A->B
    const { data: checkAB } = await supabase.rpc('check_capacity', {
        p_itinerary_id: itinerary.id, p_active_booking_id: null, p_start_order: 0, p_end_order: 1
    });
    console.log(` [4] ¿Puede subir alguien mas A->B? ${checkAB ? 'FAIL' : '✅ NO (Lleno)'}`);

    // Check B->C (Should be free)
    const { data: checkBC } = await supabase.rpc('check_capacity', {
        p_itinerary_id: itinerary.id, p_active_booking_id: null, p_start_order: 1, p_end_order: 2
    });
    console.log(` [5] ¿Puede subir alguien B->C? ${checkBC ? '✅ SI (Libre)' : 'FAIL'}`);

    // CLEANUP
    console.log("\n🧹 Limpiando datos de prueba...");
    await supabase.from('itineraries').delete().eq('id', itinerary.id);
    await supabase.from('vessels').delete().eq('id', vessel.id);
}

runSimulation();
