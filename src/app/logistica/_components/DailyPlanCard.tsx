import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, MapPin, Ship, FileText } from "lucide-react";
import { Itinerary } from '@/utils/zod_schemas';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";

// Define the shape we expect for the dashboard
export interface ItineraryDisplay extends Omit<Itinerary, 'stops'> {
    vessel?: { name: string; capacity: number };
    stops?: {
        id: string;
        stop_order: number;
        location: { name: string };
    }[];
}

interface DailyPlanCardProps {
    itinerary: ItineraryDisplay;
}

export default function DailyPlanCard({ itinerary }: DailyPlanCardProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isStarting, setIsStarting] = useState(false);

    const sortedStops = itinerary.stops?.sort((a, b) => a.stop_order - b.stop_order) || [];
    const origin = sortedStops[0]?.location?.name || 'Origen desconocido';
    const destination = sortedStops[sortedStops.length - 1]?.location?.name || 'Destino desconocido';
    const intermediateStops = sortedStops.slice(1, -1);

    const handleStartTrip = async () => {
        setIsStarting(true);
        try {
            const res = await fetch(`/api/itineraries/${itinerary.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'in_progress' }),
            });

            if (!res.ok) throw new Error('Error al iniciar viaje');

            toast({ title: "Viaje Iniciado", description: "El estado ha cambiado a 'En Curso'." });
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

            toast({ title: "Viaje Suspendido", description: "Se ha marcado como Pto. Cerrado." });
            router.refresh();
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "No se pudo suspender.", variant: "destructive" });
        }
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'in_progress': return 'default'; // Blue-ish in Shadcn usually, or define custom keys
            case 'completed': return 'secondary';
            case 'cancelled':
            case 'suspended': return 'destructive';
            default: return 'outline';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'scheduled': return 'Programado';
            case 'in_progress': return 'En Curso';
            case 'completed': return 'Finalizado';
            case 'cancelled': return 'Cancelado';
            case 'suspended': return 'Suspendido (Clima)';
            default: return status;
        }
    };

    return (
        <Card className="hover:shadow-md transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex flex-col">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Salida: {itinerary.start_time}
                    </CardTitle>
                    <div className="font-bold text-lg">{itinerary.vessel?.name || 'Sin Nave'}</div>
                </div>
                <Badge variant={getStatusVariant(itinerary.status) as any}>
                    {getStatusLabel(itinerary.status)}
                </Badge>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 mt-2">
                    {/* Route Details */}
                    <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
                        <div className="flex flex-col">
                            <span className="font-semibold">{origin}</span>
                            {intermediateStops.length > 0 && (
                                <span className="text-xs text-muted-foreground pl-1 border-l-2 ml-1 my-1">
                                    {intermediateStops.length} paradas intermedias
                                </span>
                            )}
                            <span className="font-semibold mt-1">→ {destination}</span>
                        </div>
                    </div>

                    {/* Capacity */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Ship className="w-4 h-4" />
                        <span>Capacidad: {itinerary.vessel?.capacity || 0} pax</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-2 pt-2 border-t">
                        <Button variant="ghost" size="sm" className="w-full justify-start pl-0 hover:bg-transparent hover:underline text-blue-600">
                            <FileText className="w-4 h-4 mr-2" />
                            Ver Manifiesto
                        </Button>
                        {(itinerary.status === 'scheduled' || itinerary.status === 'in_progress') && (
                            <div className="ml-auto flex gap-2">
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={handleSuspendTrip}
                                    title="Puerto Cerrado / Clima"
                                >
                                    Suspender
                                </Button>
                                {itinerary.status === 'scheduled' && (
                                    <Button
                                        size="sm"
                                        className="bg-blue-600 hover:bg-blue-700"
                                        onClick={handleStartTrip}
                                        disabled={isStarting}
                                    >
                                        {isStarting ? 'Iniciando...' : 'Iniciar Viaje'}
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
