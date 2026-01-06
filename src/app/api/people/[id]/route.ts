import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { personSchema } from '@/utils/zod_schemas';
import { normalizeRut } from '@/utils/formatters';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient();
    const { id } = await params;

    const { data, error } = await supabase
        .from('people')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(data);
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient();
    const { id } = await params;
    const body = await request.json();

    // Normalize RUT if present
    if (body.rut_normalized) {
        body.rut_normalized = normalizeRut(body.rut_normalized);
    }

    const result = personSchema.partial().safeParse(body);

    if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const { data, error } = await supabase
        .from('people')
        .update(result.data)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient();
    const { id } = await params;

    const { error } = await supabase
        .from('people')
        .delete()
        .eq('id', id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
}
