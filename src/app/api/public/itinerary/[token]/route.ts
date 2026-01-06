import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
    // Use Service Role to bypass RLS because this is a public access via token
    const supabase = await createClient(true);
    const { token } = await params;

    // 1. Verify token
    const { data: share, error: shareError } = await supabase
        .from('itinerary_shares')
        .select('itinerary_id, expires_at, revoked')
        .eq('token', token)
        .single();

    if (shareError || !share) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
    }

    if (share.revoked) {
        return NextResponse.json({ error: 'Link revoked' }, { status: 410 });
    }

    if (share.expires_at && new Date(share.expires_at) < new Date()) {
        return NextResponse.json({ error: 'Link expired' }, { status: 410 });
    }

    // 2. Fetch Itinerary Data (Person + Segments)
    const { data: itinerary, error: itinError } = await supabase
        .from('itineraries')
        .select(`
      id, status, start_date,
      people ( full_name, company, rut_display ),
      itinerary_segments (
        id, seq, mode, departure_at, presentation_at, ticket, notes,
        origin:locations!origin_location_id(name, code),
        destination:locations!destination_location_id(name, code),
        operator:operators(name),
        vessel:vessels(name)
      )
    `)
        .eq('id', share.itinerary_id)
        .single();

    if (itinError || !itinerary) {
        return NextResponse.json({ error: 'Itinerary not found' }, { status: 404 });
    }

    // Sort segments by seq
    // Sort segments by seq
    itinerary.itinerary_segments.sort((a: any, b: any) => a.seq - b.seq);

    return NextResponse.json(itinerary);
}
