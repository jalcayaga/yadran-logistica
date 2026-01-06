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
import { Plus, ArrowUpDown, Pencil, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import VesselForm from './VesselForm';

type SortKey = 'name' | 'type';

export default function VesselTable() {
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
                v.type.toLowerCase().includes(lowerTerm)
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
                        <Button><Plus className="mr-2 h-4 w-4" /> Nueva Nave</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Agregar Nave</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                            <VesselForm onSuccess={() => { setIsOpen(false); fetchVessels(); }} />
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
                            <TableHead className="w-[100px]">Capacidad</TableHead>
                            <TableHead className="w-[100px]">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8">Cargando...</TableCell>
                            </TableRow>
                        ) : filteredVessels.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                    {searchTerm ? "No se encontraron resultados" : "No hay naves registradas."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredVessels.map((vessel) => (
                                <TableRow key={vessel.id}>
                                    <TableCell className="font-medium">{vessel.name}</TableCell>
                                    <TableCell><span className="capitalize">{vessel.type}</span></TableCell>
                                    <TableCell>{vessel.capacity || 0} pax</TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="sm" onClick={() => setEditingVessel(vessel)}><Pencil className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="sm" onClick={() => setDeletingVessel(vessel)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            <Dialog open={!!editingVessel} onOpenChange={(open: boolean) => !open && setEditingVessel(null)}>
                <DialogContent><DialogHeader><DialogTitle>Editar Nave</DialogTitle></DialogHeader>
                    <div className="py-4"><VesselForm initialData={editingVessel || undefined} onSuccess={() => { setEditingVessel(null); fetchVessels(); }} /></div>
                </DialogContent>
            </Dialog>
            <AlertDialog open={!!deletingVessel} onOpenChange={(open: boolean) => !open && setDeletingVessel(null)}>
                <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Eliminar nave?</AlertDialogTitle>
                    <AlertDialogDescription>¿Estás seguro de eliminar <strong>{deletingVessel?.name}</strong>?</AlertDialogDescription>
                </AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Eliminar</AlertDialogAction>
                    </AlertDialogFooter></AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
