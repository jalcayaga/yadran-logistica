import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient(true); // Service Role
    const { id } = await params;
    const body = await request.json();

    const updates: any = {
        status: body.status,
        updated_at: new Date().toISOString()
    };

    if (body.status === 'sent') {
        updates.sent_at = new Date().toISOString();
        updates.provider_message_id = body.provider_message_id;
    }

    if (body.error) {
        updates.error = body.error;
    }

    const { data, error } = await supabase
        .from('notifications')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}
