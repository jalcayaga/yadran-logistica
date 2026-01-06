import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { routeSchema } from '@/utils/zod_schemas';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('routes').select(`
    *,
    origin:locations!origin_location_id(name),
    destination:locations!destination_location_id(name),
    operator:operators(name),
    vessel:vessels(name)
  `);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();
  const result = routeSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });

  const { data, error } = await supabase.from('routes').insert(result.data).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
