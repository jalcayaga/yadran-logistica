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
    const [generating, setGenerating] = useState(false);

    const handleDownloadManifest = async () => {
        if (!data) return;

        // Use existing pre-generated manifest if available
        if (data.itinerary.manifest_pdf) {
            window.open(data.itinerary.manifest_pdf, '_blank');
            return;
        }

        try {
            setGenerating(true);
            const { pdf } = await import('@react-pdf/renderer');
            const { ManifestDocument } = await import('@/components/pdf/ManifestDocument');

            const nameParts = data.crew_member.name.split(' ');
            const crewList = [{
                role: 'captain',
                person: {
                    first_name: nameParts[0] || '',
                    last_name: nameParts.slice(1).join(' ') || ''
                }
            }];

            const blob = await pdf(
                <ManifestDocument
                    vesselName={data.itinerary.vessel.name || 'Nave Desconocida'}
                    vesselRegistration={data.itinerary.vessel.registration_number}
                    itineraryDate={format(new Date(data.itinerary.date + 'T12:00:00'), 'dd/MM/yyyy')}
                    startTime={data.itinerary.start_time}
                    passengers={data.passengers}
                    crew={crewList}
                />
            ).toBlob();

            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (err) {
            console.error('Error generating PDF:', err);
            alert('Error al generar el manifiesto PDF.');
        } finally {
            setGenerating(false);
        }
    };

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
        <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 font-sans selection:bg-blue-500/30">
            {/* Dark Premium Header */}
            <header className="bg-slate-900 pt-10 pb-24 lg:pt-16 lg:pb-32 px-6 lg:px-12 relative overflow-hidden border-b border-white/5">
                {/* Decorative glows */}
                <div className="absolute top-0 right-0 w-[500px] lg:w-[800px] h-[500px] lg:h-[800px] bg-blue-600/20 rounded-full blur-[100px] lg:blur-[150px] -mr-64 -mt-64 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[400px] lg:w-[600px] h-[400px] lg:h-[600px] bg-emerald-600/10 rounded-full blur-[80px] lg:blur-[120px] -ml-48 -mb-48 pointer-events-none" />

                <div className="max-w-md md:max-w-3xl lg:max-w-6xl mx-auto relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <div className="flex items-center gap-4 lg:gap-6">
                            <div className="w-14 h-14 lg:w-20 lg:h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
                                <Ship className="text-white w-7 h-7 lg:w-10 lg:h-10" />
                            </div>
                            <div>
                                <h1 className="text-2xl lg:text-5xl font-black uppercase tracking-tight text-white">Panel del Capitán</h1>
                                <p className="text-blue-400 text-xs lg:text-sm font-black uppercase tracking-widest leading-none mt-1 lg:mt-2">
                                    Logística Yadran
                                </p>
                            </div>
                        </div>
                        <div className={`flex items-center gap-2 px-3 lg:px-4 py-1.5 lg:py-2 rounded-full text-[10px] lg:text-xs font-black uppercase tracking-widest border border-white/10 bg-white/5 shadow-xl backdrop-blur-md ${data.itinerary.status === 'in_progress' ? 'animate-pulse ring-1 ring-emerald-500/50' : ''}`}>
                            <div className={`w-2 h-2 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] ${data.itinerary.status === 'scheduled' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                            {data.itinerary.status === 'scheduled' ? 'Programado' : 'En Curso'}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-8 mt-8 lg:mt-12 bg-white/5 border border-white/10 rounded-3xl p-6 lg:p-10 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

                        <div className="md:col-span-2 relative z-10">
                            <p className="text-[10px] lg:text-xs text-blue-200/50 uppercase font-black tracking-widest mb-1.5 lg:mb-2">Nave</p>
                            <p className="text-xl lg:text-3xl font-bold text-white">{data.itinerary.vessel.name}</p>
                            <p className="text-[10px] lg:text-xs text-blue-400 font-mono mt-1">{data.itinerary.vessel.registration_number}</p>
                        </div>
                        <div className="relative z-10">
                            <p className="text-[10px] lg:text-xs text-blue-200/50 uppercase font-black tracking-widest mb-2 lg:mb-3">Fecha</p>
                            <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                    <Calendar className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-blue-400" />
                                </div>
                                <p className="text-sm lg:text-lg font-bold text-slate-200">{format(new Date(data.itinerary.date + 'T12:00:00'), "d 'de' MMM", { locale: es })}</p>
                            </div>
                        </div>
                        <div className="relative z-10">
                            <p className="text-[10px] lg:text-xs text-blue-200/50 uppercase font-black tracking-widest mb-2 lg:mb-3">Zarpe Estimado</p>
                            <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                    <Clock className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-emerald-400" />
                                </div>
                                <p className="text-sm lg:text-lg font-bold text-slate-200">{data.itinerary.start_time}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-md md:max-w-3xl lg:max-w-6xl mx-auto -mt-16 lg:-mt-20 px-6 lg:px-8 relative z-20 space-y-6 lg:space-y-10">
                {/* Actions Bar & Stats (Grid layout on large screens) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">

                    {/* Manifest Action Card */}
                    <Card className="border border-white/10 shadow-2xl bg-[#0f172a]/80 backdrop-blur-xl overflow-hidden rounded-3xl lg:col-span-1 flex flex-col group relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
                        <CardContent className="p-0 flex-1 flex flex-col relative z-10">
                            <div className="bg-emerald-500/10 border-b border-emerald-500/20 p-6 lg:p-8 flex justify-between items-center group-hover:bg-emerald-500/20 transition-colors">
                                <div className="space-y-1.5">
                                    <h3 className="text-lg lg:text-xl font-bold text-white">Manifiesto Digital</h3>
                                    <p className="text-emerald-400/80 text-xs lg:text-sm font-medium">Documento DIRECTEMAR</p>
                                </div>
                                <FileText className="w-10 h-10 lg:w-12 lg:h-12 text-emerald-500/50" />
                            </div>
                            <div className="p-6 lg:p-8 flex-1 flex flex-col justify-end">
                                <Button
                                    className={`w-full text-white gap-3 font-bold py-6 lg:py-8 text-sm lg:text-base rounded-2xl shadow-lg transition-all hover:scale-[1.02] ${generating
                                            ? 'bg-blue-600/50 cursor-not-allowed'
                                            : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'
                                        }`}
                                    onClick={handleDownloadManifest}
                                    disabled={generating}
                                >
                                    {generating ? (
                                        <div className="w-5 h-5 lg:w-6 lg:h-6 border-2 border-white/20 border-t-white rounded-full animate-spin shrink-0" />
                                    ) : (
                                        <Download className="w-5 h-5 lg:w-6 lg:h-6 shrink-0" />
                                    )}
                                    {generating ? 'Generando...' : 'Descargar Manifiesto PDF'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Passenger Stats Card */}
                    <Card className="border border-white/10 shadow-2xl bg-[#0f172a]/80 backdrop-blur-xl overflow-hidden rounded-3xl lg:col-span-2 flex flex-col">
                        <CardContent className="p-6 lg:p-10 flex flex-col justify-center h-full relative">
                            <div className="absolute -right-20 -top-20 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

                            <div className="space-y-6 lg:space-y-8 relative z-10">
                                <div className="flex justify-between items-end">
                                    <div className="space-y-2 lg:space-y-3">
                                        <p className="text-[10px] lg:text-xs text-blue-200/50 uppercase font-black tracking-widest">Confirmación Pasajeros</p>
                                        <h3 className="text-4xl lg:text-6xl font-black text-white">{data.stats.confirmed} <span className="text-slate-600 font-bold text-2xl lg:text-4xl">/ {data.stats.total}</span></h3>
                                    </div>
                                    <div className="w-14 h-14 lg:w-20 lg:h-20 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                                        <Users className="w-7 h-7 lg:w-10 lg:h-10" />
                                    </div>
                                </div>
                                <div className="space-y-3 lg:space-y-4">
                                    <Progress value={confirmedPercent} className="h-2 lg:h-3 bg-slate-800 [&>div]:bg-blue-500" />
                                    <div className="flex justify-between text-[10px] lg:text-xs font-black uppercase tracking-widest text-slate-400">
                                        <span className={confirmedPercent === 100 ? 'text-emerald-400' : 'text-blue-400'}>{confirmedPercent.toFixed(0)}% Confirmados</span>
                                        <span className="text-slate-500">{data.stats.pending} Pendientes</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Bottom Row Layout (Grid on Large Screens) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

                    {/* Stops Timeline (Spans 4 columns) */}
                    <Card className="border border-white/10 shadow-2xl bg-[#0f172a]/80 backdrop-blur-xl overflow-hidden rounded-3xl lg:col-span-4 self-start">
                        <CardHeader className="bg-white/[0.02] border-b border-white/5 py-5 px-6 lg:px-8">
                            <CardTitle className="text-[10px] lg:text-xs flex items-center gap-2 lg:gap-3 uppercase font-black tracking-widest text-slate-400">
                                <MapPin className="w-4 h-4 lg:w-5 lg:h-5 text-blue-400" />
                                Ruta de Navegación
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-6 lg:px-8 py-6 lg:py-8">
                            <div className="space-y-0 relative">
                                {/* Vertical line */}
                                <div className="absolute left-[9px] top-2 bottom-6 w-[2px] bg-gradient-to-b from-blue-500/50 via-slate-700 to-rose-500/50 rounded-full" />

                                {data.itinerary.stops?.map((stop, idx) => (
                                    <div key={stop.id} className="relative pl-8 pb-8 last:pb-2 group">
                                        <div className={`absolute left-0 top-1 w-5 h-5 rounded-full border-4 border-[#0f172a] shadow-lg transition-transform duration-300 group-hover:scale-125 ${idx === 0 ? 'bg-emerald-500 shadow-emerald-500/40' : idx === data.itinerary.stops.length - 1 ? 'bg-rose-500 shadow-rose-500/40' : 'bg-blue-500 shadow-blue-500/40'
                                            }`} />

                                        <div className="flex flex-col -mt-1 lg:-mt-1.5">
                                            <p className="font-bold text-white text-sm lg:text-base tracking-wide">{stop.location.name}</p>
                                            <Badge variant="secondary" className="bg-slate-800 text-slate-300 border border-slate-700 text-[9px] lg:text-[10px] font-black tracking-wider px-2 py-0.5 w-fit mt-1.5 lg:mt-2">
                                                {stop.location.code}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Passenger List (Spans 8 columns) */}
                    <Card className="border border-white/10 shadow-2xl bg-[#0f172a]/80 backdrop-blur-xl overflow-hidden rounded-3xl lg:col-span-8">
                        <CardHeader className="bg-white/[0.02] border-b border-white/5 py-5 px-6 lg:px-8 flex flex-row items-center justify-between">
                            <CardTitle className="text-[10px] lg:text-xs flex items-center gap-2 lg:gap-3 uppercase font-black tracking-widest text-slate-400">
                                <Users className="w-4 h-4 lg:w-5 lg:h-5 text-blue-400" />
                                Manifiesto de Pasajeros
                            </CardTitle>
                            <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1 font-bold text-xs">
                                {data.stats.total} Total
                            </Badge>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-white/5">
                                {data.passengers.length === 0 ? (
                                    <div className="p-10 text-center text-slate-500 italic text-sm">No hay pasajeros asignados en este manifiesto.</div>
                                ) : (
                                    data.passengers.map((p) => (
                                        <div key={p.id} className="p-5 lg:p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-white/[0.02] transition-colors gap-4">
                                            <div className="space-y-1.5 lg:space-y-2">
                                                <div className="flex items-center gap-2 lg:gap-3">
                                                    <p className="font-bold text-white text-sm lg:text-base tracking-wide">{p.passenger.first_name} {p.passenger.last_name}</p>
                                                    {p.status === 'confirmed' ? (
                                                        <CheckCircle2 className="w-4 h-4 lg:w-5 lg:h-5 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                                                    ) : (
                                                        <div className="w-4 h-4 lg:w-5 lg:h-5 rounded-full border-2 border-slate-600" />
                                                    )}
                                                </div>
                                                <p className="text-[10px] lg:text-xs text-slate-400 font-medium flex flex-wrap items-center gap-1.5 lg:gap-2">
                                                    <span className="bg-slate-800 text-slate-300 border border-slate-700 px-2 lg:px-2.5 py-0.5 lg:py-1 rounded font-bold uppercase tracking-widest">{p.passenger.company}</span>
                                                    <ChevronRight className="w-3 h-3 text-slate-600" />
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="w-3 h-3 text-blue-400" />
                                                        {p.destination_stop.location.name}
                                                    </span>
                                                </p>
                                            </div>
                                            <Badge
                                                variant="secondary"
                                                className={`text-[9px] lg:text-[10px] font-black uppercase tracking-widest px-3 py-1 lg:px-4 lg:py-1.5 rounded-full md:shrink-0 w-fit ${p.status === 'confirmed'
                                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                                    : 'bg-slate-800 text-slate-400 border border-slate-700'
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
                </div>

                {/* Footer Info */}
                <div className="text-center space-y-4 pt-10 pb-8 lg:pb-12">
                    <p className="text-[10px] lg:text-xs text-slate-600 font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 lg:gap-5">
                        <span className="w-8 lg:w-12 h-px bg-slate-800" />
                        Sesión Capitán: {data.crew_member.name}
                        <span className="w-8 lg:w-12 h-px bg-slate-800" />
                    </p>
                    <div className="flex justify-center flex-col items-center gap-2 text-slate-700">
                        <Anchor className="w-6 h-6 hover:text-slate-500 transition-colors" />
                    </div>
                </div>
            </main>
        </div>
    );
}
