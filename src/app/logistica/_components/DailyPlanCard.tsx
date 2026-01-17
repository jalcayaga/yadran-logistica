import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Clock,
    MapPin,
    Ship,
    FileText,
    Navigation,
    Anchor,
    PlayCircle,
    PauseCircle,
    MoreVertical,
    Calendar,
    Users,
    CheckCircle2,
    XCircle,
    UserCircle,
    Fingerprint
} from "lucide-react";
import { Itinerary } from '@/utils/zod_schemas';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/formatters";

export interface ItineraryDisplay extends Omit<Itinerary, 'stops'> {
    vessel?: { name: string; capacity: number; registration_number?: string };
    stops?: {
        id: string;
        stop_order: number;
        location: { name: string };
    }[];
    bookings?: { id: string }[];
    crew?: {
        role: string;
        confirmed_at: string | null;
        person: { first_name: string; last_name: string };
    }[];
    created_by_email?: string;
}

interface DailyPlanCardProps {
    itinerary: ItineraryDisplay;
}

export default function DailyPlanCard({ itinerary }: DailyPlanCardProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isStarting, setIsStarting] = useState(false);

    const sortedStops = itinerary.stops?.sort((a, b) => a.stop_order - b.stop_order) || [];
    const origin = sortedStops[0]?.location?.name || 'S/I';
    const destination = sortedStops[sortedStops.length - 1]?.location?.name || 'S/I';
    const intermediateStops = sortedStops.slice(1, -1);

    const captain = itinerary.crew?.find(c => {
        const r = c.role.toLowerCase();
        return r === 'captain' || r === 'capitán' || r === 'capitan';
    });
    const allCrewConfirmed = itinerary.crew && itinerary.crew.length > 0 && itinerary.crew.every(c => c.confirmed_at);
    const bookingsCount = itinerary.bookings?.length || 0;
    const capacity = itinerary.vessel?.capacity || 0;
    const occupancyPercent = capacity > 0 ? (bookingsCount / capacity) * 100 : 0;

    const handleStartTrip = async () => {
        setIsStarting(true);
        try {
            const res = await fetch(`/api/itineraries/${itinerary.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'in_progress' }),
            });

            if (!res.ok) throw new Error('Error al iniciar viaje');

            toast({
                title: "¡Zarpe Confirmado!",
                description: "La embarcación ha iniciado su trayecto.",
                className: "bg-blue-600 text-white border-blue-700"
            });
            router.refresh();
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "No se pudo iniciar el viaje.", variant: "destructive" });
        } finally {
            setIsStarting(false);
        }
    };

    const handleSuspendTrip = async () => {
        try {
            const res = await fetch(`/api/itineraries/${itinerary.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'suspended' }),
            });

            if (!res.ok) throw new Error('Error al suspender viaje');

            toast({ title: "Viaje Suspendido", description: "Estado actualizado correctamente." });
            router.refresh();
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "No se pudo suspender.", variant: "destructive" });
        }
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'in_progress': return "bg-emerald-500 text-white border-emerald-600 shadow-emerald-500/20";
            case 'completed': return "bg-slate-500 text-white border-slate-600";
            case 'suspended': return "bg-amber-500 text-white border-amber-600 shadow-amber-500/20";
            case 'cancelled': return "bg-red-500 text-white border-red-600";
            default: return "bg-blue-600 text-white border-blue-700 shadow-blue-500/20";
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'scheduled': return 'Programado';
            case 'in_progress': return 'En Navegación';
            case 'completed': return 'Finalizado';
            case 'cancelled': return 'Cancelado';
            case 'suspended': return 'Pto. Cerrado';
            default: return status;
        }
    };

    return (
        <Card className="group border-none shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden hover:scale-[1.01] transition-all duration-300 ring-1 ring-slate-200 dark:ring-slate-800">
            <CardContent className="p-0">
                {/* Top Section / Header */}
                <div className="p-5 flex justify-between items-start border-b border-slate-100/50 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-900/30">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20">
                                <Ship className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight truncate max-w-[150px]">
                                    {itinerary.vessel?.name || 'SIN NAVE'}
                                </h3>
                                <span className="text-[9px] font-mono text-slate-400">
                                    {itinerary.vessel?.registration_number || 'S/M'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <Badge className={cn("px-2.5 py-1 rounded-full text-[9px] font-black uppercase border shadow-lg", getStatusStyles(itinerary.status))}>
                            {getStatusLabel(itinerary.status)}
                        </Badge>
                        <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                            <Clock className="w-3 h-3 text-emerald-500" />
                            {itinerary.start_time}
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-5 space-y-5">
                    {/* Route Flow */}
                    <div className="relative pl-7 py-1">
                        <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-dashed border-l border-slate-200 dark:border-slate-800" />

                        <div className="flex flex-col gap-6">
                            <div className="flex items-center gap-4 relative">
                                <div className="absolute left-[-24px] z-10 bg-blue-500 p-1 rounded-full shadow-lg shadow-blue-500/20 ring-4 ring-white dark:ring-slate-900">
                                    <Anchor className="w-2.5 h-2.5 text-white" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest leading-none mb-1">ORIGEN</span>
                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{origin}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 relative">
                                <div className="absolute left-[-24px] z-10 bg-emerald-500 p-1 rounded-full shadow-lg shadow-emerald-500/20 ring-4 ring-white dark:ring-slate-900">
                                    <Navigation className="w-2.5 h-2.5 text-white" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest leading-none mb-1">DESTINO</span>
                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{destination}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Operational Details Grid */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="bg-slate-50/50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                            <div className="flex items-center gap-2 mb-2">
                                <Users className="w-3 h-3 text-blue-500" />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ocupación</span>
                            </div>
                            <div className="flex items-end justify-between">
                                <div className="text-lg font-black text-slate-900 dark:text-white leading-none">
                                    {bookingsCount} <span className="text-[10px] text-slate-400 font-bold">/ {capacity}</span>
                                </div>
                                <div className={cn(
                                    "text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                                    occupancyPercent > 90 ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                                )}>
                                    {Math.round(occupancyPercent)}%
                                </div>
                            </div>
                            <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
                                <div
                                    className={cn("h-full transition-all duration-1000", occupancyPercent > 90 ? "bg-red-500" : "bg-blue-500")}
                                    style={{ width: `${Math.min(occupancyPercent, 100)}%` }}
                                />
                            </div>
                        </div>

                        <div className="bg-slate-50/50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                            <div className="flex items-center gap-2 mb-2">
                                <UserCircle className="w-3 h-3 text-orange-500" />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Capitán</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                                    {captain ? `${captain.person.first_name} ${captain.person.last_name}` : 'SIN ASIGNAR'}
                                </span>
                                <div className="flex items-center gap-1">
                                    {allCrewConfirmed ? (
                                        <Badge variant="outline" className="text-[8px] h-4 font-black uppercase bg-emerald-50 text-emerald-600 border-emerald-100 py-0">
                                            <CheckCircle2 className="w-2 h-2 mr-1" /> Confirmado
                                        </Badge>
                                    ) : itinerary.crew && itinerary.crew.length > 0 ? (
                                        <Badge variant="outline" className="text-[8px] h-4 font-black uppercase bg-amber-50 text-amber-600 border-amber-100 py-0">
                                            <Clock className="w-2 h-2 mr-1" /> Pendiente
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-[8px] h-4 font-black uppercase bg-slate-50 text-slate-400 border-slate-200 py-0">
                                            <XCircle className="w-2 h-2 mr-1" /> Sin Trip.
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Meta Info */}
                    <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col">
                                <span className="text-[8px] text-muted-foreground font-black uppercase tracking-widest">Creado por</span>
                                <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                                    <Fingerprint className="w-2.5 h-2.5" />
                                    {itinerary.created_by_email?.split('@')[0] || 'Sistema'}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[8px] text-muted-foreground font-black uppercase tracking-widest">Fecha Zarpe</span>
                                <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                                    <Calendar className="w-2.5 h-2.5" /> {formatDate(itinerary.date)}
                                </span>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                            <MoreVertical className="w-4 h-4 text-slate-400" />
                        </Button>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-3 bg-slate-50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-800/50 grid grid-cols-2 gap-2">
                    <Button variant="ghost" className="h-10 text-[10px] font-black uppercase text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all active:scale-95">
                        <FileText className="w-4 h-4 mr-2 text-emerald-500" /> Manifiesto
                    </Button>

                    {(itinerary.status === 'scheduled' || itinerary.status === 'in_progress') && (
                        <>
                            {itinerary.status === 'scheduled' ? (
                                <Button
                                    className="h-10 text-[10px] font-black uppercase bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20 rounded-xl transition-all active:scale-95 text-white"
                                    onClick={handleStartTrip}
                                    disabled={isStarting}
                                >
                                    <PlayCircle className="w-4 h-4 mr-2" /> Iniciar
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    className="h-10 text-[10px] font-black uppercase border-amber-200 text-amber-600 hover:bg-white dark:border-amber-900 rounded-xl transition-all active:scale-95"
                                    onClick={handleSuspendTrip}
                                >
                                    <PauseCircle className="w-4 h-4 mr-2" /> Suspender
                                </Button>
                            )}
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
