'use client';

import { useState, useEffect } from "react";
import { Itinerary } from '@/utils/zod_schemas';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from '@/components/ui/button';
import { Plus, Calendar, Clock, Ship, Trash2, Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
    const [itineraries, setItineraries] = useState<ItineraryWithRelations[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [managingItinerary, setManagingItinerary] = useState<ItineraryWithRelations | null>(null);
    const [editingItinerary, setEditingItinerary] = useState<ItineraryWithRelations | null>(null);
    const [deletingItinerary, setDeletingItinerary] = useState<ItineraryWithRelations | null>(null);

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
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6 gap-4">
                <div>
                    <h2 className="text-xl font-semibold">Itinerarios Programados</h2>
                    <p className="text-sm text-muted-foreground">Gestiona las salidas de naves y sus paradas.</p>
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

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Nave</TableHead>
                            <TableHead>Ruta / Paradas</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Acciones</TableHead>
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
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(itin.date)}</span>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {itin.start_time}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium flex items-center gap-1"><Ship className="w-3 h-3" /> {itin.vessel?.name || 'N/A'}</span>
                                            <span className="text-xs text-muted-foreground">Cap: {itin.vessel?.capacity || 0} pax</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1 items-center text-sm">
                                            {itin.stops?.sort((a, b) => a.stop_order - b.stop_order).map((stop, idx) => (
                                                <div key={stop.id} className="flex items-center">
                                                    {idx > 0 && <span className="mx-1 text-muted-foreground">→</span>}
                                                    <Badge variant="outline" className="font-normal">{stop.location?.name}</Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={getStatusColor(itin.status)}>
                                            {itin.status === 'scheduled' ? 'Programado' :
                                                itin.status === 'in_progress' ? 'En Curso' :
                                                    itin.status === 'completed' ? 'Finalizado' : 'Cancelado'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => setEditingItinerary(itin)} title="Editar">
                                                <Pencil className="w-4 h-4 text-blue-500" />
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => setManagingItinerary(itin)}>
                                                Gestionar
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
        </div>
    );
}
