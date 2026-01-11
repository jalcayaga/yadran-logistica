'use client';

import { useEffect, useState } from 'react';
import { Person } from '@/utils/zod_schemas';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Search input
import { formatPhone } from '@/utils/formatters';
import { Plus, ArrowUpDown, Pencil, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import PersonForm from './PersonForm';

type SortKey = 'first_name' | 'last_name' | 'rut_display' | 'company';

export default function PeopleTable() {
    const [people, setPeople] = useState<Person[]>([]);
    const [filteredPeople, setFilteredPeople] = useState<Person[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [editingPerson, setEditingPerson] = useState<Person | null>(null);
    const [deletingPerson, setDeletingPerson] = useState<Person | null>(null);

    // Search & Sort State
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>(null);

    const fetchPeople = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/people');
            if (res.ok) {
                const data = await res.json();
                setPeople(data);
                setFilteredPeople(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPeople();
    }, []);

    // Filter & Sort Logic
    useEffect(() => {
        let result = [...people];

        // 1. Filter
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(p =>
                p.first_name.toLowerCase().includes(lowerTerm) ||
                p.last_name.toLowerCase().includes(lowerTerm) ||
                p.rut_display.toLowerCase().includes(lowerTerm) ||
                p.company.toLowerCase().includes(lowerTerm)
            );
        }

        // 2. Sort
        if (sortConfig) {
            result.sort((a, b) => {
                const valA = (a[sortConfig.key] || '').toString().toLowerCase();
                const valB = (b[sortConfig.key] || '').toString().toLowerCase();

                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        setFilteredPeople(result);
    }, [people, searchTerm, sortConfig]);

    const handleSort = (key: SortKey) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleDelete = async () => {
        if (!deletingPerson) return;

        try {
            const res = await fetch(`/api/people/${deletingPerson.id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                fetchPeople();
                setDeletingPerson(null);
            } else {
                alert('Error al eliminar');
            }
        } catch (error) {
            console.error(error);
            alert('Error al eliminar');
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6 gap-4">
                <div className="flex-1 max-w-sm">
                    <Input
                        placeholder="Buscar por nombre, RUT o empresa..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Nuevo Pasajero</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Agregar Pasajero</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                            <PersonForm onSuccess={() => { setIsOpen(false); fetchPeople(); }} />
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead onClick={() => handleSort('first_name')} className="cursor-pointer hover:bg-muted/50">
                                Nombres <ArrowUpDown className="inline ml-1 h-3 w-3" />
                            </TableHead>
                            <TableHead onClick={() => handleSort('last_name')} className="cursor-pointer hover:bg-muted/50">
                                Apellidos <ArrowUpDown className="inline ml-1 h-3 w-3" />
                            </TableHead>
                            <TableHead onClick={() => handleSort('rut_display')} className="cursor-pointer hover:bg-muted/50">
                                RUT <ArrowUpDown className="inline ml-1 h-3 w-3" />
                            </TableHead>
                            <TableHead onClick={() => handleSort('company')} className="cursor-pointer hover:bg-muted/50">
                                Empresa <ArrowUpDown className="inline ml-1 h-3 w-3" />
                            </TableHead>
                            <TableHead>Cargo</TableHead>
                            <TableHead>Teléfono</TableHead>
                            <TableHead className="w-[100px]">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8">Cargando...</TableCell>
                            </TableRow>
                        ) : filteredPeople.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    {searchTerm ? "No se encontraron resultados" : "No hay personas registradas."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredPeople.map((person) => (
                                <TableRow key={person.id}>
                                    <TableCell className="font-medium">{person.first_name}</TableCell>
                                    <TableCell className="font-medium">{person.last_name}</TableCell>
                                    <TableCell>{person.rut_display}</TableCell>
                                    <TableCell>{person.company}</TableCell>
                                    <TableCell>{person.job_title || '-'}</TableCell>
                                    import {formatRut, formatPhone} from '@/utils/formatters';

                                    // ...

                                    <TableCell className="font-medium">{person.last_name}</TableCell>
                                    <TableCell>{person.rut_display}</TableCell>
                                    <TableCell>{person.company}</TableCell>
                                    <TableCell>{person.job_title || '-'}</TableCell>
                                    <TableCell>{formatPhone(person.phone_e164)}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setEditingPerson(person)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setDeletingPerson(person)}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Edit Dialog */}
            <Dialog open={!!editingPerson} onOpenChange={(open) => !open && setEditingPerson(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Pasajero</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <PersonForm
                            initialData={editingPerson || undefined}
                            onSuccess={() => {
                                setEditingPerson(null);
                                fetchPeople();
                            }}
                        />
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deletingPerson} onOpenChange={(open) => !open && setDeletingPerson(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar pasajero?</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de eliminar a <strong>{deletingPerson?.first_name} {deletingPerson?.last_name}</strong>?
                            Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
