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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import {
    Plus,
    Pencil,
    Trash2,
    UserPlus,
    Check,
    ChevronsUpDown,
    Search,
    ShipWheel,
    CreditCard,
    Phone,
    Briefcase,
    Filter,
    Anchor,
    LayoutDashboard
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Label } from '@/components/ui/label';
import { z } from 'zod';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from "@/hooks/use-toast";
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export default function CrewTable({ hideHeader = false }: { hideHeader?: boolean }) {
    const supabase = createClient();
    const [people, setPeople] = useState<Person[]>([]);
    const [filteredPeople, setFilteredPeople] = useState<Person[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [isPromoteOpen, setIsPromoteOpen] = useState(false);
    const [editingPerson, setEditingPerson] = useState<Person | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { toast } = useToast();

    const fetchData = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('people')
            .select('*')
            .eq('is_crew', true)
            .order('first_name');

        if (error) console.error(error);
        else {
            setPeople(data || []);
            setFilteredPeople(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (!searchTerm) {
            setFilteredPeople(people);
            return;
        }
        const lowerTerm = searchTerm.toLowerCase();
        const filtered = people.filter(p =>
            p.first_name.toLowerCase().includes(lowerTerm) ||
            p.last_name.toLowerCase().includes(lowerTerm) ||
            p.rut_display.toLowerCase().includes(lowerTerm) ||
            (p.job_title || '').toLowerCase().includes(lowerTerm)
        );
        setFilteredPeople(filtered);
    }, [searchTerm, people]);

    const confirmRemoveCrew = async () => {
        if (!deletingId) return;
        const { error } = await supabase.from('people').update({ is_crew: false }).eq('id', deletingId);

        if (error) {
            toast({ variant: "destructive", title: "Error", description: 'Error al actualizar: ' + error.message });
        } else {
            toast({ title: "Acción Exitosa", description: "La persona ha sido removida de la tripulación.", className: "bg-emerald-600 text-white border-emerald-700" });
            fetchData();
        }
        setDeletingId(null);
    };

    const CrewForm = ({ initialData, onSuccess }: { initialData?: Person, onSuccess: () => void }) => {
        const [submitting, setSubmitting] = useState(false);

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

            const { error } = initialData?.id
                ? await supabase.from('people').update(rawData).eq('id', initialData.id)
                : await supabase.from('people').insert(rawData);

            setSubmitting(false);
            if (error) {
                toast({ variant: "destructive", title: "Error", description: error.message });
            } else {
                toast({ title: "Guardado", description: "Los datos han sido guardados correctamente.", className: "bg-emerald-600 text-white border-emerald-700" });
                onSuccess();
            }
        };

        return (
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                        <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">RUT</Label>
                        <Input
                            name="rut"
                            defaultValue={initialData?.rut_display}
                            placeholder="12.345.678-9"
                            required
                            onChange={(e) => { e.target.value = formatRut(e.target.value); }}
                            className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Celular (WhatsApp)</Label>
                        <Input
                            name="phone"
                            defaultValue={initialData?.phone_e164?.replace('+', '') || ''}
                            placeholder="56912345678"
                            className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                        <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Nombres</Label>
                        <Input
                            name="first_name"
                            defaultValue={initialData?.first_name}
                            required
                            className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Apellidos</Label>
                        <Input
                            name="last_name"
                            defaultValue={initialData?.last_name}
                            required
                            className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Cargo / Rol en Nave</Label>
                    <Select name="job_title" defaultValue={initialData?.job_title || 'Tripulante'}>
                        <SelectTrigger className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
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
                    <Button type="submit" disabled={submitting} className="bg-orange-600 hover:bg-orange-700 font-normal">
                        {submitting ? 'Guardando...' : initialData ? 'Actualizar Tripulante' : 'Crear Tripulante'}
                    </Button>
                </div>
            </form>
        );
    };

    const PromotePassengerForm = ({ onSuccess }: { onSuccess: () => void }) => {
        const [openCombobox, setOpenCombobox] = useState(false);
        const [selectedPersonId, setSelectedPersonId] = useState<string>('');
        const [nonCrewPeople, setNonCrewPeople] = useState<Person[]>([]);
        const [promoting, setPromoting] = useState(false);

        useEffect(() => {
            const fetchNonCrew = async () => {
                const { data } = await supabase
                    .from('people')
                    .select('*')
                    .neq('is_crew', true)
                    .eq('active', true)
                    .order('first_name')
                    .limit(1000);
                if (data) setNonCrewPeople(data);
            };
            fetchNonCrew();
        }, []);

        const handlePromote = async () => {
            if (!selectedPersonId) return;
            setPromoting(true);
            const { error } = await supabase.from('people').update({ is_crew: true }).eq('id', selectedPersonId);
            setPromoting(false);
            if (error) {
                toast({ variant: "destructive", title: "Error", description: error.message });
            } else {
                toast({ title: "Éxito", description: "Persona agregada a la tripulación.", className: "bg-emerald-600 text-white border-emerald-700" });
                onSuccess();
            }
        };

        return (
            <div className="space-y-6 pt-4">
                <div className="space-y-3 flex flex-col">
                    <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Seleccionar Pasajero Registrado</Label>
                    <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" aria-expanded={openCombobox} className="justify-between w-full h-12 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-normal">
                                {selectedPersonId
                                    ? nonCrewPeople.find((p) => p.id === selectedPersonId)
                                        ? `${nonCrewPeople.find((p) => p.id === selectedPersonId)?.first_name} ${nonCrewPeople.find((p) => p.id === selectedPersonId)?.last_name}`
                                        : "Seleccionar persona..."
                                    : "Seleccionar persona..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]" align="start">
                            <Command>
                                <CommandInput placeholder="Buscar por nombre o RUT..." />
                                <CommandList>
                                    <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                                    <CommandGroup>
                                        {nonCrewPeople.map((p) => (
                                            <CommandItem
                                                key={p.id}
                                                value={`${p.first_name} ${p.last_name} ${p.rut_display}`}
                                                onSelect={() => { setSelectedPersonId(p.id === selectedPersonId ? "" : p.id || ""); setOpenCombobox(false); }}
                                                className="cursor-pointer"
                                            >
                                                <Check className={cn("mr-2 h-4 w-4 text-emerald-600", selectedPersonId === p.id ? "opacity-100" : "opacity-0")} />
                                                <div className="flex flex-col">
                                                    <span className="font-bold uppercase text-xs">{p.first_name} {p.last_name}</span>
                                                    <span className="text-[10px] text-muted-foreground">{p.rut_display}</span>
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    <p className="text-[11px] text-muted-foreground italic flex items-center gap-1.5 ml-1">
                        <Filter className="w-3 h-3" />
                        Solo se muestran personas que aún no son tripulantes.
                    </p>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <Button onClick={handlePromote} disabled={!selectedPersonId || promoting} className="bg-orange-600 hover:bg-orange-700 font-normal">
                        {promoting ? 'Procesando...' : 'Asignar como Tripulante'}
                    </Button>
                </div>
            </div>
        );
    };

    return (
        <Card className="border-none shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-0">
                <div className={`flex flex-col sm:flex-row ${hideHeader ? 'justify-end' : 'justify-between'} items-start sm:items-center p-6 gap-4 border-b border-slate-100 dark:border-slate-800/50`}>
                    {!hideHeader && (
                        <div className="flex flex-col gap-0.5">
                            <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2.5 text-slate-900 dark:text-white">
                                <div className="p-1.5 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                    <ShipWheel className="w-5 h-5 text-orange-600" />
                                </div>
                                Personal de Flota
                            </h2>
                            <p className="text-[11px] text-muted-foreground font-medium pl-10">
                                Capitanes y tripulación habilitada para zarpes
                            </p>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-orange-500 transition-colors" />
                            <Input
                                placeholder="Buscar tripulante..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 focus-visible:ring-orange-500/20 focus-visible:border-orange-500 transition-all font-normal"
                            />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            <Button variant="outline" onClick={() => setIsPromoteOpen(true)} className="border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-900 dark:text-orange-400 font-normal w-full sm:w-auto">
                                <UserPlus className="w-4 h-4 mr-2" /> Buscar Existente
                            </Button>
                            <Button onClick={() => { setEditingPerson(null); setIsOpen(true); }} className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/20 active:scale-95 transition-all font-normal w-full sm:w-auto">
                                <Plus className="mr-2 h-4 w-4" /> Nuevo
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                            <TableRow className="hover:bg-transparent border-slate-200 dark:border-slate-800/50">
                                <TableHead className="py-4 px-6 uppercase text-xs font-black tracking-widest text-slate-500 dark:text-slate-400/80">Nombre Completo</TableHead>
                                <TableHead className="py-4 uppercase text-xs font-black tracking-widest text-slate-500 dark:text-slate-400/80">Identificación</TableHead>
                                <TableHead className="py-4 uppercase text-xs font-black tracking-widest text-slate-500 dark:text-slate-400/80">Cargo / Rol</TableHead>
                                <TableHead className="py-4 uppercase text-xs font-black tracking-widest text-slate-500 dark:text-slate-400/80">Contacto</TableHead>
                                <TableHead className="w-[100px] py-4 text-right pr-6 uppercase text-xs font-black tracking-widest text-slate-500 dark:text-slate-400/80">Gestión</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i} className="animate-pulse border-slate-100 dark:border-slate-800/50">
                                        <TableCell colSpan={5} className="py-6 px-6">
                                            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : filteredPeople.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-20 bg-slate-50/20 dark:bg-slate-900/20">
                                        <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                                            <ShipWheel className="w-12 h-12 opacity-10" />
                                            <p className="text-lg font-medium">No se encontraron tripulantes.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredPeople.map((p) => (
                                    <TableRow key={p.id} className="group hover:bg-white dark:hover:bg-slate-800/50 border-slate-100 dark:border-slate-800 transition-all duration-200">
                                        <TableCell className="py-4 px-6">
                                            <span className="font-bold text-slate-900 dark:text-slate-100 uppercase text-xs">{p.first_name} {p.last_name}</span>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <Badge variant="outline" className="px-2 py-0.5 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-mono text-[10px]">
                                                <CreditCard className="w-3 h-3 mr-1 opacity-50" />
                                                {p.rut_display}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex items-center gap-2">
                                                <Badge className={cn(
                                                    "px-2 py-0 font-bold text-[9px] border rounded-full",
                                                    p.job_title === 'Capitán' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                                        p.job_title === 'Patrón' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                                            'bg-slate-100 text-slate-700 border-slate-200'
                                                )}>
                                                    <Anchor className="w-2.5 h-2.5 mr-1" />
                                                    {(p.job_title || 'Tripulante').toUpperCase()}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            {p.phone_e164 ? (
                                                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                                                    <Phone className="w-3 h-3 text-emerald-500" />
                                                    {p.phone_e164}
                                                </div>
                                            ) : <span className="text-[10px] text-slate-400">S/I</span>}
                                        </TableCell>
                                        <TableCell className="py-4 text-right pr-6">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" onClick={() => { setEditingPerson(p); setIsOpen(true); }} className="h-8 w-8 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-900/30">
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => p.id && setDeletingId(p.id)} className="h-8 w-8 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
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
            <Dialog open={isPromoteOpen} onOpenChange={setIsPromoteOpen}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl flex items-center gap-2">
                            <UserPlus className="w-5 h-5 text-orange-600" />
                            Buscar en Registro
                        </DialogTitle>
                        <DialogDescription className="font-normal text-slate-500">
                            Promueva un pasajero registrado al rol de tripulación.
                        </DialogDescription>
                    </DialogHeader>
                    <PromotePassengerForm onSuccess={() => { setIsPromoteOpen(false); fetchData(); }} />
                </DialogContent>
            </Dialog>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl flex items-center gap-2">
                            <Anchor className="w-5 h-5 text-orange-600" />
                            {editingPerson ? 'Editar Perfil de Tripulación' : 'Nuevo Registro de Tripulación'}
                        </DialogTitle>
                        <DialogDescription className="font-normal text-slate-500">
                            Complete los datos para la habilitación de personal en naves.
                        </DialogDescription>
                    </DialogHeader>
                    <CrewForm
                        initialData={editingPerson || undefined}
                        onSuccess={() => { setIsOpen(false); fetchData(); }}
                    />
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl text-red-600 font-normal">¿Quitar de la tripulación?</AlertDialogTitle>
                        <AlertDialogDescription className="text-base font-normal pt-2 text-slate-600">
                            Esta persona dejará de figurar en el listado de tripulación habilitada, pero **permanecerá en el sistema como pasajero habitual**.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="font-normal pt-4">
                        <AlertDialogCancel className="bg-slate-100 border-none">Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmRemoveCrew} className="bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/20">Quitar Habilitación</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}
