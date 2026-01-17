import { createAdminClient } from '@/utils/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params;
        const supabase = createAdminClient();

        // Call the RPC function that bypasses RLS and updates the assignment
        const { data: success, error } = await supabase.rpc('confirm_crew_assignment', {
            p_token: token
        });

        if (error) {
            console.error('❌ Error confirming crew assignment:', error);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        if (!success) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('🔥 Critical error in crew confirmation API:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
