'use client';

import { useState, useEffect } from 'react';
import { Itinerary } from '@/utils/zod_schemas';
import StatsOverview from '../_components/StatsOverview';
import DailyPlanCard, { ItineraryDisplay } from '../_components/DailyPlanCard';
import { format, isToday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function LogisticsDashboard() {
    const [itineraries, setItineraries] = useState<ItineraryDisplay[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());

    useEffect(() => {
        const fetchItineraries = async () => {
            try {
                const res = await fetch('/api/itineraries');
                if (res.ok) {
                    const data = await res.json();
                    setItineraries(data);
                }
            } catch (error) {
                console.error("Failed to fetch itineraries", error);
            } finally {
                setLoading(false);
            }
        };
        fetchItineraries();
    }, []);

    // Filter logic: Show selected date's itineraries
    const filteredItineraries = itineraries.filter(itin => {
        const itinDate = parseISO(itin.date); // Assuming YYYY-MM-DD
        // Simple comparison of YYYY-MM-DD strings to avoid Timezone issues
        return format(itinDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
    });

    // Sort by time
    filteredItineraries.sort((a, b) => a.start_time.localeCompare(b.start_time));

    // Calculate Stats
    const stats = {
        total: filteredItineraries.length,
        inProgress: filteredItineraries.filter(i => i.status === 'in_progress').length,
        completed: filteredItineraries.filter(i => i.status === 'completed').length,
        pending: filteredItineraries.filter(i => i.status === 'scheduled').length,
    };

    // Date formatting helper
    const formattedDate = format(selectedDate, "EEEE d 'de' MMMM, yyyy", { locale: es });
    const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div className="flex flex-col">
                    <h1 className="text-3xl font-bold text-foreground">Panel Operativo</h1>
                    <p className="text-muted-foreground capitalize">
                        {capitalizedDate}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Fecha:</label>
                    <input
                        type="date"
                        className="border rounded px-3 py-2 bg-background text-foreground"
                        value={format(selectedDate, 'yyyy-MM-dd')}
                        onChange={(e) => {
                            if (e.target.value) {
                                // Create date from input string (YYYY-MM-DD) carefully to avoid timezone shifts
                                const [y, m, d] = e.target.value.split('-').map(Number);
                                setSelectedDate(new Date(y, m - 1, d));
                            }
                        }}
                    />
                </div>
            </div>

            <StatsOverview {...stats} />

            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">Itinerarios del Día</h2>
                {loading ? (
                    <div className="text-center py-10">Cargando operaciones...</div>
                ) : filteredItineraries.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed rounded-lg text-muted-foreground">
                        No hay itinerarios programados para esta fecha.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredItineraries.map((itin) => (
                            <DailyPlanCard key={itin.id} itinerary={itin} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
