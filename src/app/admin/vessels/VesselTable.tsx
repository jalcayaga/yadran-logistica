'use client';

import { useEffect, useState } from 'react';
import { Vessel } from '@/utils/zod_schemas';
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
    Ship,
    Users,
    Filter,
    ShipWheel
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import VesselForm from './VesselForm';

type SortKey = 'name' | 'registration_number' | 'type' | 'capacity';

export default function VesselTable({ hideHeader = false }: { hideHeader?: boolean }) {
    const [vessels, setVessels] = useState<Vessel[]>([]);
    const [filteredVessels, setFilteredVessels] = useState<Vessel[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [editingVessel, setEditingVessel] = useState<Vessel | null>(null);
    const [deletingVessel, setDeletingVessel] = useState<Vessel | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>(null);

    const fetchVessels = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/vessels');
            if (res.ok) {
                const data = await res.json();
                setVessels(data);
                setFilteredVessels(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVessels();
    }, []);

    useEffect(() => {
        let result = [...vessels];

        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(v =>
                v.name.toLowerCase().includes(lowerTerm) ||
                v.type.toLowerCase().includes(lowerTerm) ||
                (v.registration_number && v.registration_number.toLowerCase().includes(lowerTerm))
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

        setFilteredVessels(result);
    }, [vessels, searchTerm, sortConfig]);

    const handleSort = (key: SortKey) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleDelete = async () => {
        if (!deletingVessel) return;
        try {
            const res = await fetch(`/api/vessels/${deletingVessel.id}`, { method: 'DELETE' });
            if (res.ok) { fetchVessels(); setDeletingVessel(null); }
            else { alert('Error al eliminar'); }
        } catch (error) { console.error(error); alert('Error al eliminar'); }
    };

    const getTypeColor = (type: string) => {
        switch (type.toLowerCase()) {
            case 'lancha': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400';
            case 'barcaza': return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400';
            default: return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    return (
        <Card className="border-none shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-0">
                <div className={`flex flex-col sm:flex-row ${hideHeader ? 'justify-end' : 'justify-between'} items-start sm:items-center p-6 gap-4 border-b border-slate-100 dark:border-slate-800/50`}>
                    {!hideHeader && (
                        <div className="flex flex-col gap-0.5">
                            <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2.5 text-slate-900 dark:text-white">
                                <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <Ship className="w-5 h-5 text-blue-600" />
                                </div>
                                Listado de Flota
                            </h2>
                            <p className="text-[11px] text-muted-foreground font-medium pl-10">
                                Registro oficial de naves y sus capacidades
                            </p>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
                            <Input
                                placeholder="Buscar nave o matrícula..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all font-normal"
                            />
                        </div>
                        <Dialog open={isOpen} onOpenChange={setIsOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all active:scale-95 font-normal w-full sm:w-auto">
                                    <Plus className="mr-2 h-4 w-4" /> Nueva Nave
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[600px]">
                                <DialogHeader>
                                    <DialogTitle className="text-xl flex items-center gap-2">
                                        <Ship className="w-5 h-5 text-blue-500" />
                                        Registrar Nueva Nave
                                    </DialogTitle>
                                    <DialogDescription className="font-normal">
                                        Ingrese los datos técnicos y de capacidad de la embarcación.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="py-2 font-normal">
                                    <VesselForm onSuccess={() => { setIsOpen(false); fetchVessels(); }} />
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <div className="overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                            <TableRow className="hover:bg-transparent border-slate-200 dark:border-slate-800/50">
                                <TableHead onClick={() => handleSort('name')} className="cursor-pointer hover:text-blue-600 transition-colors py-4 px-6">
                                    <div className="flex items-center gap-2 uppercase text-xs font-black tracking-widest text-slate-500 dark:text-slate-400/80">
                                        Nombre <ArrowUpDown className="h-3 w-3 opacity-50" />
                                    </div>
                                </TableHead>
                                <TableHead className="py-4 uppercase text-xs font-black tracking-widest text-slate-500 dark:text-slate-400/80">Matrícula</TableHead>
                                <TableHead onClick={() => handleSort('type')} className="cursor-pointer hover:text-blue-600 transition-colors py-4">
                                    <div className="flex items-center gap-2 uppercase text-xs font-black tracking-widest text-slate-500 dark:text-slate-400/80">
                                        Tipo <ArrowUpDown className="h-3 w-3 opacity-50" />
                                    </div>
                                </TableHead>
                                <TableHead onClick={() => handleSort('capacity')} className="cursor-pointer hover:text-blue-600 transition-colors py-4">
                                    <div className="flex items-center gap-2 uppercase text-xs font-black tracking-widest text-slate-500 dark:text-slate-400/80">
                                        Capacidad <ArrowUpDown className="h-3 w-3 opacity-50" />
                                    </div>
                                </TableHead>
                                <TableHead className="w-[100px] py-4 text-right pr-6 uppercase text-xs font-black tracking-widest text-slate-500 dark:text-slate-400/80">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i} className="animate-pulse border-slate-100 dark:border-slate-800">
                                        <TableCell colSpan={5} className="py-6 px-6">
                                            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : filteredVessels.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-20 bg-slate-50/20 dark:bg-slate-900/20">
                                        <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                                            <ShipWheel className="w-12 h-12 opacity-10" />
                                            <p className="text-lg font-medium">
                                                {searchTerm ? "No se encontraron resultados" : "No hay naves registradas."}
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredVessels.map((vessel) => (
                                    <TableRow
                                        key={vessel.id}
                                        className="group hover:bg-white dark:hover:bg-slate-800/50 border-slate-100 dark:border-slate-800 transition-all duration-200"
                                    >
                                        <TableCell className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                                    <Ship className="w-4 h-4" />
                                                </div>
                                                <span className="font-semibold text-slate-700 dark:text-slate-200">
                                                    {vessel.name}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <Badge variant="outline" className={`px-2 py-0.5 font-medium border capitalize ${getTypeColor(vessel.type)}`}>
                                                {vessel.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-4 text-center">
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                                <Users className="w-3 h-3" />
                                                {vessel.capacity || 0}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-xs border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 shadow-inner">
                                                    {vessel.registration_number || 'S/I'}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 text-right pr-6">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setEditingVessel(vessel)}
                                                    className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setDeletingVessel(vessel)}
                                                    className="h-8 w-8 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
                                                >
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

                <div className="mt-4 text-[10px] text-muted-foreground flex justify-between items-center px-2">
                    <p>Total: {filteredVessels.length} naves</p>
                    <p className="flex items-center gap-1">
                        <Filter className="w-3 h-3" />
                        Lista filtrada por búsqueda y tipo
                    </p>
                </div>
            </CardContent>

            {/* Dialogs */}
            <Dialog open={!!editingVessel} onOpenChange={(open: boolean) => !open && setEditingVessel(null)}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl flex items-center gap-2">
                            <Pencil className="w-5 h-5 text-blue-500" />
                            Editar Nave
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <VesselForm initialData={editingVessel || undefined} onSuccess={() => { setEditingVessel(null); fetchVessels(); }} />
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deletingVessel} onOpenChange={(open: boolean) => !open && setDeletingVessel(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl text-red-600 flex items-center gap-2">
                            <Trash2 className="w-5 h-5" />
                            ¿Eliminar nave?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-base pt-2">
                            ¿Estás seguro de eliminar la nave <strong>{deletingVessel?.name}</strong>? Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 pt-4">
                        <AlertDialogCancel className="bg-slate-100 border-none">Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/20">
                            Eliminar Nave
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}
