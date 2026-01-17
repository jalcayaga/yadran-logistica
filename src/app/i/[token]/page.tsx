'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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

    const getStatusText = (status: string) => {
        switch (status) {
            case 'scheduled': return 'Programado';
            case 'in_progress': return 'En Curso';
            case 'completed': return 'Finalizado';
            case 'suspended': return 'Suspendido';
            case 'cancelled': return 'Cancelado';
            default: return status;
        }
    };

    if (loading) return <div className="p-8 text-center text-white bg-blue-900 h-screen flex items-center justify-center">Cargando itinerario...</div>;
    if (error) return <div className="p-8 text-center text-red-500 bg-gray-100 h-screen flex items-center justify-center font-bold">{error}</div>;
    if (!data) return null;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 pb-12 font-sans animate-in fade-in duration-700">
            <header className="bg-blue-900 text-white p-6 shadow-lg">
                <h1 className="text-xl font-bold uppercase tracking-wider mb-1">Estado del Viaje</h1>
                <p className="text-blue-100 text-lg flex items-center gap-2">
                    🚢 {data.vessel?.name || 'Nave'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm opacity-90">
                        {format(new Date(data.date + 'T12:00:00'), "EEEE d 'de' MMMM", { locale: es })}
                    </span>
                </div>
                <div className={`mt-5 inline-block px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest backdrop-blur-md shadow-sm border border-white/10 ${data.status === 'scheduled' ? 'bg-blue-500/40' :
                    data.status === 'in_progress' ? 'bg-green-500/40 animate-pulse' :
                        data.status === 'suspended' ? 'bg-yellow-500/40' : 'bg-red-500/40'
                    }`}>
                    ● {getStatusText(data.status)}
                </div>
            </header>

            <main className="max-w-md mx-auto p-4 pt-8">
                <div className="space-y-0 relative border-l-2 border-blue-200/50 ml-4">
                    {data.stops?.map((stop, idx) => (
                        <div
                            key={stop.id}
                            className="relative pl-8 pb-10 group last:pb-0 animate-in slide-in-from-left duration-500"
                            style={{ animationDelay: `${idx * 150}ms`, animationFillMode: 'both' }}
                        >
                            {/* Timeline Dot with Glow */}
                            <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-4 border-slate-50 shadow-md transition-all duration-300 group-hover:scale-125 ${idx === 0 ? 'bg-emerald-500 shadow-emerald-200' :
                                idx === data.stops.length - 1 ? 'bg-rose-500 shadow-rose-200' : 'bg-blue-400 shadow-blue-200'
                                }`} />

                            <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-100 hover:border-blue-300 hover:shadow-md transition-all duration-300">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="font-bold text-xl text-slate-800 leading-tight tracking-tight">
                                        {stop.location.name}
                                    </div>
                                    <div className="text-[10px] font-black bg-blue-50 px-2 py-1 rounded text-blue-600 border border-blue-100">
                                        {stop.location.code}
                                    </div>
                                </div>

                                <div className="flex gap-6 text-sm">
                                    {stop.arrival_time && (
                                        <div className="space-y-0.5">
                                            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-widest">Llegada</span>
                                            <span className="text-lg font-bold text-blue-900">{stop.arrival_time.substring(0, 5)}</span>
                                        </div>
                                    )}
                                    {stop.departure_time && (
                                        <div className="space-y-0.5">
                                            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-widest">Salida</span>
                                            <span className="text-lg font-bold text-blue-900">{stop.departure_time.substring(0, 5)}</span>
                                        </div>
                                    )}
                                </div>

                                {idx === 0 && (
                                    <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-2 text-[10px] text-emerald-600 font-black uppercase tracking-widest">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        Origen del Viaje
                                    </div>
                                )}
                                {idx === data.stops.length - 1 && (
                                    <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-2 text-[10px] text-rose-600 font-black uppercase tracking-widest">
                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                        Destino Final
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-12 p-6 bg-gradient-to-br from-blue-50 to-white rounded-2xl border border-blue-100 shadow-sm text-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 text-blue-600">
                        💬
                    </div>
                    <p className="text-blue-900 text-sm font-bold mb-1 tracking-tight">¿Necesitas ayuda con tu viaje?</p>
                    <p className="text-blue-600/80 text-xs leading-relaxed">Nuestro equipo de Logística Yadran está disponible para asistirte en todo momento.</p>
                </div>

                <div className="text-center mt-12 text-slate-300 text-xs font-medium uppercase tracking-[0.2em]">
                    Logística Yadran &bull; {new Date().getFullYear()}
                </div>
            </main>
        </div>
    );
}
