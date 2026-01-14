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
import { Plus, Pencil, Trash2 } from 'lucide-react';
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
            if (error) {
                alert('Error: ' + error.message);
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

    return (
        <div>
            <div className="flex justify-end mb-4">
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
        </div>
    );
}
