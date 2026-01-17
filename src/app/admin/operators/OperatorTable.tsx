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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    Plus,
    ArrowUpDown,
    Pencil,
    Trash2,
    Search,
    Building2,
    Ship,
    Truck,
    Filter,
    HardHat
} from 'lucide-react';
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

    const getTypeColor = (type: string) => {
        switch (type.toLowerCase()) {
            case 'maritime': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400';
            case 'terrestrial': return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400';
            case 'external': return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400';
            default: return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case 'maritime': return <Ship className="w-3.5 h-3.5" />;
            case 'terrestrial': return <Truck className="w-3.5 h-3.5" />;
            case 'external': return <Building2 className="w-3.5 h-3.5" />;
            default: return <HardHat className="w-3.5 h-3.5" />;
        }
    };

    return (
        <Card className="border-none shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div className="relative w-full max-w-md group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-orange-500 transition-colors" />
                        <Input
                            placeholder="Buscar operador o tipo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 focus-visible:ring-orange-500/20 focus-visible:border-orange-500 transition-all font-normal"
                        />
                    </div>

                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/20 transition-all active:scale-95 w-full md:w-auto font-normal">
                                <Plus className="mr-2 h-4 w-4" /> Nuevo Operador
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle className="text-xl flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-orange-500" />
                                    Agregar Operador
                                </DialogTitle>
                            </DialogHeader>
                            <div className="py-4 font-normal">
                                <OperatorForm onSuccess={() => { setIsOpen(false); fetchOperators(); }} />
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white/30 dark:bg-slate-900/30">
                    <Table>
                        <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                            <TableRow className="hover:bg-transparent border-slate-200 dark:border-slate-800">
                                <TableHead onClick={() => handleSort('name')} className="cursor-pointer hover:text-orange-600 transition-colors py-4 px-6">
                                    <div className="flex items-center gap-2 uppercase text-[10px] font-bold tracking-wider text-slate-500">
                                        Nombre <ArrowUpDown className="h-3 w-3 opacity-50" />
                                    </div>
                                </TableHead>
                                <TableHead onClick={() => handleSort('type')} className="cursor-pointer hover:text-orange-600 transition-colors py-4">
                                    <div className="flex items-center gap-2 uppercase text-[10px] font-bold tracking-wider text-slate-500">
                                        Tipo <ArrowUpDown className="h-3 w-3 opacity-50" />
                                    </div>
                                </TableHead>
                                <TableHead className="w-[100px] py-4 text-right pr-6 uppercase text-[10px] font-bold tracking-wider text-slate-500">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i} className="animate-pulse border-slate-100 dark:border-slate-800">
                                        <TableCell colSpan={3} className="py-6 px-6">
                                            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : filteredOperators.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-20 bg-slate-50/20 dark:bg-slate-900/20">
                                        <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                                            <Building2 className="w-12 h-12 opacity-10" />
                                            <p className="text-lg font-medium">
                                                {searchTerm ? "No se encontraron resultados" : "No hay operadores registrados."}
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredOperators.map((op) => (
                                    <TableRow key={op.id} className="group hover:bg-white dark:hover:bg-slate-800/50 border-slate-100 dark:border-slate-800 transition-all duration-200">
                                        <TableCell className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform">
                                                    <Building2 className="w-4 h-4" />
                                                </div>
                                                <span className="font-semibold text-slate-700 dark:text-slate-200">
                                                    {op.name}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <Badge variant="outline" className={`px-2 py-0.5 font-medium border capitalize flex items-center gap-1.5 w-fit ${getTypeColor(op.type)}`}>
                                                {getTypeIcon(op.type)}
                                                {op.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-4 text-right pr-6">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" onClick={() => setEditingOperator(op)} className="h-8 w-8 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-900/30">
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => setDeletingOperator(op)} className="h-8 w-8 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30">
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

                <div className="mt-4 text-[10px] text-muted-foreground flex justify-between items-center px-2 font-normal">
                    <p>Total: {filteredOperators.length} operadores</p>
                    <p className="flex items-center gap-1">
                        <Filter className="w-3 h-3" />
                        Vista general de flota externa
                    </p>
                </div>
            </CardContent>

            {/* Dialogs */}
            <Dialog open={!!editingOperator} onOpenChange={(open: boolean) => !open && setEditingOperator(null)}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl flex items-center gap-2">
                            <Pencil className="w-5 h-5 text-orange-500" />
                            Editar Operador
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4 font-normal">
                        <OperatorForm initialData={editingOperator || undefined} onSuccess={() => { setEditingOperator(null); fetchOperators(); }} />
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deletingOperator} onOpenChange={(open: boolean) => !open && setDeletingOperator(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl text-red-600 flex items-center gap-2 font-normal">
                            <Trash2 className="w-5 h-5" />
                            ¿Eliminar operador?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-base pt-2 font-normal">
                            ¿Estás seguro de eliminar el operador <strong>{deletingOperator?.name}</strong>? Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 pt-4 font-normal">
                        <AlertDialogCancel className="bg-slate-100 border-none">Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/20">
                            Eliminar Operador
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}
