import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';


export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient();
    const { id } = await params;
    const body = await request.json();
    const { itinerary_id, passenger_id, origin_stop_id, destination_stop_id, status } = body;

    // If stops are changing, validate capacity
    if (origin_stop_id && destination_stop_id) {
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

        if (!origin || !destination) return NextResponse.json({ error: "Stops not found" }, { status: 400 });
        if (origin.stop_order >= destination.stop_order) return NextResponse.json({ error: "Origin must be before destination" }, { status: 400 });

        // 2. CHECK CAPACITY (Excluding current booking)
        const { data: hasCapacity, error: capacityError } = await supabase
            .rpc('check_capacity', {
                p_itinerary_id: itinerary_id,
                p_active_booking_id: id,
                p_start_order: origin.stop_order,
                p_end_order: destination.stop_order
            });

        if (capacityError) {
            console.error("Capacity check error:", capacityError);
            return NextResponse.json({ error: "Error checking capacity" }, { status: 500 });
        }

        if (hasCapacity === false) {
            return NextResponse.json({ error: "No capacity available for this segment" }, { status: 409 });
        }
    }

    const updateData: any = {};
    if (passenger_id) updateData.passenger_id = passenger_id;
    if (origin_stop_id) updateData.origin_stop_id = origin_stop_id;
    if (destination_stop_id) updateData.destination_stop_id = destination_stop_id;
    if (status) updateData.status = status;

    const { data: booking, error: updateError } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, booking });
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient();
    const { id } = await params;

    const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}

