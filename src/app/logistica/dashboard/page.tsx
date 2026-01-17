'use client';

import { useState, useEffect } from 'react';
import StatsOverview from '../_components/StatsOverview';
import DailyPlanCard, { ItineraryDisplay } from '../_components/DailyPlanCard';
import { format, parseISO, isSameDay, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    Activity,
    Calendar,
    Clock,
    Filter,
    ChevronRight,
    Layers,
    CalendarDays,
    Settings2,
    Search,
    AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type FilterType = 'today' | 'week' | 'agenda' | 'all-active' | 'all' | 'custom';

export default function LogisticsDashboard() {
    const [itineraries, setItineraries] = useState<ItineraryDisplay[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterType, setFilterType] = useState<FilterType>('today');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [searchTerm, setSearchTerm] = useState('');

    const fetchItineraries = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/itineraries');
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Err. Servidor');
            }
            const data = await res.json();
            setItineraries(data || []);
        } catch (error: any) {
            console.error("Failed to fetch itineraries", error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItineraries();
    }, []);

    const getFilteredItineraries = () => {
        let filtered = [...itineraries];

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(i =>
                i.vessel?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                i.stops?.some(s => s.location.name.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        // Time context
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const lastWeek = addDays(new Date(), -7);
        const nextWeek = addDays(new Date(), 7);

        switch (filterType) {
            case 'today':
                filtered = filtered.filter(itin => itin.date === todayStr);
                break;
            case 'week': // Last 7 days
                const startRangeStr = format(addDays(new Date(), -7), 'yyyy-MM-dd');
                const endRangeStr = format(new Date(), 'yyyy-MM-dd');
                filtered = filtered.filter(itin => {
                    return itin.date >= startRangeStr && itin.date <= endRangeStr;
                });
                break;
            case 'agenda': // Next 7 days
                const agendaStartStr = format(new Date(), 'yyyy-MM-dd');
                const agendaEndStr = format(addDays(new Date(), 7), 'yyyy-MM-dd');
                filtered = filtered.filter(itin => {
                    return itin.date >= agendaStartStr && itin.date <= agendaEndStr;
                });
                break;
            case 'all-active':
                filtered = filtered.filter(itin => itin.status === 'scheduled' || itin.status === 'in_progress' || itin.status === 'suspended');
                break;
            case 'all':
                // No status/time filter, show absolute everything
                break;
            case 'custom':
                const selectedStr = format(selectedDate, 'yyyy-MM-dd');
                filtered = filtered.filter(itin => itin.date === selectedStr);
                break;
        }

        // Sort: If history, descending. If agenda/today, ascending.
        return filtered.sort((a, b) => {
            const dateCompare = (filterType === 'week')
                ? b.date.localeCompare(a.date)
                : a.date.localeCompare(b.date);
            if (dateCompare !== 0) return dateCompare;
            return (filterType === 'week')
                ? b.start_time.localeCompare(a.start_time)
                : a.start_time.localeCompare(b.start_time);
        });
    };

    const displayItineraries = getFilteredItineraries();

    // Calculate Stats for all itineraries (unfiltered context)
    const statsData = {
        total: itineraries.length,
        inProgress: itineraries.filter(i => i.status === 'in_progress').length,
        completed: itineraries.filter(i => i.status === 'completed').length,
        pending: itineraries.filter(i => i.status === 'scheduled').length,
        suspended: itineraries.filter(i => i.status === 'suspended').length,
        cancelled: itineraries.filter(i => i.status === 'cancelled').length,
        crewConfirmed: itineraries.filter(i => i.crew && i.crew.length > 0 && i.crew.every(c => c.confirmed_at)).length,
    };

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-8 gap-6">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-600 text-white p-2.5 rounded-2xl shadow-xl shadow-emerald-500/20">
                            <Activity className="w-7 h-7 animate-pulse" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
                                Panel Operativo
                            </h1>
                            <p className="text-muted-foreground text-sm font-medium flex items-center gap-2">
                                <Clock className="w-4 h-4 text-emerald-500" />
                                <span>{format(new Date(), "EEEE d 'de' MMMM", { locale: es }).toUpperCase()}</span>
                                <ChevronRight className="w-3 h-3 text-slate-300" />
                                <span className="text-slate-900 dark:text-slate-200 font-bold">MONITOREO EN VIVO</span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    <div className="relative group flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-emerald-500 transition-colors" />
                        <Input
                            placeholder="Buscar nave o destino..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 h-11 bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 font-medium"
                        />
                    </div>
                    {filterType === 'custom' && (
                        <div className="relative animate-in slide-in-from-right-4 duration-300">
                            <Input
                                type="date"
                                className="h-11 bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 font-bold text-xs uppercase"
                                value={format(selectedDate, 'yyyy-MM-dd')}
                                onChange={(e) => {
                                    if (e.target.value) {
                                        const [y, m, d] = e.target.value.split('-').map(Number);
                                        setSelectedDate(new Date(y, m - 1, d));
                                    }
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>

            <StatsOverview {...statsData} />

            {/* Filter Tabs */}
            <div className="flex flex-col gap-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl">
                        {[
                            { id: 'today', label: 'Hoy', icon: Calendar },
                            { id: 'week', label: 'Últimos 7 Días', icon: Clock },
                            { id: 'agenda', label: 'Próximos 7 Días', icon: Layers },
                            { id: 'all-active', label: 'Todo Activo', icon: Activity },
                            { id: 'all', label: 'Ver Todo', icon: Filter },
                            { id: 'custom', label: 'Calendario', icon: CalendarDays },
                        ].map((tab) => (
                            <Button
                                key={tab.id}
                                variant={filterType === tab.id ? 'default' : 'ghost'}
                                onClick={() => setFilterType(tab.id as any)}
                                className={cn(
                                    "h-9 px-4 text-[11px] font-black uppercase rounded-lg transition-all",
                                    filterType === tab.id
                                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-md"
                                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                                )}
                            >
                                <tab.icon className="w-3.5 h-3.5 mr-2" />
                                {tab.label}
                            </Button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-full border border-slate-100 dark:border-slate-800">
                        <Settings2 className="w-3 h-3" />
                        Mostrando {displayItineraries.length} resultados
                    </div>
                </div>

                {/* Error State */}
                {error && (
                    <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <div className="flex-1 flex justify-between items-center">
                            <span className="text-sm font-bold uppercase tracking-tight">Error de carga: {error}</span>
                            <Button variant="ghost" size="sm" onClick={fetchItineraries} className="h-8 text-xs font-black uppercase text-red-600 hover:bg-red-100">
                                Reintentar
                            </Button>
                        </div>
                    </div>
                )}

                {/* Content Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-64 bg-slate-100 dark:bg-slate-800/50 rounded-3xl animate-pulse" />
                        ))}
                    </div>
                ) : displayItineraries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 px-6 bg-slate-50/50 dark:bg-slate-900/30 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 text-center">
                        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-xl mb-4">
                            <CalendarDays className="w-12 h-12 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase mb-1">Sin Itinerarios</h3>
                        <p className="text-slate-500 text-sm max-w-xs mx-auto mb-6">
                            No se encontraron planeaciones para los criterios seleccionados ({filterType}).
                        </p>
                        <Button
                            variant="outline"
                            onClick={fetchItineraries}
                            className="rounded-xl font-bold uppercase text-[10px] tracking-widest border-slate-200"
                        >
                            Actualizar Datos
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
                        {displayItineraries.map((itin) => (
                            <DailyPlanCard key={itin.id} itinerary={itin} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
