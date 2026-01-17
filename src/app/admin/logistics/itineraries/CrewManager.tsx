'use client';

import { useState, useEffect } from "react";
import { Itinerary, Person } from '@/utils/zod_schemas';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, UserPlus, FileText } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CrewManagerProps {
    itinerary: any; // Using any for now to avoid strict typing issues with extended itinerary
    onClose: () => void;
}

interface CrewAssignment {
    id: string; // crew_assignments id
    person_id: string;
    role: 'captain' | 'substitute' | 'crew_member';
    person?: Person;
}

export default function CrewManager({ itinerary, onClose }: CrewManagerProps) {
    const supabase = createClient();
    const { toast } = useToast();
    const [crew, setCrew] = useState<CrewAssignment[]>([]);
    const [people, setPeople] = useState<Person[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPerson, setSelectedPerson] = useState<string>('');
    const [selectedRole, setSelectedRole] = useState<'captain' | 'substitute' | 'crew_member'>('captain');
    const [saving, setSaving] = useState(false);
    const [openCombobox, setOpenCombobox] = useState(false);

    const vesselCapacity = itinerary.vessel?.capacity || 0;
    // Simple heuristic: If capacity > 12, suggest Substitute might be needed.
    const isLargeVessel = vesselCapacity > 12;

    const recommendedRoles = isLargeVessel
        ? ['captain', 'substitute']
        : ['captain', 'crew_member'];

    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        title: string;
        description: string;
        label: string;
        action: () => void;
    }>({ open: false, title: '', description: '', label: 'Confirmar', action: () => { } });

    useEffect(() => {
        fetchData();
    }, [itinerary.id]);

    const fetchData = async () => {
        setLoading(true);
        // Fetch Crew
        const { data: crewData, error: crewError } = await supabase
            .from('crew_assignments')
            .select('*, person:people(*)')
            .eq('itinerary_id', itinerary.id);

        if (crewError) console.error('Error fetching crew:', crewError);
        else setCrew(crewData || []);

        // Fetch People
        const { data: peopleData, error: peopleError } = await supabase
            .from('people')
            .select('*')
            .eq('active', true)
            .eq('is_crew', true) // Only show crew in selector
            .order('first_name');

        if (peopleError) console.error('Error fetching people:', peopleError);
        else setPeople(peopleData || []);

        setLoading(false);
    };

    const executeAddCrew = async () => {
        setSaving(true);
        const { data, error } = await supabase
            .from('crew_assignments')
            .insert({
                itinerary_id: itinerary.id,
                person_id: selectedPerson,
                role: selectedRole
            })
            .select('*, person:people(*)')
            .single();

        if (error) {
            toast({ variant: "destructive", title: "Error", description: 'Error al asignar: ' + error.message });
        } else {
            setCrew([...crew, data]);
            setSelectedPerson('');
            toast({ title: "Asignado", description: "Tripulante asignado." });
        }
        setSaving(false);
    }

    const handleAddCrew = async () => {
        if (!selectedPerson) return;

        if (crew.find(c => c.person_id === selectedPerson)) {
            toast({ variant: "destructive", title: "Error", description: "Esta persona ya está asignada." });
            return;
        }

        if (selectedRole === 'captain' && crew.some(c => c.role === 'captain')) {
            setConfirmDialog({
                open: true,
                title: 'Capitán ya asignado',
                description: 'Ya hay un capitán asignado en esta nave. ¿Deseas agregar otro?',
                label: 'Agregar otro',
                action: () => executeAddCrew()
            });
            return;
        }

        await executeAddCrew();
    };

    const executeRemoveCrew = async (id: string) => {
        setSaving(true);
        const { error } = await supabase
            .from('crew_assignments')
            .delete()
            .eq('id', id);

        if (error) {
            toast({ variant: "destructive", title: "Error", description: 'Error al eliminar: ' + error.message });
        } else {
            setCrew(crew.filter(c => c.id !== id));
            toast({ title: "Eliminado", description: "Tripulante eliminado." });
        }
        setSaving(false);
    }

    const handleRemoveCrew = async (id: string) => {
        setConfirmDialog({
            open: true,
            title: 'Confirmar eliminación',
            description: '¿Estás seguro de quitar a este tripulante del itinerario?',
            label: 'Eliminar',
            action: () => executeRemoveCrew(id)
        });
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'captain': return 'Capitán';
            case 'substitute': return 'Sustituto (Patrón)';
            case 'crew_member': return 'Tripulante';
            default: return role;
        }
    };
    const getMissingRoles = () => {
        const currentRoles = crew.map(c => c.role);
        return recommendedRoles.filter(r => !currentRoles.includes(r as any));
    };

    const missing = getMissingRoles();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
                <div>
                    <h3 className="text-lg font-medium">Tripulación: {itinerary.vessel?.name}</h3>
                    <p className="text-sm text-muted-foreground">
                        Capacidad: {vesselCapacity} pax. {isLargeVessel ? '(Sugerencia: Nave mayor, considerar Capitán + Sustituto)' : '(Sugerencia: Nave menor)'}
                    </p>
                </div>
            </div>

            {/* Warning for missing roles */}
            {missing.length > 0 && (
                <div className="bg-amber-500/10 border-l-4 border-amber-500 p-4 rounded-r-md">
                    <div className="flex">
                        <div className="ml-3">
                            <p className="text-sm text-amber-600 dark:text-amber-500">
                                <span className="font-bold">Sugerencia:</span> Podrían faltar roles recomendados: {missing.map(getRoleLabel).join(', ')}.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Crew List */}
            <div className="border rounded-md overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Rol</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>RUT</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {crew.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">No hay tripulación asignada</TableCell>
                            </TableRow>
                        ) : (
                            crew.map((member) => (
                                <TableRow key={member.id}>
                                    <TableCell>
                                        <Badge variant={member.role === 'captain' ? 'default' : 'secondary'}>
                                            {getRoleLabel(member.role)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{member.person ? `${member.person.first_name} ${member.person.last_name}` : ''}</TableCell>
                                    <TableCell>{member.person?.rut_display}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => handleRemoveCrew(member.id)} disabled={saving}>
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Assignment Form */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-muted/30 p-4 rounded-md border">
                <div className="space-y-2">
                    <Label>Rol</Label>
                    <Select value={selectedRole} onValueChange={(val: any) => setSelectedRole(val)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="captain">Capitán</SelectItem>
                            <SelectItem value="substitute">Sustituto</SelectItem>
                            <SelectItem value="crew_member">Tripulante</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2 flex flex-col">
                    <Label>Persona</Label>
                    <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openCombobox}
                                className="w-full justify-between"
                            >
                                <span className="truncate">
                                    {selectedPerson
                                        ? people.find((p) => p.id === selectedPerson)
                                            ? `${people.find((p) => p.id === selectedPerson)?.first_name} ${people.find((p) => p.id === selectedPerson)?.last_name}`
                                            : "Seleccionar persona..."
                                        : "Seleccionar persona..."}
                                </span>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0" align="start">
                            <Command>
                                <CommandInput placeholder="Buscar persona..." />
                                <CommandList>
                                    <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                                    <CommandGroup>
                                        {people.map((p) => (
                                            <CommandItem
                                                key={p.id}
                                                value={`${p.first_name} ${p.last_name} ${p.rut_display}`}
                                                onSelect={(currentValue) => {
                                                    setSelectedPerson(p.id === selectedPerson ? "" : p.id || "")
                                                    setOpenCombobox(false)
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        selectedPerson === p.id ? "opacity-100" : "opacity-0"
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
                <Button onClick={handleAddCrew} disabled={!selectedPerson || saving}>
                    <UserPlus className="w-4 h-4 mr-2" /> Asignar
                </Button>
            </div>

            <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmDialog.description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => {
                            confirmDialog.action();
                            setConfirmDialog(prev => ({ ...prev, open: false }));
                        }}>
                            {confirmDialog.label}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
