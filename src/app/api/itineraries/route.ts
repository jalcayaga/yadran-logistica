import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { itinerarySchema } from '@/utils/zod_schemas';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
        // Fallback: If PostgREST has stale schema cache for 'created_by_email', try without it
        if (itinError.message.includes('created_by_email') && itinError.message.includes('schema cache')) {
            console.warn("Schema cache stale for created_by_email, retrying without it...");
            const { data: fallbackItin, error: fallbackError } = await supabase
                .from('itineraries')
                .insert(itineraryData)
                .select()
                .single();

            if (fallbackError) return NextResponse.json({ error: fallbackError.message }, { status: 400 });
            return await handleStops(fallbackItin, stops);
        }
        return NextResponse.json({ error: itinError.message }, { status: 400 });
    }

    return await handleStops(insertedItinerary, stops);
}

// Helper to handle stops insertion to avoid repeating code in fallback
async function handleStops(itinerary: any, stops: any[]) {
    const supabase = await createClient();
    const stopsToInsert = stops.map((stop, index) => ({
        itinerary_id: itinerary.id,
        location_id: stop.location_id,
        stop_order: index,
        arrival_time: stop.arrival_time || null,
        departure_time: stop.departure_time || null,
    }));

    const { error: stopsError } = await supabase
        .from('itinerary_stops')
        .insert(stopsToInsert);

    if (stopsError) {
        await supabase.from('itineraries').delete().eq('id', itinerary.id);
        return NextResponse.json({ error: "Failed to save stops: " + stopsError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, id: itinerary.id });
}
