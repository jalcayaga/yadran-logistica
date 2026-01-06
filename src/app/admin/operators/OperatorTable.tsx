'use client';

import { useEffect, useState } from 'react';
import { Operator } from '@/utils/zod_schemas';
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
import { Plus, ArrowUpDown, Pencil, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import OperatorForm from './OperatorForm';

type SortKey = 'name' | 'type';

export default function OperatorTable() {
    const [operators, setOperators] = useState<Operator[]>([]);
    const [filteredOperators, setFilteredOperators] = useState<Operator[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [editingOperator, setEditingOperator] = useState<Operator | null>(null);
    const [deletingOperator, setDeletingOperator] = useState<Operator | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>(null);

    const fetchOperators = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/operators');
            if (res.ok) {
                const data = await res.json();
                setOperators(data);
                setFilteredOperators(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOperators();
    }, []);

    useEffect(() => {
        let result = [...operators];

        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(o =>
                o.name.toLowerCase().includes(lowerTerm) ||
                o.type.toLowerCase().includes(lowerTerm)
            );
        }

        if (sortConfig) {
            result.sort((a, b) => {
                const valA = (a[sortConfig.key] || '').toString().toLowerCase();
                const valB = (b[sortConfig.key] || '').toString().toLowerCase();

                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        setFilteredOperators(result);
    }, [operators, searchTerm, sortConfig]);

    const handleSort = (key: SortKey) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleDelete = async () => {
        if (!deletingOperator) return;
        try {
            const res = await fetch(`/api/operators/${deletingOperator.id}`, { method: 'DELETE' });
            if (res.ok) { fetchOperators(); setDeletingOperator(null); }
            else { alert('Error al eliminar'); }
        } catch (error) { console.error(error); alert('Error al eliminar'); }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6 gap-4">
                <div className="flex-1 max-w-sm">
                    <Input
                        placeholder="Buscar por nombre o tipo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Nuevo Operador</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Agregar Operador</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                            <OperatorForm onSuccess={() => { setIsOpen(false); fetchOperators(); }} />
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead onClick={() => handleSort('name')} className="cursor-pointer hover:bg-muted/50">
                                Nombre <ArrowUpDown className="inline ml-1 h-3 w-3" />
                            </TableHead>
                            <TableHead onClick={() => handleSort('type')} className="cursor-pointer hover:bg-muted/50">
                                Tipo <ArrowUpDown className="inline ml-1 h-3 w-3" />
                            </TableHead>
                            <TableHead className="w-[100px]">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-8">Cargando...</TableCell>
                            </TableRow>
                        ) : filteredOperators.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                    {searchTerm ? "No se encontraron resultados" : "No hay operadores registrados."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredOperators.map((op) => (
                                <TableRow key={op.id}>
                                    <TableCell className="font-medium">{op.name}</TableCell>
                                    <TableCell><span className="capitalize">{op.type}</span></TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="sm" onClick={() => setEditingOperator(op)}><Pencil className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="sm" onClick={() => setDeletingOperator(op)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            <Dialog open={!!editingOperator} onOpenChange={(open: boolean) => !open && setEditingOperator(null)}>
                <DialogContent><DialogHeader><DialogTitle>Editar Operador</DialogTitle></DialogHeader>
                    <div className="py-4"><OperatorForm initialData={editingOperator || undefined} onSuccess={() => { setEditingOperator(null); fetchOperators(); }} /></div>
                </DialogContent>
            </Dialog>
            <AlertDialog open={!!deletingOperator} onOpenChange={(open: boolean) => !open && setDeletingOperator(null)}>
                <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Eliminar operador?</AlertDialogTitle>
                    <AlertDialogDescription>¿Estás seguro de eliminar <strong>{deletingOperator?.name}</strong>?</AlertDialogDescription>
                </AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Eliminar</AlertDialogAction>
                    </AlertDialogFooter></AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
