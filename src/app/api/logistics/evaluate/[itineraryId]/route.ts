import { createAdminClient } from '@/utils/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ itineraryId: string }> }
) {
    try {
        const { itineraryId } = await params;
        const supabase = createAdminClient();

        // 1. Fetch Itinerary with vessel and vessel_type
        const { data: itinerary, error: itinError } = await supabase
            .from('itineraries')
            .select(`
                *,
                vessel:vessels(*),
                vessel_type:vessel_types(*)
            `)
            .eq('id', itineraryId)
            .single();

        if (itinError || !itinerary) {
            return NextResponse.json({ error: 'Itinerary not found' }, { status: 404 });
        }

        const vesselType = itinerary.vessel_type || itinerary.vessel?.vessel_type; // Fallback if linked via vessel

        // 2. Fetch Itinerary Stops (Centers)
        const { data: stops, error: stopsError } = await supabase
            .from('itinerary_stops')
            .select('*, location:locations(*)')
            .eq('itinerary_id', itineraryId)
            .order('stop_order', { ascending: true });

        if (stopsError) {
            return NextResponse.json({ error: 'Error fetching stops' }, { status: 500 });
        }

        const reasons: string[] = [];
        let finalDecision: string = 'GO';

        // 3. Process each stop for weather and port status
        for (const stop of (stops || [])) {
            const locationId = stop.location_id;
            const portCode = stop.location?.port_code || (stop.location as any).port_code; // If we added it to locations

            // A. Check Weather Snapshot
            const { data: weather } = await supabase
                .from('center_weather_snapshots')
                .select('*')
                .eq('location_id', locationId)
                .order('timestamp', { ascending: false })
                .limit(1)
                .single();

            if (weather && vesselType) {
                if (weather.wind_speed > vesselType.max_wind_knots) {
                    finalDecision = 'NO-GO';
                    reasons.push(`Viento excesivo en ${stop.location.name}: ${weather.wind_speed}kt (Máx: ${vesselType.max_wind_knots}kt)`);
                } else if (weather.wind_speed > vesselType.max_wind_knots * 0.8) {
                    if (finalDecision !== 'NO-GO') finalDecision = 'EVAL';
                    reasons.push(`Viento límite en ${stop.location.name}: ${weather.wind_speed}kt`);
                }

                if (weather.wave_height > vesselType.max_wave_meters) {
                    finalDecision = 'NO-GO';
                    reasons.push(`Oleaje excesivo en ${stop.location.name}: ${weather.wave_height}m (Máx: ${vesselType.max_wave_meters}m)`);
                }
            } else if (!weather) {
                // reasons.push(`Sin datos climáticos recientes para ${stop.location.name}`);
                // If no data, we might want EVAL
                if (finalDecision === 'GO') finalDecision = 'EVAL';
            }

            // B. Check Port Status
            if (portCode) {
                const { data: portStatus } = await supabase
                    .from('external_port_status')
                    .select('*')
                    .eq('port_code', portCode)
                    .single();

                if (portStatus) {
                    if (portStatus.status === 'CERRADO') {
                        finalDecision = 'NO-GO';
                        reasons.push(`Puerto ${portCode} CERRADO por Directemar`);
                    } else if (portStatus.status === 'RESTRINGIDO') {
                        if (finalDecision !== 'NO-GO') finalDecision = 'EVAL';
                        reasons.push(`Puerto ${portCode} RESTRINGIDO por Directemar`);
                    }
                }
            }
        }

        // Summary generation
        let summary = "Condiciones óptimas para la navegación.";
        if (finalDecision === 'NO-GO') {
            summary = "SE RECOMIENDA NO SALIR. Condiciones críticas detectadas.";
        } else if (finalDecision === 'EVAL') {
            summary = "EVALUAR SALIDA. Existen condiciones límite o falta de información.";
        }

        return NextResponse.json({
            decision: finalDecision,
            summary,
            reasons,
            vessel_limits: vesselType ? {
                wind: vesselType.max_wind_knots,
                wave: vesselType.max_wave_meters
            } : null
        });

    } catch (error: any) {
        console.error('🔥 Evaluation Error:', error);
        return NextResponse.json({ error: 'Error interno en motor de decisión' }, { status: 500 });
    }
}
