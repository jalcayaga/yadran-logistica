import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { itinerarySegmentSchema } from '@/utils/zod_schemas';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient();
    const { id } = await params;
    const body = await request.json();

    const result = itinerarySegmentSchema.safeParse({ ...body, itinerary_id: id });

    if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const { data, error } = await supabase
        .from('itinerary_segments')
        .insert(result.data)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
}
