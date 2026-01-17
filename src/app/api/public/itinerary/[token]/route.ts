import { createAdminClient } from '@/utils/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
    try {
        const supabase = createAdminClient();
        const { token } = await params;

        // 1. Verify token
        console.log("🔍 [Public API] Verifying tracking token:", token);
        const { data: share, error: shareError } = await supabase
            .from('itinerary_shares')
            .select('itinerary_id, expires_at, revoked')
            .eq('token', token)
            .single();

        if (shareError || !share) {
            console.error("❌ [Public API] Token verification error:", shareError);
            return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
        }

        console.log("✅ [Public API] Token valid for itinerary:", share.itinerary_id);

        if (share.revoked) {
            return NextResponse.json({ error: 'Link revoked' }, { status: 410 });
        }

        if (share.expires_at && new Date(share.expires_at) < new Date()) {
            console.warn("⚠️ [Public API] Token expired:", share.expires_at);
            return NextResponse.json({ error: 'Link expired' }, { status: 410 });
        }

        // 2. Fetch Itinerary Data (Trip + Stops)
        console.log("📡 [Public API] Fetching trip data for ID:", share.itinerary_id);

        // Let's try a simpler select without aliases first to rule out syntax issues
        const { data: itinerary, error: itinError } = await supabase
            .from('itineraries')
            .select('*')
            .eq('id', share.itinerary_id)
            .single();

        if (itinError || !itinerary) {
            console.error("❌ [Public API] Itinerary fetch error:", itinError);
            return NextResponse.json({
                error: 'Itinerary not found',
                details: itinError?.message
            }, { status: 404 });
        }

        // 3. Fetch Stops separately to be ultra-safe
        const { data: stops, error: stopsError } = await supabase
            .from('itinerary_stops')
            .select('*, location:locations(name, code)')
            .eq('itinerary_id', itinerary.id)
            .order('stop_order', { ascending: true });

        if (stopsError) {
            console.warn("⚠️ [Public API] Stops fetch error:", stopsError);
        }

        // 4. Fetch Vessel separately
        if (itinerary.vessel_id) {
            const { data: vessel } = await supabase
                .from('vessels')
                .select('name')
                .eq('id', itinerary.vessel_id)
                .single();
            itinerary.vessel = vessel;
        }

        console.log("📦 [Public API] Data combined successfully");
        return NextResponse.json({ ...itinerary, stops });
    } catch (err: any) {
        console.error("🔥 [Public API] Critical error:", err);
        return NextResponse.json({
            error: 'Internal Server Error',
            message: err.message,
            stack: err.stack
        }, { status: 500 });
    }
}
