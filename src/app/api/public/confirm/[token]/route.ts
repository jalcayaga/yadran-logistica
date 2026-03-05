import { createAdminClient } from '@/utils/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateItineraryToken } from '@/utils/itinerary-token';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params;
        const supabase = createAdminClient();

        // 1. Try confirming as crew
        const { data: successCrew, error: errorCrew } = await supabase.rpc('confirm_crew_assignment', {
            p_token: token
        });

        if (successCrew) {
            const { data: crewData } = await supabase
                .from('crew_assignments')
                .select('role, itinerary_id, itineraries(date, start_time)')
                .eq('confirmation_token', token)
                .single();

            let trackingToken = null;
            if (crewData?.itineraries) {
                const itin = crewData.itineraries as any;
                trackingToken = await getOrCreateItineraryToken(crewData.itinerary_id, itin.date, itin.start_time);
            }

            return NextResponse.json({
                success: true,
                type: 'crew',
                role: crewData?.role || 'member',
                tracking_token: trackingToken
            });
        }

        // 2. Try confirming as booking
        const { data: successBooking, error: errorBooking } = await supabase.rpc('confirm_booking', {
            p_token: token
        });

        if (successBooking) {
            const { data: bookingData } = await supabase
                .from('bookings')
                .select('itinerary_id, itineraries(date, start_time)')
                .eq('confirmation_token', token)
                .single();

            let trackingToken = null;
            if (bookingData?.itineraries) {
                const itin = bookingData.itineraries as any;
                trackingToken = await getOrCreateItineraryToken(bookingData.itinerary_id, itin.date, itin.start_time);
            }

            return NextResponse.json({
                success: true,
                type: 'passenger',
                tracking_token: trackingToken
            });
        }

        if (errorCrew || errorBooking) {
            console.error('❌ Error confirming:', { errorCrew, errorBooking });
        }

        return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 404 });

    } catch (err: any) {
        console.error('🔥 Critical error in confirmation API:', err);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
