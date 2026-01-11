import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { notifyBookingConfirmation } from '@/lib/notifications';

export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const itinerary_id = searchParams.get('itinerary_id');

    if (!itinerary_id) {
        return NextResponse.json({ error: "Itinerary ID required" }, { status: 400 });
    }

    const { data, error } = await supabase
        .from('bookings')
        .select(`
            id, status,
            passenger:people(id, first_name, last_name, rut_display),
            origin_stop:itinerary_stops!bookings_origin_stop_id_fkey(id, stop_order, location:locations(name)),
            destination_stop:itinerary_stops!bookings_destination_stop_id_fkey(id, stop_order, location:locations(name))
        `)
        .eq('itinerary_id', itinerary_id);

    if (error) {
        console.error("Error fetching bookings:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const body = await request.json();

    const { itinerary_id, passenger_id, origin_stop_id, destination_stop_id } = body;

    // 1. Get Stop Orders to determine segment range
    const { data: stops, error: stopsError } = await supabase
        .from('itinerary_stops')
        .select('id, stop_order')
        .in('id', [origin_stop_id, destination_stop_id]);

    if (stopsError || !stops || stops.length !== 2) {
        return NextResponse.json({ error: "Invalid stops provided" }, { status: 400 });
    }

    const origin = stops.find(s => s.id === origin_stop_id);
    const destination = stops.find(s => s.id === destination_stop_id);

    if (!origin || !destination) {
        return NextResponse.json({ error: "Stops not found" }, { status: 400 });
    }

    if (origin.stop_order >= destination.stop_order) {
        return NextResponse.json({ error: "Origin must be before destination" }, { status: 400 });
    }

    // 2. CALL THE BRAIN: check_capacity(itinerary_id, null, start, end)
    const { data: hasCapacity, error: capacityError } = await supabase
        .rpc('check_capacity', {
            p_itinerary_id: itinerary_id,
            p_active_booking_id: null,
            p_start_order: origin.stop_order,
            p_end_order: destination.stop_order
        });

    if (capacityError) {
        console.error("Capacity check error:", capacityError);
        return NextResponse.json({ error: "Error checking capacity" }, { status: 500 });
    }

    if (hasCapacity === false) {
        return NextResponse.json({ error: "No capacity available for this segment" }, { status: 409 }); // 409 Conflict
    }

    // 3. Create Booking
    const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
            itinerary_id,
            passenger_id,
            origin_stop_id,
            destination_stop_id,
            status: 'confirmed'
        })
        .select()
        .single();

    if (bookingError) {
        return NextResponse.json({ error: bookingError.message }, { status: 400 });
    }

    // 4. Notifications (Fire and Forget)
    await notifyBookingConfirmation(booking.id);

    return NextResponse.json({ success: true, booking });
}
