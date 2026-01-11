'use client';

import { useEffect, useState } from 'react';
import { Location } from '@/utils/zod_schemas';
import { translateLocationType } from '@/utils/formatters';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import LocationForm from './LocationForm';

type SortKey = 'name' | 'code' | 'type';

export default function LocationTable() {
    const [locations, setLocations] = useState<Location[]>([]);
    const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [editingLocation, setEditingLocation] = useState<Location | null>(null);
    const [deletingLocation, setDeletingLocation] = useState<Location | null>(null);
    const [activeTab, setActiveTab] = useState('centers');

    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>(null);

    const fetchLocations = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/locations');
            if (res.ok) {
                const data = await res.json();
                setLocations(data);
                // Initial filter will be handled by useEffect
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLocations();
    }, []);

    useEffect(() => {
        let result = [...locations];

        // 1. Filter by Tab
        if (activeTab === 'centers') {
            result = result.filter(l => ['center', 'base'].includes(l.type));
        } else if (activeTab === 'ports') {
            result = result.filter(l => ['port', 'city', 'other'].includes(l.type));
        }

        // 2. Filter by Search
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(l =>
                l.name.toLowerCase().includes(lowerTerm) ||
                l.code.toLowerCase().includes(lowerTerm) ||
                l.type.toLowerCase().includes(lowerTerm)
            );
        }

        // 3. Sort
        if (sortConfig) {
            result.sort((a, b) => {
                const valA = (a[sortConfig.key] || '').toString().toLowerCase();
                const valB = (b[sortConfig.key] || '').toString().toLowerCase();

                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        setFilteredLocations(result);
    }, [locations, searchTerm, sortConfig, activeTab]);

    const handleSort = (key: SortKey) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleDelete = async () => {
        if (!deletingLocation) return;
        try {
            const res = await fetch(`/api/locations/${deletingLocation.id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchLocations();
                setDeletingLocation(null);
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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <TabsList>
                        <TabsTrigger value="centers">Centros</TabsTrigger>
                        <TabsTrigger value="ports">Puertos y Muelles</TabsTrigger>
                        <TabsTrigger value="all">Ver Todos</TabsTrigger>
                    </TabsList>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="relative w-full md:w-64">
                            <Input
                                placeholder="Buscar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <Dialog open={isOpen} onOpenChange={setIsOpen}>
                            <DialogTrigger asChild>
                                <Button><Plus className="mr-2 h-4 w-4" /> Nuevo</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Agregar Ubicación</DialogTitle>
                                </DialogHeader>
                                <div className="py-4">
                                    <LocationForm onSuccess={() => { setIsOpen(false); fetchLocations(); }} />
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead onClick={() => handleSort('code')} className="cursor-pointer hover:bg-muted/50">
                                    Código <ArrowUpDown className="inline ml-1 h-3 w-3" />
                                </TableHead>
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
                                    <TableCell colSpan={4} className="text-center py-8">Cargando...</TableCell>
                                </TableRow>
                            ) : filteredLocations.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                        {searchTerm ? "No se encontraron resultados" : "No hay ubicaciones en esta categoría."}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredLocations.map((loc) => (
                                    <TableRow key={loc.id}>
                                        <TableCell className="font-mono text-xs">{loc.code}</TableCell>
                                        <TableCell className="font-medium">{loc.name}</TableCell>
                                        <TableCell><span className="capitalize">{translateLocationType(loc.type)}</span></TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="sm" onClick={() => setEditingLocation(loc)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => setDeletingLocation(loc)}>
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
            </Tabs>

            <Dialog open={!!editingLocation} onOpenChange={(open: boolean) => !open && setEditingLocation(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Editar Ubicación</DialogTitle></DialogHeader>
                    <div className="py-4">
                        <LocationForm initialData={editingLocation || undefined} onSuccess={() => { setEditingLocation(null); fetchLocations(); }} />
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deletingLocation} onOpenChange={(open: boolean) => !open && setDeletingLocation(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar ubicación?</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de eliminar <strong>{deletingLocation?.name}</strong>? Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
