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
        <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans">
            {/* Header Section */}
            <div className="bg-slate-900 text-white pt-12 pb-24 px-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
                <div className="max-w-md mx-auto relative">
                    <div className="flex justify-between items-start mb-6">
                        <div className="space-y-1">
                            <h1 className="text-3xl font-black uppercase tracking-tight">Estado del Viaje</h1>
                            <p className="text-blue-400 text-xs font-black uppercase tracking-widest">Logística Yadran</p>
                        </div>
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20 bg-white/5 ${data.status === 'in_progress' ? 'animate-pulse' : ''}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${statusObj.color}`} />
                            {statusObj.label}
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <Ship className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="text-[10px] text-white/40 uppercase font-black tracking-widest leading-none mb-1">Cargando en nave</p>
                                <p className="text-xl font-bold">{data.vessel?.name || 'Nave por asignar'}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/10">
                            <div>
                                <p className="text-[10px] text-white/40 uppercase font-black tracking-widest leading-none mb-1">Fecha</p>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5 text-blue-400" />
                                    <p className="text-sm font-bold">{format(new Date(data.date + 'T12:00:00'), "d 'de' MMM", { locale: es })}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] text-white/40 uppercase font-black tracking-widest leading-none mb-1">Hora Inicio</p>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                                    <p className="text-sm font-bold">{data.start_time}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <main className="max-w-md mx-auto -mt-16 px-6 relative z-10">
                <div className="space-y-4">
                    {/* Status Alert for special cases */}
                    {(data.status === 'suspended' || data.status === 'cancelled') && (
                        <div className={`p-4 rounded-2xl border flex gap-3 shadow-lg ${data.status === 'suspended' ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-rose-50 border-rose-200 text-rose-900'
                            }`}>
                            <AlertCircle className="w-6 h-6 shrink-0" />
                            <div>
                                <p className="font-bold text-sm">Aviso de {statusObj.label}</p>
                                <p className="text-xs opacity-80">Por favor contacte a Logística para más información.</p>
                            </div>
                        </div>
                    )}

                    {/* Timeline of Stops */}
                    <Card className="border-none shadow-xl bg-white overflow-hidden rounded-3xl">
                        <CardContent className="p-6">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5" /> Itinerario de Navegación
                            </p>

                            <div className="space-y-2 relative">
                                {/* Vertical line */}
                                <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-slate-100" />

                                {data.stops?.map((stop, idx) => (
                                    <div key={stop.id} className="relative pl-8 pb-8 last:pb-0">
                                        <div className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-4 border-white shadow-sm transition-all duration-300 ${idx === 0 ? 'bg-emerald-500' : idx === data.stops.length - 1 ? 'bg-rose-500' : 'bg-blue-500'
                                            }`} />

                                        <div className="flex justify-between items-start">
                                            <div className="space-y-0.5">
                                                <p className="font-bold text-slate-900 text-base">{stop.location.name}</p>
                                                <div className="flex items-center gap-3">
                                                    <Badge variant="secondary" className="bg-slate-50 text-slate-500 border-none text-[9px] font-bold px-1.5 py-0">
                                                        {stop.location.code}
                                                    </Badge>
                                                    {stop.arrival_time && (
                                                        <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                                                            <Clock className="w-2.5 h-2.5" /> {stop.arrival_time.substring(0, 5)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {idx === 0 && <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-widest">Zarpe</span>}
                                            {idx === data.stops.length - 1 && <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full uppercase tracking-widest">Llegada</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Helpful Info Card */}
                    <div className="bg-blue-600/5 border border-blue-600/10 rounded-3xl p-6 text-center space-y-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto text-white shadow-lg shadow-blue-500/20">
                            <Info className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-slate-900 leading-tight">¿Tienes dudas con tu embarque?</p>
                            <p className="text-xs text-slate-500 leading-relaxed px-4">Por favor llege al muelle 15 minutos antes de la hora indicada. ¡Buen viaje!</p>
                        </div>
                    </div>
                </div>

                <div className="text-center mt-12 space-y-4">
                    <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.2em]">Logística Yadran &bull; {new Date().getFullYear()}</p>
                    <div className="flex justify-center gap-6 text-slate-200">
                        <Anchor className="w-6 h-6" />
                    </div>
                </div>
            </main>
        </div>
    );
}
