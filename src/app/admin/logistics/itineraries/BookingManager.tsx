import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, AlertCircle, FileText, Pencil, Check, ChevronsUpDown } from 'lucide-react';
import { Itinerary, Person } from '@/utils/zod_schemas';
import { ManifestDocument } from '@/components/pdf/ManifestDocument';
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/utils/formatters";
import { cn } from "@/lib/utils";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"


interface BookingManagerProps {
    itinerary: any; // Using any for ItineraryWithRelations to avoid import complexities
}

interface Booking {
    id: string;
    passenger: { id: string; first_name: string; last_name: string; rut_display: string };
    origin_stop: { id: string; location: { name: string }, stop_order: number };
    destination_stop: { id: string; location: { name: string }, stop_order: number };
    status: string;
}

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function BookingManager({ itinerary }: BookingManagerProps) {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [people, setPeople] = useState<Person[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { toast } = useToast();

    // Form State
    const [selectedPassenger, setSelectedPassenger] = useState<string>('');
    const [selectedOrigin, setSelectedOrigin] = useState<string>('');
    const [selectedDestination, setSelectedDestination] = useState<string>('');
    const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
    const [openCombobox, setOpenCombobox] = useState(false);

    const sortedStops = itinerary.stops?.sort((a: any, b: any) => a.stop_order - b.stop_order) || [];

    const fetchBookings = async () => {
        const res = await fetch(`/api/bookings?itinerary_id=${itinerary.id}`);
        if (res.ok) {
            const data = await res.json();
            setBookings(data);
        }
    };

    const fetchPeople = async () => {
        const res = await fetch('/api/people');
        if (res.ok) {
            const data = await res.json();
            setPeople(data);
        }
    };

    useEffect(() => {
        fetchBookings();
        fetchPeople();
    }, [itinerary.id]);

    const handleSaveBooking = async () => {
        if (!selectedPassenger || !selectedOrigin || !selectedDestination) {
            setError('Todos los campos son requeridos');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const url = editingBookingId ? `/api/bookings/${editingBookingId}` : '/api/bookings';
            const method = editingBookingId ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    itinerary_id: itinerary.id,
                    passenger_id: selectedPassenger,
                    origin_stop_id: selectedOrigin,
                    destination_stop_id: selectedDestination
                })
            });

            const data = await res.json();

            if (res.status === 409) {
                toast({
                    variant: "destructive",
                    title: "⚠️ Sin cupo disponible",
                    description: "La nave no tiene capacidad para este tramo.",
                });
                return; // Stop execution without throwing generic error
            }

            if (!res.ok) {
                throw new Error(data.error || 'Error al guardar reserva');
            }

            // Success
            fetchBookings();
            setIsDialogOpen(false);
            resetForm();
            toast({
                title: editingBookingId ? "Reserva actualizada" : "Reserva creada",
                description: `Pasajero ${selectedPassenger} asignado exitosamente.`,
                className: "bg-green-500 text-white border-green-600"
            });
        } catch (err: any) {
            setError(err.message);
            toast({
                variant: "destructive",
                title: "Error al guardar",
                description: err.message
            });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setSelectedPassenger('');
        setSelectedOrigin('');
        setSelectedDestination('');
        setEditingBookingId(null);
        setError('');
    };

    const openNewBooking = () => {
        resetForm();
        setIsDialogOpen(true);
    };

    const openEditBooking = (b: Booking) => {
        setSelectedPassenger(b.passenger?.id);
        setSelectedOrigin(b.origin_stop?.id);
        setSelectedDestination(b.destination_stop?.id);
        setEditingBookingId(b.id);
        setError('');
        setIsDialogOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <Button onClick={openNewBooking}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Reserva
                </Button>

                {bookings.length > 0 && (
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={loading}
                        onClick={async () => {
                            try {
                                setLoading(true);
                                const { pdf } = await import('@react-pdf/renderer');
                                const blob = await pdf(
                                    <ManifestDocument
                                        vesselName={itinerary.vessel?.name || 'Nave Desconocida'}
                                        itineraryDate={formatDate(itinerary.date)}
                                        startTime={itinerary.start_time}
                                        passengers={bookings}
                                    />
                                ).toBlob();

                                const url = URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `manifiesto_${itinerary.date}_${itinerary.vessel?.name?.replace(/\s+/g, '_')}.pdf`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                URL.revokeObjectURL(url);
                            } catch (e) {
                                console.error("Error generating PDF:", e);
                                setError('Error al generar el manifiesto PDF');
                            } finally {
                                setLoading(false);
                            }
                        }}
                    >
                        <FileText className="w-4 h-4 mr-2" />
                        {loading ? 'Generando PDF...' : 'Descargar Manifiesto'}
                    </Button>
                )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingBookingId ? 'Editar Reserva' : 'Nueva Reserva'}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" /> {error}
                            </div>
                        )}

                        <div className="space-y-2 flex flex-col">
                            <Label>Pasajero</Label>
                            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openCombobox}
                                        className="w-full justify-between"
                                    >
                                        {selectedPassenger
                                            ? people.find((p) => p.id === selectedPassenger)?.first_name + " " + people.find((p) => p.id === selectedPassenger)?.last_name
                                            : "Seleccionar pasajero..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-0">
                                    <Command>
                                        <CommandInput placeholder="Buscar por nombre o RUT..." />
                                        <CommandList>
                                            <CommandEmpty>No se encontró pasajero.</CommandEmpty>
                                            <CommandGroup>
                                                {people.map((p) => (
                                                    <CommandItem
                                                        key={p.id}
                                                        value={p.first_name + " " + p.last_name + " " + p.rut_display}
                                                        onSelect={() => {
                                                            setSelectedPassenger(p.id!)
                                                            setOpenCombobox(false)
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                selectedPassenger === p.id ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        {p.first_name} {p.last_name} ({p.rut_display})
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <Label>Origen</Label>
                            <Select value={selectedOrigin} onValueChange={setSelectedOrigin}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Subida" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sortedStops.map((stop: any) => (
                                        <SelectItem key={stop.id} value={stop.id}>
                                            {stop.location.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Destino</Label>
                            <Select value={selectedDestination} onValueChange={setSelectedDestination}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Bajada" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sortedStops.map((stop: any) => (
                                        <SelectItem key={stop.id} value={stop.id}>
                                            {stop.location.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button onClick={handleSaveBooking} disabled={loading}>
                                {loading ? 'Validando...' : (editingBookingId ? 'Actualizar Reserva' : 'Confirmar Reserva')}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Pasajero</TableHead>
                            <TableHead>Tramo</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="w-[100px] text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {bookings.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                                    No hay reservas confirmadas.
                                </TableCell>
                            </TableRow>
                        ) : (
                            bookings.map(b => (
                                <TableRow key={b.id}>
                                    <TableCell className="font-medium">
                                        {b.passenger?.first_name} {b.passenger?.last_name}
                                        <div className="text-xs text-muted-foreground">{b.passenger?.rut_display}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-sm">
                                            <span>{b.origin_stop?.location?.name}</span>
                                            <span className="text-muted-foreground">→</span>
                                            <span>{b.destination_stop?.location?.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            {b.status === 'confirmed' ? 'Confirmada' :
                                                b.status === 'cancelled' ? 'Cancelada' :
                                                    b.status === 'pending' ? 'Pendiente' : b.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openEditBooking(b)}
                                            >
                                                <Pencil className="w-4 h-4 text-blue-500" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={async () => {
                                                    if (!confirm('¿Eliminar reserva?')) return;
                                                    await fetch(`/api/bookings/${b.id}`, { method: 'DELETE' });
                                                    toast({ title: "Reserva eliminada" });
                                                    fetchBookings();
                                                }}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
