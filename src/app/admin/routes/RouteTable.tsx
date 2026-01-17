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
import {
    Plus,
    ArrowRight,
    Pencil,
    Trash2,
    ArrowUpDown,
    Search,
    Route as RouteIcon,
    MapPin,
    Ship,
    Building2,
    Filter,
    Navigation
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import RouteForm from './RouteForm';
import { type Route } from '@/utils/zod_schemas';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type SortKey = 'mode' | 'origin' | 'destination' | 'operator' | 'vessel';

interface RouteWithRelations extends Route {
    origin: { name: string };
    destination: { name: string };
    operator?: { name: string };
    vessel?: { name: string };
}

export default function RouteTable() {
    const [routes, setRoutes] = useState<RouteWithRelations[]>([]);
    const [filteredRoutes, setFilteredRoutes] = useState<RouteWithRelations[]>([]);
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
                setRoutes(data);
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
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Card className="border-none shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 gap-4 border-b border-slate-100 dark:border-slate-800/50">
                    <div className="flex flex-col gap-0.5">
                        <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2.5 text-slate-900 dark:text-white">
                            <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <RouteIcon className="w-5 h-5 text-blue-600" />
                            </div>
                            Catálogo de Tramos
                        </h2>
                        <p className="text-[11px] text-muted-foreground font-medium pl-10">
                            Rutas frecuentes para optimización de logística
                        </p>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
                            <Input
                                placeholder="Buscar ruta..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all font-normal"
                            />
                        </div>
                        <Dialog open={isOpen} onOpenChange={setIsOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-all font-normal">
                                    <Plus className="mr-2 h-4 w-4" /> Nueva Ruta
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                                <DialogHeader>
                                    <DialogTitle className="text-xl flex items-center gap-2">
                                        <RouteIcon className="w-5 h-5 text-blue-500" />
                                        Configurar Nuevo Tramo
                                    </DialogTitle>
                                    <DialogDescription className="font-normal text-slate-500 text-sm">
                                        Defina los puntos de origen, destino y recursos por defecto.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="py-4">
                                    <RouteForm onSuccess={() => { setIsOpen(false); fetchRoutes(); }} />
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <div className="overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                            <TableRow className="hover:bg-transparent border-slate-200 dark:border-slate-800/50">
                                <TableHead onClick={() => handleSort('mode')} className="cursor-pointer hover:text-blue-600 transition-colors py-4 px-6">
                                    <div className="flex items-center gap-2 uppercase text-xs font-black tracking-widest text-slate-500 dark:text-slate-400/80">
                                        Modo <ArrowUpDown className="h-3 w-3 opacity-50" />
                                    </div>
                                </TableHead>
                                <TableHead onClick={() => handleSort('origin')} className="cursor-pointer hover:text-blue-600 transition-colors py-4">
                                    <div className="flex items-center gap-2 uppercase text-xs font-black tracking-widest text-slate-500 dark:text-slate-400/80">
                                        Origen <ArrowUpDown className="h-3 w-3 opacity-50" />
                                    </div>
                                </TableHead>
                                <TableHead className="w-[40px]"></TableHead>
                                <TableHead onClick={() => handleSort('destination')} className="cursor-pointer hover:text-blue-600 transition-colors py-4">
                                    <div className="flex items-center gap-2 uppercase text-xs font-black tracking-widest text-slate-500 dark:text-slate-400/80">
                                        Destino <ArrowUpDown className="h-3 w-3 opacity-50" />
                                    </div>
                                </TableHead>
                                <TableHead onClick={() => handleSort('operator')} className="cursor-pointer hover:text-blue-600 transition-colors py-4">
                                    <div className="flex items-center gap-2 uppercase text-xs font-black tracking-widest text-slate-500 dark:text-slate-400/80">
                                        Operator <ArrowUpDown className="h-3 w-3 opacity-50" />
                                    </div>
                                </TableHead>
                                <TableHead onClick={() => handleSort('vessel')} className="cursor-pointer hover:text-blue-600 transition-colors py-4">
                                    <div className="flex items-center gap-2 uppercase text-xs font-black tracking-widest text-slate-500 dark:text-slate-400/80">
                                        Nave <ArrowUpDown className="h-3 w-3 opacity-50" />
                                    </div>
                                </TableHead>
                                <TableHead className="w-[100px] py-4 text-right pr-6 uppercase text-xs font-black tracking-widest text-slate-500 dark:text-slate-400/80">Gestión</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i} className="animate-pulse">
                                        <TableCell colSpan={7} className="py-6"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredRoutes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-20 bg-slate-50/20 dark:bg-slate-900/20">
                                        <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                                            <RouteIcon className="w-12 h-12 opacity-10" />
                                            <p className="text-lg font-medium">No se encontraron rutas.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredRoutes.map((route) => (
                                    <TableRow key={route.id} className="group hover:bg-white dark:hover:bg-slate-800/50 border-slate-100 dark:border-slate-800 transition-all">
                                        <TableCell className="py-4 px-6">
                                            <Badge variant="outline" className={cn(
                                                "px-2 py-0 font-bold text-[9px] uppercase border",
                                                route.mode === 'maritimo' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-slate-50 text-slate-700 border-slate-100'
                                            )}>
                                                {route.mode}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 dark:text-white text-xs uppercase">{route.origin?.name || '??'}</span>
                                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                    <MapPin className="w-2.5 h-2.5" /> Origen
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="p-1 bg-slate-50 dark:bg-slate-800 rounded-full">
                                                <Navigation className="h-3 w-3 text-slate-400 rotate-90" />
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 dark:text-white text-xs uppercase">{route.destination?.name || '??'}</span>
                                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                    <MapPin className="w-2.5 h-2.5" /> Destino
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 text-xs font-medium text-slate-600 dark:text-slate-400">
                                            {route.operator ? (
                                                <div className="flex items-center gap-1.5">
                                                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                                    {route.operator.name}
                                                </div>
                                            ) : <span className="opacity-30 italic text-[10px]">Sin asignar</span>}
                                        </TableCell>
                                        <TableCell className="py-4 text-xs font-medium text-slate-600 dark:text-slate-400">
                                            {route.vessel ? (
                                                <div className="flex items-center gap-1.5 border-l-2 border-blue-500/20 pl-2">
                                                    <Ship className="w-3.5 h-3.5 text-blue-500" />
                                                    {route.vessel.name}
                                                </div>
                                            ) : <span className="opacity-30 italic text-[10px]">Sin asignar</span>}
                                        </TableCell>
                                        <TableCell className="py-4 text-right pr-6">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" onClick={() => setEditingRoute(route)} className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600">
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => setDeletingRoute(route)} className="h-8 w-8 hover:bg-red-50 hover:text-red-600">
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

                <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800/50 text-[10px] text-muted-foreground flex justify-between items-center px-6">
                    <p>Total: {filteredRoutes.length} rutas configuradas</p>
                    <p className="flex items-center gap-1.5 font-medium">
                        <Filter className="w-3 h-3" />
                        Vista optimizada para gestión
                    </p>
                </div>
            </CardContent>

            <Dialog open={!!editingRoute} onOpenChange={(open: boolean) => !open && setEditingRoute(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-xl flex items-center gap-2">
                            <Pencil className="w-5 h-5 text-blue-500" />
                            Editar Ruta
                        </DialogTitle>
                        <DialogDescription className="font-normal text-slate-500 text-sm">
                            Modifique los parámetros del tramo seleccionado.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <RouteForm initialData={editingRoute || undefined} onSuccess={() => { setEditingRoute(null); fetchRoutes(); }} />
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deletingRoute} onOpenChange={(open: boolean) => !open && setDeletingRoute(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl text-red-600 font-normal">¿Eliminar ruta?</AlertDialogTitle>
                        <AlertDialogDescription className="text-base font-normal pt-2 text-slate-600">
                            ¿Estás seguro de eliminar la ruta <strong>{deletingRoute?.origin?.name} → {deletingRoute?.destination?.name}</strong>?<br />
                            <span className="text-[11px] text-red-500 font-bold uppercase mt-2 block">Esta acción no se puede deshacer.</span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="font-normal pt-4">
                        <AlertDialogCancel className="bg-slate-100 border-none">Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/20">Eliminar Definitivamente</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}
