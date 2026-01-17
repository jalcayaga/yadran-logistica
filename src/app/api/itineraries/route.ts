import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { itinerarySchema } from '@/utils/zod_schemas';

export async function GET(request: NextRequest) {
    const supabase = await createClient();

    // Fetch itineraries with nested relations
    // Using a more resilient approach: if it fails, try a simpler version
    let { data, error } = await supabase
        .from('itineraries')
        .select(`
            *,
            vessel:vessels(name, capacity, registration_number),
            stops:itinerary_stops(
                id, stop_order, arrival_time, departure_time, location_id,
                location:locations(name, code, type)
            ),
            bookings(id),
            crew:crew_assignments(
                role,
                confirmed_at,
                person:people(first_name, last_name)
            )
        `)
        .order('date', { ascending: false })
        .order('start_time', { ascending: true });

    if (error && error.message.includes('column') && error.message.includes('does not exist')) {
        console.warn("Detailed itineraries fetch failed due to missing columns, falling back to stable version:", error.message);
        const { data: stableData, error: stableError } = await supabase
            .from('itineraries')
            .select(`
                *,
                vessel:vessels(name, capacity),
                stops:itinerary_stops(
                    id, stop_order, arrival_time, departure_time, location_id,
                    location:locations(name, code, type)
                ),
                bookings(id),
                crew:crew_assignments(
                    role,
                    person:people(first_name, last_name)
                )
            `)
            .order('date', { ascending: false })
            .order('start_time', { ascending: true });

        data = stableData;
        error = stableError;
    }

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const body = await request.json();

    // Validate Zod
    const result = itinerarySchema.safeParse(body);
    if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const { stops, ...itineraryData } = result.data;
    const finalData = {
        ...itineraryData,
        created_by_email: user?.email || 'sistema@yadran.cl'
    };

    // 1. Insert Itinerary (No transaction support in Supabase REST client directly, doing sequential)
    // Ideally we use an RPC, but for now sequential. If stops fail, we have an orphan itinerary.
    // TODO: Move to RPC for atomicity.

    const { data: insertedItinerary, error: itinError } = await supabase
        .from('itineraries')
        .insert(finalData)
        .select()
        .single();

    if (itinError) {
        return NextResponse.json({ error: itinError.message }, { status: 400 });
    }

    // 2. Insert Stops
    const stopsToInsert = stops.map((stop, index) => ({
        itinerary_id: insertedItinerary.id,
        location_id: stop.location_id,
        stop_order: index, // Ensure order is 0, 1, 2...
        arrival_time: stop.arrival_time || null,
        departure_time: stop.departure_time || null,
    }));

    const { error: stopsError } = await supabase
        .from('itinerary_stops')
        .insert(stopsToInsert);

    if (stopsError) {
        // Rollback itinerary... (manual compensation)
        await supabase.from('itineraries').delete().eq('id', insertedItinerary.id);
        return NextResponse.json({ error: "Failed to save stops: " + stopsError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, id: insertedItinerary.id });
}
