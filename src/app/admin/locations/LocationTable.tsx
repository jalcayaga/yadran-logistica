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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Plus,
    ArrowUpDown,
    Pencil,
    Trash2,
    Search,
    MapPin,
    Anchor,
    Building2,
    Globe,
    Filter,
    Map
} from 'lucide-react';
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
            if (res.ok) { fetchLocations(); setDeletingLocation(null); }
            else { alert('Error al eliminar'); }
        } catch (error) { console.error(error); alert('Error al eliminar'); }
    };

    const getTypeColor = (type: string) => {
        switch (type.toLowerCase()) {
            case 'center': return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'port': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400';
            case 'base': return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400';
            case 'city': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400';
            default: return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case 'center': return <Building2 className="w-3.5 h-3.5" />;
            case 'port': return <Anchor className="w-3.5 h-3.5" />;
            case 'base': return <Globe className="w-3.5 h-3.5" />;
            default: return <MapPin className="w-3.5 h-3.5" />;
        }
    };

    return (
        <Card className="border-none shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <CardContent className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <TabsList className="bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                            <TabsTrigger value="centers" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">Centros</TabsTrigger>
                            <TabsTrigger value="ports" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Puertos</TabsTrigger>
                            <TabsTrigger value="all">Ver Todos</TabsTrigger>
                        </TabsList>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative w-full md:w-64 group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-emerald-500 transition-colors" />
                                <Input
                                    placeholder="Buscar ubicación..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 transition-all"
                                />
                            </div>
                            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 transition-all active:scale-95">
                                        <Plus className="mr-2 h-4 w-4" /> Nuevo
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[500px]">
                                    <DialogHeader>
                                        <DialogTitle className="text-xl flex items-center gap-2">
                                            <MapPin className="w-5 h-5 text-emerald-500" />
                                            Agregar Ubicación
                                        </DialogTitle>
                                    </DialogHeader>
                                    <div className="py-4 font-normal">
                                        <LocationForm onSuccess={() => { setIsOpen(false); fetchLocations(); }} />
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white/30 dark:bg-slate-900/30">
                        <Table>
                            <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                                <TableRow className="hover:bg-transparent border-slate-200 dark:border-slate-800">
                                    <TableHead onClick={() => handleSort('code')} className="cursor-pointer hover:text-emerald-600 transition-colors py-4 px-6">
                                        <div className="flex items-center gap-2">
                                            Código <ArrowUpDown className="h-3 w-3 opacity-50" />
                                        </div>
                                    </TableHead>
                                    <TableHead onClick={() => handleSort('name')} className="cursor-pointer hover:text-emerald-600 transition-colors py-4">
                                        <div className="flex items-center gap-2">
                                            Nombre <ArrowUpDown className="h-3 w-3 opacity-50" />
                                        </div>
                                    </TableHead>
                                    <TableHead onClick={() => handleSort('type')} className="cursor-pointer hover:text-emerald-600 transition-colors py-4">
                                        <div className="flex items-center gap-2">
                                            Tipo <ArrowUpDown className="h-3 w-3 opacity-50" />
                                        </div>
                                    </TableHead>
                                    <TableHead className="w-[100px] py-4 text-right pr-6">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i} className="animate-pulse border-slate-100 dark:border-slate-800">
                                            <TableCell colSpan={4} className="py-6 px-6">
                                                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full" />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : filteredLocations.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-20 bg-slate-50/20 dark:bg-slate-900/20">
                                            <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                                                <Map className="w-12 h-12 opacity-10" />
                                                <p className="text-lg font-medium">
                                                    {searchTerm ? "No se encontraron resultados" : "No hay ubicaciones registradas."}
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredLocations.map((loc) => (
                                        <TableRow key={loc.id} className="group hover:bg-white dark:hover:bg-slate-800/50 border-slate-100 dark:border-slate-800 transition-all duration-200">
                                            <TableCell className="py-4 px-6">
                                                <div className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-xs border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 shadow-inner inline-block">
                                                    {loc.code}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <span className="font-semibold text-slate-700 dark:text-slate-200">
                                                    {loc.name}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <Badge variant="outline" className={`px-2 py-0.5 font-medium border capitalize flex items-center gap-1.5 w-fit ${getTypeColor(loc.type)}`}>
                                                    {getTypeIcon(loc.type)}
                                                    {translateLocationType(loc.type)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-4 text-right pr-6">
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" onClick={() => setEditingLocation(loc)} className="h-8 w-8 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/30">
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => setDeletingLocation(loc)} className="h-8 w-8 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30">
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
                        <p>Total: {filteredLocations.length} ubicaciones</p>
                        <p className="flex items-center gap-1 font-normal">
                            <Filter className="w-3 h-3" />
                            Vista filtrada por categoría y búsqueda
                        </p>
                    </div>
                </Tabs>
            </CardContent>

            {/* Dialogs */}
            <Dialog open={!!editingLocation} onOpenChange={(open: boolean) => !open && setEditingLocation(null)}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl flex items-center gap-2">
                            <Pencil className="w-5 h-5 text-emerald-500" />
                            Editar Ubicación
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4 font-normal">
                        <LocationForm initialData={editingLocation || undefined} onSuccess={() => { setEditingLocation(null); fetchLocations(); }} />
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deletingLocation} onOpenChange={(open: boolean) => !open && setDeletingLocation(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl text-red-600 flex items-center gap-2 font-normal">
                            <Trash2 className="w-5 h-5" />
                            ¿Eliminar ubicación?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-base pt-2 font-normal">
                            ¿Estás seguro de eliminar <strong>{deletingLocation?.name}</strong>? Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 pt-4 font-normal">
                        <AlertDialogCancel className="bg-slate-100 border-none">Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/20">
                            Eliminar Ubicación
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}
