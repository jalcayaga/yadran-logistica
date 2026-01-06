import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { vesselSchema } from '@/utils/zod_schemas';

export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const { data, error } = await supabase.from('vessels').select('*').order('name');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const body = await request.json();
    const result = vesselSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });

    const { data, error } = await supabase.from('vessels').insert(result.data).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
}
