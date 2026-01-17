'use client';

import { useState, useEffect } from "react";
import { Itinerary } from '@/utils/zod_schemas';
import { createClient } from '@/utils/supabase/client'; // Added
import { sendItineraryToWebhook } from '@/utils/whatsapp'; // Added
import { useToast } from "@/hooks/use-toast"; // Added
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from '@/components/ui/button';
import { Plus, Calendar, Clock, Ship, Trash2, Pencil, Users, FileText, Send } from 'lucide-react'; // Added Send
import CrewManager from './CrewManager';
import ManifestPreview from './ManifestPreview';
import { ManifestDocument } from '@/components/pdf/ManifestDocument'; // Added import
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import ItineraryForm from './ItineraryForm';
import BookingManager from './BookingManager';
import { formatDate } from "@/utils/formatters";
import { Badge } from "@/components/ui/badge";

// Extended type for fetching
// Extended type for fetching
interface ItineraryWithRelations extends Omit<Itinerary, 'stops'> {
    vessel?: { name: string; capacity: number };
    stops: {
        id: string;
        stop_order: number;
        location_id: string;
        arrival_time: string;
        departure_time: string;
        location: { name: string };
    }[];
}

export default function ItineraryTable() {
    const supabase = createClient(); // Added
    const { toast } = useToast(); // Added
    const [itineraries, setItineraries] = useState<ItineraryWithRelations[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [managingItinerary, setManagingItinerary] = useState<ItineraryWithRelations | null>(null);
    const [editingItinerary, setEditingItinerary] = useState<ItineraryWithRelations | null>(null);
    const [deletingItinerary, setDeletingItinerary] = useState<ItineraryWithRelations | null>(null);
    const [managingCrew, setManagingCrew] = useState<ItineraryWithRelations | null>(null);
    const [viewingManifest, setViewingManifest] = useState<ItineraryWithRelations | null>(null);

    const fetchItineraries = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/itineraries');
            if (res.ok) {
                const data = await res.json();
                setItineraries(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItineraries();
    }, []);

    const [notifyDialog, setNotifyDialog] = useState<{ open: boolean, itinerary: ItineraryWithRelations | null }>({ open: false, itinerary: null });
    const [notifyOptions, setNotifyOptions] = useState({ crew: true, passengers: true });

    const openNotifyDialog = (itinerary: ItineraryWithRelations) => {
        setNotifyDialog({ open: true, itinerary });
        setNotifyOptions({ crew: true, passengers: true }); // Default both checked
    };

    const handleConfirmSend = async (target: 'passengers' | 'crew') => {
        if (!notifyDialog.itinerary) return;
        setNotifyDialog(prev => ({ ...prev, open: false }));
        await executeSendWebhook(notifyDialog.itinerary, target);
    };

    const executeSendWebhook = async (itinerary: ItineraryWithRelations, target: 'passengers' | 'crew') => {
        toast({ title: "Procesando...", description: `Notificando a ${target === 'passengers' ? 'Pasajeros' : 'Tripulación'}...` });

        try {
            let crewList: any[] = [];
            let bookingsList: any[] = [];

            // 1. Fetch Crew (Always needed for the PDF Captain context, but filtered for notification payload)
            const { data: crewData, error: crewError } = await supabase
                .from('crew_assignments')
                .select('*, person:people(*)')
                .eq('itinerary_id', itinerary.id);

            if (crewError) throw new Error("No se pudo obtener la tripulación");
            crewList = crewData || [];

            // 2. Fetch Passengers
            const { data: bookingsData, error: bookingsError } = await supabase
                .from('bookings')
                .select('*, passenger:people(*), origin_stop:itinerary_stops!bookings_origin_stop_id_fkey(*, location:locations(*)), destination_stop:itinerary_stops!bookings_destination_stop_id_fkey(*, location:locations(*))')
                .eq('itinerary_id', itinerary.id)
                .neq('status', 'cancelled');

            if (bookingsError) {
                console.error("Error fetching bookings:", bookingsError);
                throw new Error(`Error obteniendo pasajeros: ${bookingsError.message} (${bookingsError.code})`);
            }
            bookingsList = bookingsData || [];

            // 3. Generate PDF Blob (Always needed for Captain)
            const { pdf } = await import('@react-pdf/renderer');
            const blob = await pdf(
                <ManifestDocument
                    vesselName={itinerary.vessel?.name || 'Nave Desconocida'}
                    itineraryDate={formatDate(itinerary.date)}
                    startTime={itinerary.start_time}
                    passengers={bookingsList}
                    crew={crewList}
                />
            ).toBlob();

            // 4. Upload PDF to Supabase
            const fileName = `manifest_${itinerary.id}_${Date.now()}.pdf`;
            const { error: uploadError } = await supabase
                .storage
                .from('manifests')
                .upload(fileName, blob, {
                    contentType: 'application/pdf',
                    upsert: true
                });

            if (uploadError) throw new Error(`Error subiendo PDF: ${uploadError.message}`);

            // 5. Get Public URL
            const { data: { publicUrl } } = supabase
                .storage
                .from('manifests')
                .getPublicUrl(fileName);

            // 6. Send to Webhook
            // Add the target to the itinerary object for the utility to read
            const itinWithTarget = { ...itinerary, target };
            const result = await sendItineraryToWebhook(itinWithTarget, crewList, publicUrl, bookingsList);

            if (result.success) {
                toast({ className: "bg-green-500 text-white", title: "¡Enviado!", description: `Notificación a ${target === 'passengers' ? 'pasajeros' : 'tripulación'} exitosa.` });
            } else {
                toast({ variant: "destructive", title: "Error n8n", description: result.error });
            }

        } catch (error: any) {
            console.error(error);
            toast({ variant: "destructive", title: "Error", description: error.message });
        }
    };

    const handleDelete = async () => {
        if (!deletingItinerary) return;
        try {
            const res = await fetch(`/api/itineraries/${deletingItinerary.id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchItineraries();
                setDeletingItinerary(null);
            } else {
                alert('Error al eliminar itinerario. Asegúrese de que no tenga reservas asociadas o contacte soporte.');
            }
        } catch (error) {
            console.error(error);
            alert('Error inesperado al eliminar.');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'in_progress': return 'bg-green-100 text-green-800 border-green-200';
            case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
            case 'suspended': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6 gap-4">
                <div>
                    {/* Header removed to reduce redundancy */}
                </div>
                <Dialog open={isOpen || !!editingItinerary} onOpenChange={(open) => {
                    if (!open) {
                        setIsOpen(false);
                        setEditingItinerary(null);
                    }
                }}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setIsOpen(true)}><Plus className="mr-2 h-4 w-4" /> Nuevo Itinerario</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>{editingItinerary ? 'Editar Itinerario' : 'Crear Nuevo Itinerario'}</DialogTitle>
                        </DialogHeader>
                        <div className="py-2">
                            <ItineraryForm
                                initialData={editingItinerary || undefined}
                                onSuccess={() => { setIsOpen(false); setEditingItinerary(null); fetchItineraries(); }}
                            />
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border rounded-md overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-center">Fecha</TableHead>
                            <TableHead className="text-center">Nave</TableHead>
                            <TableHead className="text-center">Ruta / Paradas</TableHead>
                            <TableHead className="text-center">Estado</TableHead>
                            <TableHead className="text-center">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">Cargando...</TableCell>
                            </TableRow>
                        ) : itineraries.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    No hay itinerarios programados.
                                </TableCell>
                            </TableRow>
                        ) : (
                            itineraries.map((itin) => (
                                <TableRow key={itin.id}>
                                    <TableCell className="text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="font-medium flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(itin.date)}</span>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {itin.start_time}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="font-medium flex items-center gap-1"><Ship className="w-3 h-3" /> {itin.vessel?.name || 'N/A'}</span>
                                            <span className="text-xs text-muted-foreground">Cap: {itin.vessel?.capacity || 0} pax</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex flex-wrap gap-1 items-center justify-center text-sm">
                                            {itin.stops?.sort((a, b) => a.stop_order - b.stop_order).map((stop, idx) => (
                                                <div key={stop.id} className="flex items-center">
                                                    {idx > 0 && <span className="mx-1 text-muted-foreground">→</span>}
                                                    <Badge variant="outline" className="font-normal">{stop.location?.name}</Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline" className={getStatusColor(itin.status)}>
                                            {itin.status === 'scheduled' ? 'Programado' :
                                                itin.status === 'in_progress' ? 'En Curso' :
                                                    itin.status === 'completed' ? 'Finalizado' :
                                                        itin.status === 'suspended' ? 'Suspendido' : 'Cancelado'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex gap-2 justify-center">
                                            <Button variant="ghost" size="sm" onClick={() => setEditingItinerary(itin)} title="Editar">
                                                <Pencil className="w-4 h-4 text-blue-500" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => setManagingCrew(itin)} title="Tripulación">
                                                <Users className="w-4 h-4 text-orange-500" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => setViewingManifest(itin)} title="Manifiesto">
                                                <FileText className="w-4 h-4 text-green-600" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => openNotifyDialog(itin)} title="Enviar a n8n">
                                                <Send className="w-4 h-4 text-purple-600" />
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => setManagingItinerary(itin)}>
                                                Reservas
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => setDeletingItinerary(itin)}>
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={!!managingItinerary} onOpenChange={(open) => !open && setManagingItinerary(null)}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Gestionar Reservas: {managingItinerary?.vessel?.name}</DialogTitle>
                    </DialogHeader>
                    {managingItinerary && <BookingManager itinerary={managingItinerary} />}
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deletingItinerary} onOpenChange={(open) => !open && setDeletingItinerary(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar Itinerario?</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de eliminar el itinerario de <strong>{deletingItinerary?.vessel?.name}</strong> del <strong>{deletingItinerary && formatDate(deletingItinerary.date)}</strong>?
                            Esta acción no se puede deshacer y borrará todas las paradas asociadas.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={!!managingCrew} onOpenChange={(open) => !open && setManagingCrew(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Gestionar Tripulación</DialogTitle>
                        <DialogDescription>
                            Asigne o elimine miembros de la tripulación para este itinerario.
                        </DialogDescription>
                    </DialogHeader>
                    {managingCrew && <CrewManager itinerary={managingCrew} onClose={() => setManagingCrew(null)} />}
                </DialogContent>
            </Dialog>

            <Dialog open={!!viewingManifest} onOpenChange={(open) => !open && setViewingManifest(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Vista Previa de Manifiesto</DialogTitle>
                        <DialogDescription>
                            Detalle de tripulación y pasajeros para el zarpe seleccionado.
                        </DialogDescription>
                    </DialogHeader>
                    {viewingManifest && viewingManifest.id && <ManifestPreview itineraryId={viewingManifest.id} />}
                </DialogContent>
            </Dialog>

            {/* Notification Selection Dialog */}
            <AlertDialog open={notifyDialog.open} onOpenChange={(open) => !open && setNotifyDialog(prev => ({ ...prev, open: false }))}>
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl">Notificar Viaje</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿A quién desea enviar las notificaciones de WhatsApp?
                            <br /><span className="text-xs text-muted-foreground">(Se enviará un mensaje individual a cada persona)</span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="grid grid-cols-1 gap-3 py-4">
                        <Button
                            variant="outline"
                            className="h-16 flex flex-col items-center justify-center gap-1 hover:border-blue-500 hover:bg-blue-50/50 group"
                            onClick={() => handleConfirmSend('passengers')}
                        >
                            <div className="flex items-center gap-2 font-semibold text-blue-700">
                                <Users className="w-5 h-5" />
                                Notificar Pasajeros
                            </div>
                            <span className="text-xs text-muted-foreground font-normal">Link de rastreo personalizado</span>
                        </Button>

                        <Button
                            variant="outline"
                            className="h-16 flex flex-col items-center justify-center gap-1 hover:border-orange-500 hover:bg-orange-50/50 group"
                            onClick={() => handleConfirmSend('crew')}
                        >
                            <div className="flex items-center gap-2 font-semibold text-orange-700">
                                <Ship className="w-5 h-5" />
                                Notificar Tripulación
                            </div>
                            <span className="text-xs text-muted-foreground font-normal">Manifiesto PDF para el Capitán</span>
                        </Button>
                    </div>

                    <AlertDialogFooter className="sm:justify-center">
                        <AlertDialogCancel className="w-full sm:w-auto">Cerrar</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
