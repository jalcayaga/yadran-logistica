import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ItineraryStatusEnum } from '@/utils/zod_schemas';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient();
    const { id } = await params;

    const { data, error } = await supabase
        .from('itineraries')
        .select(`
      *,
      people:person_id (
        first_name,
        last_name,
        rut_display,
        company,
        phone_e164
      ),
      segments:itinerary_segments (
        *,
        origin:locations!origin_location_id(name),
        destination:locations!destination_location_id(name),
        operator:operators!operator_id(name),
        vessel:vessels!vessel_id(name)
      )
    `)
        .eq('id', id)
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json(data);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient();
    const { id } = await params;
    const body = await request.json();

    // 1. Separate stops from header data
    const { stops, ...headerData } = body;

    // Validate status if present
    if (headerData.status) {
        const statusVal = ItineraryStatusEnum.safeParse(headerData.status);
        if (!statusVal.success) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }
    }

    // 2. Handle Stops Update (if provided)
    if (stops && Array.isArray(stops)) {
        // A. Delete existing stops
        // This will FAIL if bookings exist (FK constraint)
        const { error: deleteError } = await supabase
            .from('itinerary_stops')
            .delete()
            .eq('itinerary_id', id);

        if (deleteError) {
            console.error("Error deleting stops:", deleteError);
            if (deleteError.code === '23503') { // Foreign Key Violation
                return NextResponse.json({
                    error: 'No se puede modificar la ruta porque existen reservas activas. Cancele las reservas primero.'
                }, { status: 409 });
            }
            return NextResponse.json({ error: 'Error removing old stops: ' + deleteError.message }, { status: 500 });
        }

        // B. Insert new stops
        if (stops.length > 0) {
            const stopsToInsert = stops.map((stop: any, index: number) => ({
                itinerary_id: id,
                location_id: stop.location_id,
                stop_order: index,
                arrival_time: stop.arrival_time || null,
                departure_time: stop.departure_time || null,
            }));

            const { error: insertError } = await supabase
                .from('itinerary_stops')
                .insert(stopsToInsert);

            if (insertError) {
                return NextResponse.json({ error: 'Error inserting new stops: ' + insertError.message }, { status: 500 });
            }
        }
    }

    // 3. Update Itinerary Header
    const { data, error } = await supabase
        .from('itineraries')
        .update(headerData)
        .eq('id', id)
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
}
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient();
    const { id } = await params;

    const { error } = await supabase
        .from('itineraries')
        .delete()
        .eq('id', id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
