import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { personSchema } from '@/utils/zod_schemas';
import { normalizeRut } from '@/utils/formatters';

export async function GET(request: NextRequest) {
    const supabase = await createClient(); // Authenticated client

    const { data, error } = await supabase
        .from('people')
        .select('*')
        .order('last_name', { ascending: true })
        .order('first_name', { ascending: true });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const body = await request.json();

    // Normalize RUT before validation if present, or let UI handle it?
    // User said "guardar rut_normalized". Best to enforce it here too.
    if (body.rut_normalized) {
        body.rut_normalized = normalizeRut(body.rut_normalized);
    }

    const result = personSchema.safeParse(body);

    if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const { data, error } = await supabase
        .from('people')
        .insert(result.data)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
}
