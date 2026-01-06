'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ItineraryData {
    status: string;
    people: { full_name: string; rut_display: string; company: string };
    itinerary_segments: any[];
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

    if (loading) return <div className="p-8 text-center text-white bg-blue-900 h-screen">Cargando itinerario...</div>;
    if (error) return <div className="p-8 text-center text-red-500 bg-gray-100 h-screen font-bold">{error}</div>;
    if (!data) return null;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
            <header className="bg-blue-900 text-white p-6 shadow-lg">
                <h1 className="text-xl font-bold uppercase tracking-wider mb-1">Itinerario de Viaje</h1>
                <p className="text-blue-100 text-lg">{data.people.full_name}</p>
                <p className="text-sm opacity-75">{data.people.rut_display} | {data.people.company}</p>
                <div className="mt-4 inline-block px-3 py-1 rounded bg-white/20 text-xs font-bold uppercase backdrop-blur-sm">
                    {data.status === 'assigned' ? 'Confirmado' : data.status}
                </div>
            </header>

            <main className="max-w-md mx-auto p-4">
                <div className="space-y-6 relative border-l-2 border-blue-200 ml-4 pl-6 py-2">
                    {data.itinerary_segments.map((seg, idx) => (
                        <div key={seg.id} className="relative bg-white rounded-lg shadow-sm p-4 border border-slate-100">
                            {/* Timeline Dot */}
                            <div className="absolute -left-[33px] top-6 w-4 h-4 rounded-full bg-blue-500 border-4 border-slate-50 shadow-sm" />

                            <div className="text-xs font-bold text-gray-500 uppercase mb-1 tracking-wider">
                                {seg.mode}
                            </div>

                            <div className="grid grid-cols-[auto_1fr] gap-4 mb-3">
                                <div className="text-center min-w-[3rem]">
                                    <div className="text-lg font-bold text-blue-900">
                                        {format(new Date(seg.departure_at), 'HH:mm')}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        {format(new Date(seg.departure_at), 'dd/MM', { locale: es })}
                                    </div>
                                </div>
                                <div>
                                    <div className="font-bold text-lg leading-tight">{seg.origin.name}</div>
                                    <div className="text-slate-400 text-sm">hacia</div>
                                    <div className="font-bold text-lg leading-tight">{seg.destination.name}</div>
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-3 mt-2 text-sm grid grid-cols-2 gap-y-2 text-slate-600">
                                {seg.presentation_at && (
                                    <div className="col-span-2 text-orange-600 font-medium">
                                        Presentación: {format(new Date(seg.presentation_at), 'HH:mm')}
                                    </div>
                                )}
                                <div>
                                    <span className="block text-[10px] uppercase text-slate-400">Operador</span>
                                    {seg.operator?.name || '-'}
                                </div>
                                <div>
                                    <span className="block text-[10px] uppercase text-slate-400">Nave/Vuelo</span>
                                    {seg.vessel?.name || '-'}
                                </div>
                                {seg.ticket && (
                                    <div className="col-span-2">
                                        <span className="block text-[10px] uppercase text-slate-400">Ticket / Asiento</span>
                                        {seg.ticket}
                                    </div>
                                )}
                                {seg.notes && (
                                    <div className="col-span-2 bg-yellow-50 p-2 rounded text-xs text-yellow-800 mt-1 border border-yellow-100">
                                        {seg.notes}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="text-center mt-12 text-slate-400 text-sm">
                    Logística Yadran &bull; {new Date().getFullYear()}
                </div>
            </main>
        </div>
    );
}
