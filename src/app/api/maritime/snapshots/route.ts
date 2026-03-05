import { createAdminClient } from '@/utils/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const supabase = createAdminClient();

        // 1. Fetch all ports with their current status
        const { data: ports, error: portsError } = await supabase
            .from('ports')
            .select(`
                *,
                status:external_port_status(*)
            `);

        if (portsError) throw portsError;

        // 2. Fetch all locations of type 'center' with their LATEST weather snapshot
        // We use a subquery/clever select to get the latest snapshot per location
        const { data: locations, error: locationsError } = await supabase
            .from('locations')
            .select(`
                id,
                name,
                code,
                type,
                weather:center_weather_snapshots(
                    wind_speed,
                    wind_direction,
                    wind_gust,
                    wave_height,
                    wave_direction,
                    wave_period,
                    swell_wave_height,
                    swell_wave_direction,
                    swell_wave_period,
                    temperature,
                    humidity,
                    pressure,
                    precipitation,
                    timestamp
                )
            `)
            .eq('type', 'center')
            .eq('active', true);

        if (locationsError) throw locationsError;

        // Since the nested select returns an array, we filter/map to get the latest one
        // Note: In a high-traffic scenario, a specialized view or rpc would be better, 
        // but this works well for the current scale.
        const processedCenters = locations.map(loc => {
            const snapshots = (loc.weather as any[]) || [];
            // Sort by timestamp descending and take the first
            const latestWeather = snapshots.length > 0
                ? snapshots.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
                : null;

            let processedWeather = latestWeather;
            if (latestWeather) {
                const hoursOld = (new Date().getTime() - new Date(latestWeather.timestamp).getTime()) / (1000 * 60 * 60);
                processedWeather = {
                    ...latestWeather,
                    is_stale: hoursOld > 6
                };
            }

            return {
                id: loc.id,
                name: loc.name,
                code: loc.code,
                weather: processedWeather
            };
        });

        return NextResponse.json({
            ports: ports.map(p => ({
                ...p,
                status: p.status || null // Direct object, no array [0] needed
            })),
            centers: processedCenters,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('🔥 Maritime Dashboard API Error:', error);
        return NextResponse.json({ error: 'Error fetching maritime data' }, { status: 500 });
    }
}
