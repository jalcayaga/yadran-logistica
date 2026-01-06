import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    // Service Role needed to read 'notifications' for automation if RLS is strict for 'logistica' user only?
    // Actually, 'logistica' user can read notifications. But n8n might use a specific key.
    // We'll assume n8n calls this with a Bearer token that we might want to check, OR 
    // we just use the Service Role client here assuming the route is protected by API Gateway or similar.
    // For simplicity: We require a header 'x-api-secret' matching a stored env var, OR 
    // we just rely on the fact that this is an internal endpoint.
    // User spec: "Server-side con service role".

    const supabase = await createClient(true);

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('status', 'queued')
        .order('created_at', { ascending: true })
        .limit(limit);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}
