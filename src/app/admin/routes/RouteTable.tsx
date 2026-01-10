'use client';

import { useEffect, useState } from 'react';
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
import { Plus, ArrowRight, Pencil, Trash2, ArrowUpDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import RouteForm from './RouteForm';

import { type Route } from '@/utils/zod_schemas';

type SortKey = 'mode' | 'origin' | 'destination' | 'operator' | 'vessel';

// Extended type for display
interface RouteWithRelations extends Route {
    origin: { name: string };
    destination: { name: string };
    operator?: { name: string };
    vessel?: { name: string };
}

export default function RouteTable() {
    const [routes, setRoutes] = useState<RouteWithRelations[]>([]); // Keep original routes state
    const [filteredRoutes, setFilteredRoutes] = useState<RouteWithRelations[]>([]); // Add filteredRoutes state
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [editingRoute, setEditingRoute] = useState<RouteWithRelations | null>(null);
    const [deletingRoute, setDeletingRoute] = useState<RouteWithRelations | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>(null);

    const fetchRoutes = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/routes');
            if (res.ok) {
                const data = await res.json();
                setRoutes(data); // Update the main routes state
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoutes();
    }, []);

    // New useEffect for filtering
    useEffect(() => {
        const result = routes.filter(route =>
            route.mode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            route.origin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            route.destination.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (route.operator?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (route.vessel?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (sortConfig) {
            result.sort((a, b) => {
                let valA = '';
                let valB = '';

                switch (sortConfig.key) {
                    case 'mode': valA = a.mode; valB = b.mode; break;
                    case 'origin': valA = a.origin.name; valB = b.origin.name; break;
                    case 'destination': valA = a.destination.name; valB = b.destination.name; break;
                    case 'operator': valA = a.operator?.name || ''; valB = b.operator?.name || ''; break;
                    case 'vessel': valA = a.vessel?.name || ''; valB = b.vessel?.name || ''; break;
                }

                valA = valA.toLowerCase();
                valB = valB.toLowerCase();

                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        setFilteredRoutes(result);
    }, [routes, searchTerm, sortConfig]);

    const handleSort = (key: SortKey) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleDelete = async () => {
        if (!deletingRoute) return;
        try {
            const res = await fetch(`/api/routes/${deletingRoute.id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchRoutes();
                setDeletingRoute(null);
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
                <div className="flex-1">
                    <h2 className="text-xl font-semibold">Rutas Definidas ({filteredRoutes.length})</h2>
                    <p className="text-sm text-muted-foreground">Configura los tramos frecuentes para agilizar la creación de itinerarios.</p>
                </div>
                <div className="w-[300px]">
                    <Input
                        placeholder="Buscar ruta, operador o nave..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Nueva Ruta</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Agregar Nueva Ruta</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                            <RouteForm onSuccess={() => { setIsOpen(false); fetchRoutes(); }} />
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead onClick={() => handleSort('mode')} className="cursor-pointer hover:bg-muted/50">
                                Modo <ArrowUpDown className="inline ml-1 h-3 w-3" />
                            </TableHead>
                            <TableHead onClick={() => handleSort('origin')} className="cursor-pointer hover:bg-muted/50">
                                Origen <ArrowUpDown className="inline ml-1 h-3 w-3" />
                            </TableHead>
                            <TableHead></TableHead>
                            <TableHead onClick={() => handleSort('destination')} className="cursor-pointer hover:bg-muted/50">
                                Destino <ArrowUpDown className="inline ml-1 h-3 w-3" />
                            </TableHead>
                            <TableHead onClick={() => handleSort('operator')} className="cursor-pointer hover:bg-muted/50">
                                Op. Default <ArrowUpDown className="inline ml-1 h-3 w-3" />
                            </TableHead>
                            <TableHead onClick={() => handleSort('vessel')} className="cursor-pointer hover:bg-muted/50">
                                Nave Default <ArrowUpDown className="inline ml-1 h-3 w-3" />
                            </TableHead>
                            <TableHead className="w-[100px]">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8">Cargando...</TableCell>
                            </TableRow>
                        ) : routes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    No hay rutas configuradas.
                                </TableCell>
                            </TableRow>
                        ) : (
                            routes.map((route) => (
                                <TableRow key={route.id}>
                                    <TableCell><span className="capitalize font-medium">{route.mode}</span></TableCell>
                                    <TableCell>{route.origin?.name || '??'}</TableCell>
                                    <TableCell><ArrowRight className="h-4 w-4 text-muted-foreground" /></TableCell>
                                    <TableCell>{route.destination?.name || '??'}</TableCell>
                                    <TableCell>{route.operator?.name || <span className="text-muted-foreground italic text-xs">Sin asignar</span>}</TableCell>
                                    <TableCell>{route.vessel?.name || <span className="text-muted-foreground italic text-xs">Sin asignar</span>}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="sm" onClick={() => setEditingRoute(route)}><Pencil className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="sm" onClick={() => setDeletingRoute(route)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            <Dialog open={!!editingRoute} onOpenChange={(open: boolean) => !open && setEditingRoute(null)}>
                <DialogContent><DialogHeader><DialogTitle>Editar Ruta</DialogTitle></DialogHeader>
                    <div className="py-4"><RouteForm initialData={editingRoute || undefined} onSuccess={() => { setEditingRoute(null); fetchRoutes(); }} /></div>
                </DialogContent>
            </Dialog>
            <AlertDialog open={!!deletingRoute} onOpenChange={(open: boolean) => !open && setDeletingRoute(null)}>
                <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Eliminar ruta?</AlertDialogTitle>
                    <AlertDialogDescription>¿Estás seguro de eliminar la ruta <strong>{deletingRoute?.origin?.name} → {deletingRoute?.destination?.name}</strong>?</AlertDialogDescription>
                </AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Eliminar</AlertDialogAction>
                    </AlertDialogFooter></AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
