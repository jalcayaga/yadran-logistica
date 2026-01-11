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
import { Plus, Trash2, AlertCircle, FileText, Pencil, Check, ChevronsUpDown, Upload, FileSpreadsheet } from 'lucide-react';
import { Itinerary, Person } from '@/utils/zod_schemas';
import { ManifestDocument } from '@/components/pdf/ManifestDocument';
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/utils/formatters";
import { cn } from "@/lib/utils";
import Papa from 'papaparse';
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

interface BulkRow {
    rut: string;
    personName?: string;
    personId?: string;
    originName: string;
    originId?: string;
    destinationName: string;
    destinationId?: string;
    isValid: boolean;
    error?: string;
}

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function BookingManager({ itinerary }: BookingManagerProps) {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [people, setPeople] = useState<Person[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { toast } = useToast();

    // Bulk Upload State
    const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
    const [parsedRows, setParsedRows] = useState<BulkRow[]>([]);
    const [bulkError, setBulkError] = useState('');

    // Form State
    const [selectedPassenger, setSelectedPassenger] = useState<string>('');
    const [selectedOrigin, setSelectedOrigin] = useState<string>('');
    const [selectedDestination, setSelectedDestination] = useState<string>('');
    const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
    const [openCombobox, setOpenCombobox] = useState(false);

    const sortedStops = itinerary.stops?.sort((a: any, b: any) => a.stop_order - b.stop_order) || [];

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setBulkError('');
        setParsedRows([]);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const rows: BulkRow[] = [];
                // Itinerary Start Location (Default Origin for all)
                const defaultOrigin = sortedStops[0];

                if (!defaultOrigin) {
                    setBulkError('El itinerario no tiene paradas definidas. No se puede determinar el origen.');
                    return;
                }

                results.data.forEach((row: any) => {
                    // Mapeo flexible de columnas (Excel suele traer mayusculas/tildes)
                    // Keys expected: RUT, CENTRO (o DESTINO)
                    const rut = row['RUT'] || row['rut'] || row['Rut'] || '';
                    const destRaw = row['CENTRO'] || row['centro'] || row['DESTINO'] || row['destino'] || row['Centro'] || '';

                    if (!rut || !destRaw) return; // Skip empty rows

                    // 1. Find Person
                    const cleanRut = rut.replace(/\./g, '').replace(/-/g, '').toUpperCase();
                    const person = people.find(p => p.rut_normalized.replace(/\./g, '').replace(/-/g, '').toUpperCase().includes(cleanRut)); // Loose match logic

                    // 2. Find Destination Stop
                    // Attempt to fuzzy match or exact match the location name
                    const destinationStop = sortedStops.find((s: any) =>
                        s.location.name.toLowerCase().trim() === destRaw.toLowerCase().trim() ||
                        s.location.code.toLowerCase().trim() === destRaw.toLowerCase().trim()
                    );

                    let isValid = true;
                    let errorMsg = '';

                    if (!person) { isValid = false; errorMsg += 'Pasajero no existe en sistema. '; }
                    if (!destinationStop) { isValid = false; errorMsg += `Centro '${destRaw}' no es parte de este viaje. `; }

                    // Prevent circular route (Origin == Destination)
                    if (destinationStop?.id === defaultOrigin.id) {
                        isValid = false;
                        errorMsg += 'El destino es igual al origen. ';
                    }

                    rows.push({
                        rut,
                        personName: person ? `${person.first_name} ${person.last_name}` : undefined,
                        personId: person?.id,
                        originName: defaultOrigin.location.name,
                        originId: defaultOrigin.id,
                        destinationName: destRaw,
                        destinationId: destinationStop?.id,
                        isValid,
                        error: errorMsg
                    });
                });

                if (rows.length === 0) {
                    setBulkError('No se encontraron filas válidas. Verifique que las columnas sean "RUT" y "CENTRO".');
                }

                setParsedRows(rows);
            },
            error: (err) => {
                setBulkError('Error al leer CSV: ' + err.message);
            }
        });
    };

    const confirmBulkUpload = async () => {
        const validRows = parsedRows.filter(r => r.isValid);
        if (validRows.length === 0) return;

        setLoading(true);
        try {
            // Sequential upload to avoid overwhelming server or hitting race conditions
            let successCount = 0;
            let errors = [];

            for (const row of validRows) {
                const res = await fetch('/api/bookings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        itinerary_id: itinerary.id,
                        passenger_id: row.personId,
                        origin_stop_id: row.originId,
                        destination_stop_id: row.destinationId
                    })
                });

                if (res.ok) {
                    successCount++;
                } else {
                    const d = await res.json();
                    errors.push(`RUT ${row.rut}: ${d.error || 'Fallo desconocido'}`);
                }
            }

            fetchBookings();
            setBulkDialogOpen(false);
            setParsedRows([]);

            if (errors.length > 0) {
                toast({
                    variant: "destructive",
                    title: `Carga parcial: ${successCount} exitosos`,
                    description: `Errores: ${errors.slice(0, 3).join(', ')} ...`,
                });
            } else {
                toast({
                    title: "Carga Masiva Exitosa",
                    description: `Se crearon ${successCount} reservas correctamente.`,
                    className: "bg-green-500 text-white"
                });
            }

        } catch (e: any) {
            setBulkError(e.message);
        } finally {
            setLoading(false);
        }
    };

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
            <div className="flex justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
                <div className="flex gap-2">
                    <Button onClick={openNewBooking} className="shadow-sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Nueva Reserva
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={() => setBulkDialogOpen(true)}
                        className="shadow-sm border-input"
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        Carga Masiva (CSV)
                    </Button>
                </div>

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

            {/* Bulk Upload Dialog */}
            <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Carga Masiva de Pasajeros (CSV)</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="p-4 border-2 border-dashed rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:border-zinc-700 transition-colors text-center cursor-pointer relative">
                            <input
                                type="file"
                                accept=".csv"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={handleFileUpload}
                            />
                            <div className="flex flex-col items-center gap-2 py-4">
                                <FileSpreadsheet className="w-8 h-8 text-muted-foreground" />
                                <span className="text-sm font-medium">Arrastra un archivo CSV o haz clic para buscar</span>
                                <span className="text-xs text-muted-foreground">Formato: RUT, CENTRO (El nombre es opcional)</span>
                            </div>
                        </div>

                        {bulkError && (
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" /> {bulkError}
                            </div>
                        )}

                        {parsedRows.length > 0 && (
                            <div className="border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>RUT</TableHead>
                                            <TableHead>Pasajero</TableHead>
                                            <TableHead>Tramo</TableHead>
                                            <TableHead className="w-[100px]">Estado</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {parsedRows.map((row, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell>{row.rut}</TableCell>
                                                <TableCell>{row.personName || <span className="text-muted-foreground italic">No encontrado</span>}</TableCell>
                                                <TableCell className="text-xs">
                                                    {row.originName} → {row.destinationName}
                                                </TableCell>
                                                <TableCell>
                                                    {row.isValid ? (
                                                        <Check className="w-4 h-4 text-green-500" />
                                                    ) : (
                                                        <span className="text-xs text-red-500 font-medium">{row.error}</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="ghost" onClick={() => setBulkDialogOpen(false)}>Cancelar</Button>
                            <Button
                                onClick={confirmBulkUpload}
                                disabled={loading || parsedRows.filter(r => r.isValid).length === 0}
                            >
                                {loading ? 'Procesando...' : `Cargar ${parsedRows.filter(r => r.isValid).length} reservas`}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingBookingId ? 'Editar Reserva' : 'Nueva Reserva'}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm flex items-center gap-2">
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
                                                    try {
                                                        const res = await fetch(`/api/bookings/${b.id}`, { method: 'DELETE' });
                                                        if (!res.ok) {
                                                            const err = await res.json();
                                                            throw new Error(err.error || 'Error al eliminar');
                                                        }
                                                        toast({ title: "Reserva eliminada", className: "bg-green-500 text-white" });
                                                        fetchBookings();
                                                    } catch (e: any) {
                                                        toast({
                                                            variant: "destructive",
                                                            title: "Error",
                                                            description: e.message
                                                        });
                                                    }
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
