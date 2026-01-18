import { createAdminClient } from '@/utils/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

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
            return NextResponse.json({ success: true, type: 'crew' });
        }

        // 2. Try confirming as booking
        const { data: successBooking, error: errorBooking } = await supabase.rpc('confirm_booking', {
            p_token: token
        });

        if (successBooking) {
            return NextResponse.json({ success: true, type: 'passenger' });
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
