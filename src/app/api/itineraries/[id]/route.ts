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

    // Validate status if present
    if (body.status) {
        const statusVal = ItineraryStatusEnum.safeParse(body.status);
        if (!statusVal.success) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }
    }

    const { data, error } = await supabase
        .from('itineraries')
        .update(body)
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
