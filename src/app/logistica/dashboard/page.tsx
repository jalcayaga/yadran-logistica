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

    useEffect(() => {
        const fetchItineraries = async () => {
            try {
                const res = await fetch('/api/itineraries');
                if (res.ok) {
                    const data = await res.json();
                    // In a real app we might filter by date on the server
                    // For now, let's filter client side for "Today" + "Active"
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

    // Filter logic: Show TODAY's itineraries and any active ones from previous days
    const todaysItineraries = itineraries.filter(itin => {
        const itinDate = parseISO(itin.date); // Assuming YYYY-MM-DD
        return isToday(itinDate) || itin.status === 'in_progress';
    });

    // Sort by time
    todaysItineraries.sort((a, b) => a.start_time.localeCompare(b.start_time));

    // Calculate Stats
    const stats = {
        total: todaysItineraries.length,
        inProgress: todaysItineraries.filter(i => i.status === 'in_progress').length,
        completed: todaysItineraries.filter(i => i.status === 'completed').length,
        pending: todaysItineraries.filter(i => i.status === 'scheduled').length,
    };

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex flex-col mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Panel Operativo</h1>
                <p className="text-muted-foreground">
                    {format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })}
                </p>
            </div>

            <StatsOverview {...stats} />

            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">Itinerarios del Día</h2>
                {loading ? (
                    <div className="text-center py-10">Cargando operaciones...</div>
                ) : todaysItineraries.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed rounded-lg text-muted-foreground">
                        No hay itinerarios programados para hoy.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {todaysItineraries.map((itin) => (
                            <DailyPlanCard key={itin.id} itinerary={itin} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
