'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    Ship,
    Calendar,
    Clock,
    MapPin,
    ChevronRight,
    Anchor,
    AlertCircle,
    Info,
    CheckCircle2
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ItineraryData {
    status: string;
    date: string;
    start_time: string;
    vessel: { name: string; capacity: number };
    stops: {
        id: string;
        stop_order: number;
        arrival_time: string | null;
        departure_time: string | null;
        location: { name: string; code: string; type: string };
    }[];
}

export default function PublicItineraryPage() {
    const { token } = useParams();
    const [data, setData] = useState<ItineraryData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch(`/api/public/itinerary/${token}`);
                if (!res.ok) {
                    const body = await res.json();
                    throw new Error(body.error || 'Error al cargar');
                }
                const json = await res.json();
                setData(json);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        if (token) fetchData();
    }, [token]);

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'scheduled': return { label: 'Programado', color: 'bg-blue-500', text: 'text-blue-500' };
            case 'in_progress': return { label: 'En Curso', color: 'bg-emerald-500', text: 'text-emerald-500' };
            case 'completed': return { label: 'Finalizado', color: 'bg-slate-500', text: 'text-slate-500' };
            case 'suspended': return { label: 'Suspendido', color: 'bg-amber-500', text: 'text-amber-500' };
            case 'cancelled': return { label: 'Cancelado', color: 'bg-rose-500', text: 'text-rose-500' };
            default: return { label: status, color: 'bg-gray-500', text: 'text-gray-500' };
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-xl font-medium animate-pulse">Cargando estado del viaje...</p>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-red-100">
                <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-slate-800 mb-2">Viaje no encontrado</h2>
                <p className="text-slate-500 text-sm mb-6">{error}</p>
                <div className="text-2xl opacity-20 font-black uppercase tracking-widest text-slate-400">Yadran</div>
            </div>
        </div>
    );

    if (!data) return null;

    const statusObj = getStatusInfo(data.status);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 font-sans selection:bg-blue-500/30">
            {/* Header Section */}
            <div className="bg-slate-900 pt-12 pb-32 px-6 lg:px-12 relative overflow-hidden border-b border-white/5">
                {/* Decorative background glows */}
                <div className="absolute top-0 right-0 w-[500px] lg:w-[800px] h-[500px] lg:h-[800px] bg-blue-600/20 rounded-full blur-[100px] lg:blur-[150px] -mr-64 -mt-64 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[400px] lg:w-[600px] h-[400px] lg:h-[600px] bg-emerald-600/10 rounded-full blur-[80px] lg:blur-[120px] -ml-48 -mb-48 pointer-events-none" />

                <div className="max-w-md md:max-w-3xl lg:max-w-5xl mx-auto relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <div className="space-y-1">
                            <h1 className="text-3xl lg:text-5xl font-black uppercase tracking-tight text-white">Estado del Viaje</h1>
                            <p className="text-blue-400 text-xs md:text-sm font-black uppercase tracking-widest">Logística Yadran</p>
                        </div>
                        <div className={`flex items-center gap-2 px-3 lg:px-4 py-1.5 lg:py-2 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest border border-white/10 bg-white/5 shadow-xl backdrop-blur-md ${data.status === 'in_progress' ? 'animate-pulse ring-1 ring-emerald-500/50' : ''}`}>
                            <div className={`w-2 md:w-2.5 h-2 md:h-2.5 rounded-full ${statusObj.color} shadow-[0_0_10px_rgba(0,0,0,0.5)]`} />
                            {statusObj.label}
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 lg:p-10 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

                        <div className="flex flex-col md:flex-row items-start md:items-center gap-5 lg:gap-8 relative z-10">
                            <div className="w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform duration-500 shrink-0">
                                <Ship className="w-7 h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 text-white" />
                            </div>
                            <div>
                                <p className="text-[10px] md:text-xs text-blue-200/50 uppercase font-black tracking-widest leading-none mb-1.5 lg:mb-2">Nave Asignada</p>
                                <p className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white">{data.vessel?.name || 'Nave por asignar'}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-8 pt-5 lg:pt-8 mt-5 lg:mt-8 border-t border-white/10 relative z-10">
                            <div className="md:col-span-2 lg:col-span-1">
                                <p className="text-[10px] md:text-xs text-blue-200/50 uppercase font-black tracking-widest leading-none mb-2 lg:mb-3">Fecha</p>
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                        <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-400" />
                                    </div>
                                    <p className="text-sm md:text-base lg:text-lg font-bold text-slate-200">{format(new Date(data.date + 'T12:00:00'), "d 'de' MMM", { locale: es })}</p>
                                </div>
                            </div>
                            <div className="md:col-span-2 lg:col-span-1">
                                <p className="text-[10px] md:text-xs text-blue-200/50 uppercase font-black tracking-widest leading-none mb-2 lg:mb-3">Hora de Zarpe</p>
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                        <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-400" />
                                    </div>
                                    <p className="text-sm md:text-base lg:text-lg font-bold text-slate-200">{data.start_time}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <main className="max-w-md md:max-w-3xl lg:max-w-5xl mx-auto -mt-20 px-6 lg:px-8 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">

                    {/* Left Column: Timeline */}
                    <div className="lg:col-span-8 space-y-6 lg:space-y-8">
                        {/* Status Alert for special cases */}
                        {(data.status === 'suspended' || data.status === 'cancelled') && (
                            <div className={`p-4 lg:p-6 rounded-2xl lg:rounded-3xl border flex gap-4 lg:gap-5 shadow-2xl backdrop-blur-md ${data.status === 'suspended' ? 'bg-amber-500/10 border-amber-500/30 text-amber-200' : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                                }`}>
                                <AlertCircle className={`w-6 h-6 lg:w-8 lg:h-8 shrink-0 ${data.status === 'suspended' ? 'text-amber-400' : 'text-rose-400'}`} />
                                <div className="flex flex-col justify-center">
                                    <p className="font-bold text-sm lg:text-base tracking-wide text-white">Aviso de {statusObj.label}</p>
                                    <p className="text-xs lg:text-sm opacity-80 mt-1">Por favor contacte a Logística para más información sobre este viaje.</p>
                                </div>
                            </div>
                        )}

                        {/* Timeline of Stops */}
                        <Card className="border border-white/10 shadow-2xl bg-[#0f172a]/80 backdrop-blur-xl overflow-hidden rounded-3xl lg:rounded-[2.5rem]">
                            <CardContent className="p-7 lg:p-10">
                                <p className="text-[10px] lg:text-xs font-black uppercase tracking-widest text-slate-400 mb-8 lg:mb-10 flex items-center gap-2 lg:gap-3 pb-4 lg:pb-6 border-b border-white/5">
                                    <MapPin className="w-4 h-4 lg:w-5 lg:h-5 text-blue-400" /> Itinerario de Navegación
                                </p>

                                <div className="space-y-0 relative mt-4 lg:mt-6">
                                    {/* Vertical line */}
                                    <div className="absolute left-[9px] lg:left-[11px] top-3 bottom-8 lg:bottom-12 w-[2px] lg:w-[3px] bg-gradient-to-b from-blue-500/50 via-slate-700 to-rose-500/50 rounded-full" />

                                    {data.stops?.map((stop, idx) => (
                                        <div key={stop.id} className="relative pl-10 lg:pl-14 pb-10 lg:pb-12 last:pb-2 lg:last:pb-4 group">
                                            <div className={`absolute left-0 top-1.5 lg:top-2 w-5 h-5 lg:w-6 lg:h-6 rounded-full border-4 lg:border-[5px] border-[#0f172a] shadow-lg transition-transform duration-300 group-hover:scale-125 ${idx === 0 ? 'bg-emerald-500 shadow-emerald-500/40' : idx === data.stops.length - 1 ? 'bg-rose-500 shadow-rose-500/40' : 'bg-blue-500 shadow-blue-500/40'
                                                }`} />

                                            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-white/[0.02] p-4 lg:p-6 rounded-2xl lg:rounded-3xl border border-white/5 group-hover:bg-white/[0.04] transition-colors -mt-2 lg:-mt-3">
                                                <div className="space-y-1.5 lg:space-y-2">
                                                    <p className="font-bold text-white text-base lg:text-lg tracking-wide flex flex-wrap items-center gap-2 lg:gap-3">
                                                        {stop.location.name}
                                                        {idx === 0 && <span className="text-[9px] lg:text-[10px] font-black text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full uppercase tracking-widest">Zarpe</span>}
                                                        {idx === data.stops.length - 1 && <span className="text-[9px] lg:text-[10px] font-black text-rose-400 bg-rose-400/10 border border-rose-400/20 px-2 py-0.5 rounded-full uppercase tracking-widest">Llegada</span>}
                                                    </p>
                                                    <div className="flex items-center gap-3 lg:gap-4 pt-1">
                                                        <Badge variant="secondary" className="bg-slate-800 text-slate-300 border border-slate-700 text-[10px] lg:text-xs font-black tracking-wider px-2 lg:px-3 py-0.5 lg:py-1">
                                                            {stop.location.code}
                                                        </Badge>
                                                        {stop.arrival_time && (
                                                            <span className="text-xs lg:text-sm font-medium text-blue-300/80 flex items-center gap-1.5 lg:gap-2">
                                                                <Clock className="w-3 h-3 lg:w-4 lg:h-4" /> {stop.arrival_time.substring(0, 5)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Alerts & Helpful Info */}
                    <div className="lg:col-span-4 space-y-6 lg:space-y-8 lg:pt-0">
                        {/* Helpful Info Card */}
                        <div className="bg-gradient-to-br from-blue-900/40 to-slate-900/40 border border-blue-500/20 rounded-3xl lg:rounded-[2.5rem] p-7 lg:p-10 text-center space-y-4 lg:space-y-6 shadow-xl backdrop-blur-md relative overflow-hidden">
                            <div className="absolute -right-6 lg:-right-10 -top-6 lg:-top-10 w-24 h-24 lg:w-40 lg:h-40 bg-blue-500/20 rounded-full blur-2xl lg:blur-3xl pointer-events-none" />
                            <div className="w-12 h-12 lg:w-16 lg:h-16 bg-blue-500/20 border border-blue-500/30 rounded-2xl lg:rounded-3xl flex items-center justify-center mx-auto text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                                <Info className="w-6 h-6 lg:w-8 lg:h-8" />
                            </div>
                            <div className="space-y-2 lg:space-y-3 relative z-10">
                                <p className="text-sm lg:text-lg font-bold text-white tracking-wide">¿Dudas con tu embarque?</p>
                                <p className="text-xs lg:text-sm text-slate-400 leading-relaxed px-2 lg:px-4">Por favor llegue al muelle con 15 minutos de anticipación a la hora indicada. ¡Buen viaje!</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-center mt-12 lg:mt-20 space-y-5 pb-8 lg:pb-12">
                    <p className="text-[10px] lg:text-xs text-slate-500 font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 lg:gap-5">
                        <span className="w-8 lg:w-12 h-px bg-slate-800" />
                        Logística Yadran &copy; {new Date().getFullYear()}
                        <span className="w-8 lg:w-12 h-px bg-slate-800" />
                    </p>
                    <div className="flex justify-center flex-col items-center gap-2 text-slate-700">
                        <Anchor className="w-6 h-6 lg:w-8 lg:h-8 hover:text-slate-500 transition-colors" />
                    </div>
                </div>
            </main>
        </div>
    );
}
