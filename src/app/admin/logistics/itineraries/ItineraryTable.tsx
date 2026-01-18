'use client';

import { useState, useEffect } from "react";
import { Itinerary } from '@/utils/zod_schemas';
import { createClient } from '@/utils/supabase/client';
import { sendItineraryToWebhook } from '@/utils/whatsapp';
import { useToast } from "@/hooks/use-toast";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from '@/components/ui/card';
import {
    Plus,
    Calendar,
    Clock,
    Ship,
    Trash2,
    Pencil,
    Users,
    FileText,
    Send,
    ChevronRight,
    MapPin,
    MoreHorizontal,
    LayoutDashboard,
    Loader2,
    CalendarDays,
    Search
} from 'lucide-react';
import CrewManager from './CrewManager';
import ManifestPreview from './ManifestPreview';
import { ManifestDocument } from '@/components/pdf/ManifestDocument';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import ItineraryForm from './ItineraryForm';
import BookingManager from './BookingManager';
import { formatDate } from "@/utils/formatters";

interface ItineraryWithRelations extends Omit<Itinerary, 'stops'> {
    vessel?: { name: string; capacity: number; registration_number?: string };
    stops: {
        id: string;
        stop_order: number;
        location_id: string;
        arrival_time: string;
        departure_time: string;
        location: { name: string };
    }[];
}

export default function ItineraryTable({ hideHeader = false }: { hideHeader?: boolean }) {
    const supabase = createClient();
    const { toast } = useToast();
    const [itineraries, setItineraries] = useState<ItineraryWithRelations[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [managingItinerary, setManagingItinerary] = useState<ItineraryWithRelations | null>(null);
    const [editingItinerary, setEditingItinerary] = useState<ItineraryWithRelations | null>(null);
    const [deletingItinerary, setDeletingItinerary] = useState<ItineraryWithRelations | null>(null);
    const [managingCrew, setManagingCrew] = useState<ItineraryWithRelations | null>(null);
    const [viewingManifest, setViewingManifest] = useState<ItineraryWithRelations | null>(null);
    const [notifyDialog, setNotifyDialog] = useState<{ open: boolean, itinerary: ItineraryWithRelations | null }>({ open: false, itinerary: null });
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredItineraries, setFilteredItineraries] = useState<ItineraryWithRelations[]>([]);

    const fetchItineraries = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/itineraries', { cache: 'no-store' });
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

    useEffect(() => {
        const lowerTerm = searchTerm.toLowerCase();
        const filtered = itineraries.filter(itin =>
            (itin.vessel?.name || '').toLowerCase().includes(lowerTerm) ||
            itin.stops.some(s => s.location?.name.toLowerCase().includes(lowerTerm))
        );
        setFilteredItineraries(filtered);
    }, [searchTerm, itineraries]);

    const handleConfirmSend = async (target: 'passengers' | 'crew') => {
        if (!notifyDialog.itinerary) return;
        setNotifyDialog(prev => ({ ...prev, open: false }));
        await executeSendWebhook(notifyDialog.itinerary, target);
    };

    const executeSendWebhook = async (itinerary: ItineraryWithRelations, target: 'passengers' | 'crew') => {
        toast({ title: "Procesando...", description: `Notificando a ${target === 'passengers' ? 'Pasajeros' : 'Tripulación'}...` });

        try {
            const { data: crewData, error: crewError } = await supabase
                .from('crew_assignments')
                .select('*, person:people(*)')
                .eq('itinerary_id', itinerary.id);

            if (crewError) throw new Error("No se pudo obtener la tripulación");
            const crewList = (crewData || []).map((c: any) => ({
                ...c,
                confirmation_link: `${window.location.origin}/confirm/${c.confirmation_token}`
            }));

            const { data: bookingsData, error: bookingsError } = await supabase
                .from('bookings')
                .select('*, passenger:people(*), origin_stop:itinerary_stops!bookings_origin_stop_id_fkey(*, location:locations(*)), destination_stop:itinerary_stops!bookings_destination_stop_id_fkey(*, location:locations(*))')
                .eq('itinerary_id', itinerary.id)
                .neq('status', 'cancelled');

            if (bookingsError) throw new Error(`Error obteniendo pasajeros: ${bookingsError.message}`);
            const bookingsList = (bookingsData || []).map((b: any) => ({
                ...b,
                confirmation_link: `${window.location.origin}/confirm/${b.confirmation_token}`
            }));

            const { pdf } = await import('@react-pdf/renderer');
            const blob = await pdf(
                <ManifestDocument
                    vesselName={itinerary.vessel?.name || 'Nave Desconocida'}
                    vesselRegistration={itinerary.vessel?.registration_number}
                    itineraryDate={formatDate(itinerary.date)}
                    startTime={itinerary.start_time}
                    passengers={bookingsList}
                    crew={crewList}
                />
            ).toBlob();

            const fileName = `manifest_${itinerary.id}_${Date.now()}.pdf`;
            const { error: uploadError } = await supabase
                .storage
                .from('manifests')
                .upload(fileName, blob, { contentType: 'application/pdf', upsert: true });

            if (uploadError) throw new Error(`Error subiendo PDF: ${uploadError.message}`);

            const { data: { publicUrl } } = supabase.storage.from('manifests').getPublicUrl(fileName);

            const itinWithTarget = { ...itinerary, target };
            const result = await sendItineraryToWebhook(itinWithTarget, crewList, publicUrl, bookingsList);

            if (result.success) {
                toast({ className: "bg-green-600 text-white border-green-700", title: "¡Enviado!", description: `Notificación a ${target === 'passengers' ? 'pasajeros' : 'tripulación'} exitosa.` });
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
            if (res.ok) { fetchItineraries(); setDeletingItinerary(null); }
            else { alert('Error al eliminar itinerario.'); }
        } catch (error) { console.error(error); }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'scheduled': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400';
            case 'in_progress': return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'completed': return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400';
            case 'suspended': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400';
            case 'cancelled': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <Card className="border-none shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <CardContent className="p-0">
                <div className={`flex flex-col sm:flex-row ${hideHeader ? 'justify-end' : 'justify-between'} items-start sm:items-center p-6 gap-4 border-b border-slate-100 dark:border-slate-800/50`}>
                    {!hideHeader && (
                        <div className="flex flex-col gap-0.5">
                            <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2.5 text-slate-900 dark:text-white">
                                <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <LayoutDashboard className="w-5 h-5 text-blue-600" />
                                </div>
                                Logística de Operaciones
                            </h2>
                            <p className="text-[11px] text-muted-foreground font-medium pl-10">
                                Estado actual y programación de la flota activa
                            </p>
                        </div>
                    )}
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
                            <Input
                                placeholder="Buscar itinerario..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all font-normal"
                            />
                        </div>
                        <Dialog open={isOpen || !!editingItinerary} onOpenChange={(open) => { setIsOpen(open); if (!open) setEditingItinerary(null); }}>
                            <DialogTrigger asChild>
                                <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-all font-normal w-full sm:w-auto">
                                    <Plus className="mr-2 h-4 w-4" /> Nuevo Itinerario
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl">
                                <DialogHeader>
                                    <DialogTitle className="text-xl flex items-center gap-2">
                                        <CalendarDays className="w-5 h-5 text-blue-600" />
                                        {editingItinerary ? 'Editar Itinerario' : 'Crear Nuevo Itinerario'}
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="py-2 font-normal">
                                    <ItineraryForm
                                        initialData={editingItinerary || undefined}
                                        onSuccess={() => { setIsOpen(false); setEditingItinerary(null); fetchItineraries(); }}
                                    />
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <div className="overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                            <TableRow className="hover:bg-transparent border-slate-200 dark:border-slate-800/50">
                                <TableHead className="py-4 px-6 uppercase text-xs font-black tracking-widest text-slate-500 dark:text-slate-400/80">Fecha y Hora</TableHead>
                                <TableHead className="py-4 uppercase text-xs font-black tracking-widest text-slate-500 dark:text-slate-400/80">Embarcación</TableHead>
                                <TableHead className="py-4 uppercase text-xs font-black tracking-widest text-slate-500 dark:text-slate-400/80">Ruta y Paradas</TableHead>
                                <TableHead className="py-4 text-center uppercase text-xs font-black tracking-widest text-slate-500 dark:text-slate-400/80">Estado</TableHead>
                                <TableHead className="py-4 text-right pr-6 uppercase text-xs font-black tracking-widest text-slate-500 dark:text-slate-400/80">Gestión</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i} className="animate-pulse border-slate-100 dark:border-slate-800">
                                        <TableCell colSpan={5} className="py-6 px-6">
                                            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : filteredItineraries.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-20 bg-slate-50/20 dark:bg-slate-900/20">
                                        <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                                            <CalendarDays className="w-12 h-12 opacity-10" />
                                            <p className="text-lg font-medium">No hay itinerarios programados.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredItineraries.map((itin) => (
                                    <TableRow key={itin.id} className="group hover:bg-white dark:hover:bg-slate-800/50 border-slate-100 dark:border-slate-800 transition-all duration-200">
                                        <TableCell className="py-4 px-6">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 uppercase text-xs">
                                                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                                                    {formatDate(itin.date)}
                                                </span>
                                                <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 ml-5">
                                                    <Clock className="w-3 h-3" />
                                                    {itin.start_time}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 uppercase text-xs">
                                                    <Ship className="w-3.5 h-3.5 text-blue-500" />
                                                    {itin.vessel?.name || 'N/A'}
                                                </span>
                                                <div className="flex items-center gap-2 ml-5">
                                                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-slate-50 dark:bg-slate-800 font-normal">
                                                        CAP: {itin.vessel?.capacity || 0} PAX
                                                    </Badge>
                                                    {itin.vessel?.registration_number && (
                                                        <span className="text-[9px] font-mono text-slate-400">
                                                            {itin.vessel.registration_number}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex flex-wrap gap-1.5 items-center">
                                                {itin.stops?.sort((a, b) => a.stop_order - b.stop_order).map((stop, idx) => (
                                                    <div key={stop.id} className="flex items-center">
                                                        {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-400 mx-0.5" />}
                                                        <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-normal py-0.5 hover:bg-slate-200 transition-colors">
                                                            <MapPin className="w-2.5 h-2.5 mr-1 text-slate-400" />
                                                            {stop.location?.name}
                                                        </Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 text-center">
                                            <Badge variant="outline" className={`px-2.5 py-0.5 font-bold border rounded-full text-[10px] ${getStatusColor(itin.status)}`}>
                                                {itin.status === 'scheduled' ? 'PROGRAMADO' :
                                                    itin.status === 'in_progress' ? 'EN CURSO' :
                                                        itin.status === 'completed' ? 'FINALIZADO' :
                                                            itin.status === 'suspended' ? 'SUSPENDIDO' : 'CANCELADO'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-4 text-right pr-6">
                                            <div className="flex justify-end items-center gap-1">
                                                <Button variant="outline" size="sm" onClick={() => setManagingItinerary(itin)} className="h-8 text-[10px] font-bold border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-400">
                                                    RESERVAS
                                                </Button>
                                                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-0.5 ml-2">
                                                    <Button variant="ghost" size="icon" onClick={() => setEditingItinerary(itin)} className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30" title="Editar">
                                                        <Pencil className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => setManagingCrew(itin)} className="h-8 w-8 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-900/30" title="Tripulación">
                                                        <Users className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => setViewingManifest(itin)} className="h-8 w-8 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/30" title="Manifiesto">
                                                        <FileText className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => setNotifyDialog({ open: true, itinerary: itin })} className="h-8 w-8 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-900/30" title="Notificar">
                                                        <Send className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => setDeletingItinerary(itin)} className="h-8 w-8 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30" title="Eliminar">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>

            {/* Dialogs */}
            <Dialog open={!!managingItinerary} onOpenChange={(open) => !open && setManagingItinerary(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-600" />
                            Gestionar Reservas: {managingItinerary?.vessel?.name}
                        </DialogTitle>
                    </DialogHeader>
                    {managingItinerary && <BookingManager itinerary={managingItinerary} />}
                </DialogContent>
            </Dialog>

            <Dialog open={!!managingCrew} onOpenChange={(open) => !open && setManagingCrew(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl flex items-center gap-2">
                            <Users className="w-5 h-5 text-orange-600" />
                            Gestionar Tripulación
                        </DialogTitle>
                        <DialogDescription className="font-normal">
                            Asigne o elimine miembros de la tripulación para este itinerario.
                        </DialogDescription>
                    </DialogHeader>
                    {managingCrew && <CrewManager itinerary={managingCrew} onClose={() => setManagingCrew(null)} />}
                </DialogContent>
            </Dialog>

            <Dialog open={!!viewingManifest} onOpenChange={(open) => !open && setViewingManifest(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl flex items-center gap-2">
                            <FileText className="w-5 h-5 text-emerald-600" />
                            Vista Previa de Manifiesto
                        </DialogTitle>
                        <DialogDescription className="font-normal">
                            Detalle de tripulación y pasajeros para el zarpe seleccionado.
                        </DialogDescription>
                    </DialogHeader>
                    {viewingManifest && viewingManifest.id && <ManifestPreview itineraryId={viewingManifest.id} />}
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deletingItinerary} onOpenChange={(open) => !open && setDeletingItinerary(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl text-red-600 font-normal">¿Eliminar Itinerario?</AlertDialogTitle>
                        <AlertDialogDescription className="text-base font-normal pt-2">
                            ¿Estás seguro de eliminar el itinerario de <strong>{deletingItinerary?.vessel?.name}</strong> del <strong>{deletingItinerary && formatDate(deletingItinerary.date)}</strong>?
                            Esta acción borrará todas las paradas y ajustes.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="font-normal pt-4">
                        <AlertDialogCancel className="bg-slate-100 border-none">Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/20">Eliminar Itinerario</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={notifyDialog.open} onOpenChange={(open) => !open && setNotifyDialog(prev => ({ ...prev, open: false }))}>
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-normal">Notificar Viaje</AlertDialogTitle>
                        <AlertDialogDescription className="font-normal text-slate-500 pt-1">
                            Seleccione el grupo al que desea enviar notificaciones de WhatsApp.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="grid grid-cols-1 gap-3 py-4 font-normal">
                        <Button
                            variant="outline"
                            className="h-16 flex flex-col items-center justify-center gap-1 hover:border-blue-500 hover:bg-blue-50/50 group transition-all"
                            onClick={() => handleConfirmSend('passengers')}
                        >
                            <div className="flex items-center gap-2 font-bold text-blue-700">
                                <Users className="w-4 h-4" />
                                Notificar Pasajeros
                            </div>
                            <span className="text-[10px] text-slate-500 font-normal italic">Envía links de rastreo personalizados</span>
                        </Button>

                        <Button
                            variant="outline"
                            className="h-16 flex flex-col items-center justify-center gap-1 hover:border-orange-500 hover:bg-orange-50/50 group transition-all"
                            onClick={() => handleConfirmSend('crew')}
                        >
                            <div className="flex items-center gap-2 font-bold text-orange-700">
                                <Ship className="w-4 h-4" />
                                Notificar Tripulación
                            </div>
                            <span className="text-[10px] text-slate-500 font-normal italic">Envía Manifiesto PDF al Capitán</span>
                        </Button>
                    </div>

                    <AlertDialogFooter className="sm:justify-center font-normal pt-2">
                        <AlertDialogCancel className="w-full sm:w-auto bg-slate-100 border-none">Cerrar</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}
