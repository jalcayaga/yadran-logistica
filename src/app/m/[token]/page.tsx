'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    Ship,
    Users,
    FileText,
    Download,
    Calendar,
    Clock,
    MapPin,
    CheckCircle2,
    AlertCircle,
    ChevronRight,
    Anchor
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface ManifestData {
    itinerary: {
        id: string;
        date: string;
        start_time: string;
        status: string;
        manifest_pdf: string;
        vessel: {
            name: string;
            registration_number: string;
            capacity: number;
        };
        stops: {
            id: string;
            stop_order: number;
            location: { name: string; code: string };
        }[];
    };
    crew_member: {
        name: string;
        role: string;
        confirmed_at: string | null;
    };
    passengers: {
        id: string;
        status: string;
        passenger: { first_name: string; last_name: string; company: string };
        origin_stop: { location: { name: string } };
        destination_stop: { location: { name: string } };
    }[];
    stats: {
        total: number;
        confirmed: number;
        pending: number;
    };
}

export default function CaptainDashboard() {
    const { token } = useParams();
    const [data, setData] = useState<ManifestData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function fetchManifest() {
            try {
                const res = await fetch(`/api/public/manifest/${token}`);
                if (!res.ok) {
                    const body = await res.json();
                    throw new Error(body.error || 'Error al cargar el panel');
                }
                const json = await res.json();
                setData(json);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        if (token) fetchManifest();
    }, [token]);

    if (loading) return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-xl font-medium animate-pulse">Cargando Panel del Capitán...</p>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <Card className="max-w-md w-full border-red-100 shadow-xl">
                <CardContent className="pt-8 text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Error de Acceso</h2>
                    <p className="text-slate-600 mb-6">{error}</p>
                    <Button onClick={() => window.location.reload()} className="bg-blue-600">Reintentar</Button>
                </CardContent>
            </Card>
        </div>
    );

    if (!data) return null;

    const confirmedPercent = (data.stats.confirmed / data.stats.total) * 100 || 0;

    return (
        <div className="min-h-screen bg-slate-50 pb-20 font-sans">
            {/* Dark Header */}
            <header className="bg-slate-900 text-white pt-10 pb-24 px-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-600/10 rounded-full -ml-24 -mb-24 blur-3xl" />

                <div className="max-w-4xl mx-auto relative">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                                <Ship className="text-white w-7 h-7" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black uppercase tracking-tight">Panel del Capitán</h1>
                                <p className="text-blue-300 text-xs font-bold uppercase tracking-widest leading-none mt-1">
                                    Logística Yadran
                                </p>
                            </div>
                        </div>
                        <Badge variant="outline" className="text-blue-400 border-blue-400/30 bg-blue-400/5 px-3 py-1 uppercase text-[10px] font-black tracking-widest">
                            {data.itinerary.status === 'scheduled' ? '● Programado' : '● En Curso'}
                        </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-8">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
                            <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-1">Nave</p>
                            <p className="text-lg font-bold">{data.itinerary.vessel.name}</p>
                            <p className="text-[10px] text-blue-400 font-mono">{data.itinerary.vessel.registration_number}</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
                            <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-1">Zarpe Estimado</p>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-emerald-400" />
                                <p className="text-lg font-bold">{data.itinerary.start_time}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto -mt-16 px-6 space-y-6">
                {/* Actions Bar */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="border-none shadow-xl bg-white overflow-hidden group">
                        <CardContent className="p-0">
                            <div className="bg-emerald-600 p-6 text-white flex justify-between items-center group-hover:bg-emerald-700 transition-colors">
                                <div className="space-y-1">
                                    <h3 className="text-lg font-bold">Manifiesto Digital</h3>
                                    <p className="text-emerald-100/80 text-xs">Documento oficial para DIRECTEMAR</p>
                                </div>
                                <FileText className="w-10 h-10 opacity-30" />
                            </div>
                            <div className="p-4">
                                <Button
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white gap-2 font-bold py-6 rounded-xl"
                                    onClick={() => window.open(data.itinerary.manifest_pdf, '_blank')}
                                    disabled={!data.itinerary.manifest_pdf}
                                >
                                    <Download className="w-5 h-5" />
                                    Descargar Manifiesto PDF
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl bg-white p-6 flex flex-col justify-between">
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Confirmación Pasajeros</p>
                                    <h3 className="text-3xl font-black text-slate-900">{data.stats.confirmed} <span className="text-slate-300 font-normal">/ {data.stats.total}</span></h3>
                                </div>
                                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                                    <Users className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Progress value={confirmedPercent} className="h-2 bg-slate-100" />
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight text-slate-400">
                                    <span>{confirmedPercent.toFixed(0)}% Confirmados</span>
                                    <span>{data.stats.pending} Pendientes</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Stops Timeline */}
                <Card className="border-none shadow-xl bg-white overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6">
                        <CardTitle className="text-sm flex items-center gap-2 uppercase font-black tracking-widest text-slate-600">
                            <Anchor className="w-4 h-4 text-blue-500" />
                            Ruta del Viaje
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-6 py-6 overflow-x-auto">
                        <div className="flex items-center min-w-max pb-4">
                            {data.itinerary.stops.map((stop, idx) => (
                                <div key={stop.id} className="flex items-center">
                                    {idx > 0 && (
                                        <div className="w-8 h-0.5 bg-slate-100 mx-2" />
                                    )}
                                    <div className="flex flex-col items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${idx === 0 ? 'bg-emerald-500' : idx === data.itinerary.stops.length - 1 ? 'bg-rose-500' : 'bg-blue-500'}`} />
                                        <span className="text-[10px] font-black uppercase text-slate-500">{stop.location.code}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Passenger List */}
                <Card className="border-none shadow-xl bg-white overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2 uppercase font-black tracking-widest text-slate-600">
                            <Users className="w-4 h-4 text-blue-500" />
                            Listado de Pasajeros
                        </CardTitle>
                        <Badge className="bg-blue-600 text-white px-2 py-0">{data.stats.total}</Badge>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-50">
                            {data.passengers.length === 0 ? (
                                <div className="p-10 text-center text-slate-400 italic text-sm">No hay pasajeros asignados.</div>
                            ) : (
                                data.passengers.map((p) => (
                                    <div key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-slate-900">{p.passenger.first_name} {p.passenger.last_name}</p>
                                                {p.status === 'confirmed' ? (
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                ) : (
                                                    <div className="w-4 h-4 rounded-full border border-slate-200" />
                                                )}
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5">
                                                <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{p.passenger.company}</span>
                                                <ChevronRight className="w-2 h-2" />
                                                <MapPin className="w-2.5 h-2.5" /> {p.destination_stop.location.name}
                                            </p>
                                        </div>
                                        <Badge
                                            variant="secondary"
                                            className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 ${p.status === 'confirmed'
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                    : 'bg-slate-100 text-slate-400 border-slate-200'
                                                }`}
                                        >
                                            {p.status === 'confirmed' ? 'Confirmado' : 'Pendiente'}
                                        </Badge>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Footer Info */}
                <div className="text-center space-y-4 pt-10">
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
                        Sesión del Capitán: {data.crew_member.name}
                    </p>
                    <div className="flex justify-center gap-4 text-slate-300">
                        <Anchor className="w-5 h-5 opacity-20" />
                    </div>
                </div>
            </main>
        </div>
    );
}
