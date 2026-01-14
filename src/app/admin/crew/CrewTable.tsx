'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Person, personSchema } from '@/utils/zod_schemas';
import { normalizeRut, normalizePhone, formatRut } from '@/utils/formatters';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, UserPlus, Check, ChevronsUpDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod'; // Standard resolver, assuming it's available or we use manual validation
import { z } from 'zod';

// We reuse personSchema but we'll force is_crew to true
const crewFormSchema = personSchema.extend({
    is_crew: z.literal(true).default(true),
});

type CrewFormValues = z.infer<typeof crewFormSchema>;

export default function CrewTable() {
    const supabase = createClient();
    const [people, setPeople] = useState<Person[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [isPromoteOpen, setIsPromoteOpen] = useState(false);
    const [editingPerson, setEditingPerson] = useState<Person | null>(null);

    const fetchData = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('people')
            .select('*')
            .eq('is_crew', true) // Filter ONLY crew
            .order('first_name');

        if (error) console.error(error);
        else setPeople(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar a este tripulante?')) return;
        const { error } = await supabase.from('people').delete().eq('id', id);
        if (error) alert('Error al eliminar');
        else fetchData();
    };

    const CrewForm = ({ initialData, onSuccess }: { initialData?: Person, onSuccess: () => void }) => {
        const [submitting, setSubmitting] = useState(false);
        // Manual form state for simplicity if hook form is complex to setup in one go
        // But let's try to be clean.

        const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            setSubmitting(true);
            const formData = new FormData(e.currentTarget);

            const rawData = {
                rut_normalized: normalizeRut(formData.get('rut') as string),
                rut_display: formatRut(formData.get('rut') as string),
                first_name: formData.get('first_name') as string,
                last_name: formData.get('last_name') as string,
                company: 'Yadran',
                job_title: formData.get('job_title') as string,
                phone_e164: normalizePhone(formData.get('phone') as string || ''),
                is_crew: true,
                active: true
            };

            // Basic validation
            if (!rawData.first_name || !rawData.rut_display) {
                alert('Nombre y RUT son obligatorios');
                setSubmitting(false);
                return;
            }

            const { error } = initialData?.id
                ? await supabase.from('people').update(rawData).eq('id', initialData.id)
                : await supabase.from('people').insert(rawData);

            setSubmitting(false);
            setSubmitting(false);
            if (error) {
                if (error.message.includes('people_rut_normalized_key')) {
                    alert('Este RUT ya está registrado en el sistema. Es posible que la persona ya exista como Pasajero.\n\nPor favor, búsquelo en la lista de gestor de itinerarios o contacte a soporte.');
                } else {
                    alert('Error: ' + error.message);
                }
            } else {
                onSuccess();
            }
        };

        return (
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>RUT</Label>
                        <Input
                            name="rut"
                            defaultValue={initialData?.rut_display}
                            placeholder="12.345.678-9"
                            required
                            onChange={(e) => {
                                e.target.value = formatRut(e.target.value);
                            }}
                        />
                        <p className="text-[10px] text-muted-foreground">Formato automático</p>
                    </div>
                    <div className="space-y-2">
                        <Label>Celular (WhatsApp)</Label>
                        <Input name="phone" defaultValue={initialData?.phone_e164?.replace('+', '') || ''} placeholder="56912345678" />
                        <p className="text-[10px] text-muted-foreground">Ingresar formato 569XXXXXXXX (sin +)</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Nombres</Label>
                        <Input name="first_name" defaultValue={initialData?.first_name} required />
                    </div>
                    <div className="space-y-2">
                        <Label>Apellidos</Label>
                        <Input name="last_name" defaultValue={initialData?.last_name} required />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Cargo / Rol</Label>
                    <Select name="job_title" defaultValue={initialData?.job_title || 'Tripulante'}>
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccionar rol" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Capitán">Capitán</SelectItem>
                            <SelectItem value="Patrón">Sustituto (Patrón)</SelectItem>
                            <SelectItem value="Tripulante">Tripulante</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <Button type="submit" disabled={submitting}>
                        {initialData ? 'Actualizar' : 'Crear'}
                    </Button>
                </div>
            </form>
        );
    };

    const PromotePassengerForm = ({ onSuccess }: { onSuccess: () => void }) => {
        const [openCombobox, setOpenCombobox] = useState(false);
        const [selectedPersonId, setSelectedPersonId] = useState<string>('');
        const [nonCrewPeople, setNonCrewPeople] = useState<Person[]>([]);
        const [loadingSearch, setLoadingSearch] = useState(false);
        const [promoting, setPromoting] = useState(false);

        useEffect(() => {
            const fetchNonCrew = async () => {
                setLoadingSearch(true);
                const { data } = await supabase
                    .from('people')
                    .select('*')
                    .neq('is_crew', true)
                    .eq('active', true)
                    .order('first_name')
                    .order('first_name')
                    .limit(1000);

                if (data) setNonCrewPeople(data);
                setLoadingSearch(false);
            };
            fetchNonCrew();
        }, []);

        const handlePromote = async () => {
            if (!selectedPersonId) return;
            setPromoting(true);

            const { error } = await supabase
                .from('people')
                .update({ is_crew: true })
                .eq('id', selectedPersonId);

            setPromoting(false);

            if (error) {
                alert('Error al promover: ' + error.message);
            } else {
                alert('Persona agregada a la tripulación exitosamente.');
                onSuccess();
            }
        };

        return (
            <div className="space-y-4 py-4">
                <div className="space-y-2 flex flex-col">
                    <Label>Buscar Pasajero</Label>
                    <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openCombobox}
                                className="justify-between w-full"
                            >
                                {selectedPersonId
                                    ? nonCrewPeople.find((p) => p.id === selectedPersonId)
                                        ? `${nonCrewPeople.find((p) => p.id === selectedPersonId)?.first_name} ${nonCrewPeople.find((p) => p.id === selectedPersonId)?.last_name}`
                                        : "Seleccionar persona..."
                                    : "Seleccionar persona..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-full" align="start">
                            <Command>
                                <CommandInput placeholder="Buscar por nombre o RUT..." />
                                <CommandList>
                                    <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                                    <CommandGroup>
                                        {nonCrewPeople.map((p) => (
                                            <CommandItem
                                                key={p.id}
                                                value={`${p.first_name} ${p.last_name} ${p.rut_display} ${p.rut_normalized}`}
                                                onSelect={() => {
                                                    setSelectedPersonId(p.id === selectedPersonId ? "" : p.id || "")
                                                    setOpenCombobox(false)
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        selectedPersonId === p.id ? "opacity-100" : "opacity-0"
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
                    <p className="text-xs text-muted-foreground">
                        Busca personas que ya están registradas como pasajeros pero NO son tripulación.
                    </p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <Button onClick={handlePromote} disabled={!selectedPersonId || promoting}>
                        {promoting ? 'Agregando...' : 'Agregar a Tripulación'}
                    </Button>
                </div>
            </div>
        );
    };

    return (
        <div>
            {/* Promote Dialog */}
            <Dialog open={isPromoteOpen} onOpenChange={setIsPromoteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Buscar Persona Existente</DialogTitle>
                    </DialogHeader>
                    <PromotePassengerForm onSuccess={() => { setIsPromoteOpen(false); fetchData(); }} />
                </DialogContent>
            </Dialog>

            <div className="flex justify-end mb-4 gap-2">
                <Button variant="outline" onClick={() => setIsPromoteOpen(true)}>
                    <UserPlus className="w-4 h-4 mr-2" /> Buscar Existente
                </Button>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setEditingPerson(null)}>
                            <Plus className="w-4 h-4 mr-2" /> Nuevo Tripulante
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingPerson ? 'Editar Tripulante' : 'Nuevo Tripulante'}</DialogTitle>
                        </DialogHeader>
                        <CrewForm
                            initialData={editingPerson || undefined}
                            onSuccess={() => { setIsOpen(false); fetchData(); }}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>RUT</TableHead>
                            <TableHead>Cargo</TableHead>
                            <TableHead>Teléfono</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={5} className="text-center">Cargando...</TableCell></TableRow>
                        ) : people.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No hay tripulantes registrados.</TableCell></TableRow>
                        ) : (
                            people.map((p) => (
                                <TableRow key={p.id}>
                                    <TableCell>{p.first_name} {p.last_name}</TableCell>
                                    <TableCell>{p.rut_display}</TableCell>
                                    <TableCell>{p.job_title || '-'}</TableCell>
                                    <TableCell>{p.phone_e164 || '-'}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => { setEditingPerson(p); setIsOpen(true); }}>
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => p.id && handleDelete(p.id)}>
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
        </div >
    );
}
