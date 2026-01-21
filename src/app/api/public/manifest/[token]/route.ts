import { createAdminClient } from '@/utils/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params;
        const supabase = createAdminClient();

        // 1. Get crew assignment and check if it's a captain/substitute
        const { data: crew, error: crewError } = await supabase
            .from('crew_assignments')
            .select(`
                id,
                role,
                confirmed_at,
                person:people(first_name, last_name, phone_e164),
                itinerary:itineraries(*)
            `)
            .eq('confirmation_token', token)
            .single();

        if (crewError || !crew) {
            console.error('❌ Manifest API: Invalid token', token);
            return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 404 });
        }

        const itinerary = crew.itinerary as any;

        // 2. Fetch bookings for this itinerary
        const { data: bookings, error: bookingsError } = await supabase
            .from('bookings')
            .select(`
                id,
                status,
                confirmed_at,
                passenger:people(first_name, last_name, company),
                origin_stop:itinerary_stops!bookings_origin_stop_id_fkey(location:locations(name)),
                destination_stop:itinerary_stops!bookings_destination_stop_id_fkey(location:locations(name))
            `)
            .eq('itinerary_id', itinerary.id)
            .neq('status', 'cancelled');

        // 3. Fetch vessel details
        const { data: vessel } = await supabase
            .from('vessels')
            .select('*')
            .eq('id', itinerary.vessel_id)
            .single();

        // 4. Fetch itinerary stops
        const { data: stops } = await supabase
            .from('itinerary_stops')
            .select('*, location:locations(name, code)')
            .eq('itinerary_id', itinerary.id)
            .order('stop_order', { ascending: true });

        // Calculate stats
        const confirmedCount = (bookings || []).filter(b => b.status === 'confirmed').length;
        const totalCount = (bookings || []).length;

        return NextResponse.json({
            itinerary: {
                ...itinerary,
                vessel,
                stops: stops || []
            },
            crew_member: {
                name: `${(crew.person as any).first_name} ${(crew.person as any).last_name}`,
                role: crew.role,
                confirmed_at: crew.confirmed_at
            },
            passengers: bookings || [],
            stats: {
                total: totalCount,
                confirmed: confirmedCount,
                pending: totalCount - confirmedCount
            }
        });

    } catch (error: any) {
        console.error('🔥 Manifest API Error:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
