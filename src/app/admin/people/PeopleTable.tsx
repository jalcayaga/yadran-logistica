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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatPhone, formatRut } from '@/utils/formatters';
import {
    Plus,
    ArrowUpDown,
    Pencil,
    Trash2,
    Search,
    User,
    Building2,
    Phone,
    CreditCard,
    Briefcase,
    Filter,
    UserPlus
} from 'lucide-react';
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

    useEffect(() => {
        let result = people.filter(p => !p.is_crew);

        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            const cleanSearchTerm = searchTerm.replace(/[^0-9kK]/g, '').toLowerCase();

            result = result.filter(p => {
                const cleanRutNormalized = p.rut_normalized.replace(/[^0-9kK]/g, '').toLowerCase();
                const cleanRutDisplay = p.rut_display.replace(/[^0-9kK]/g, '').toLowerCase();

                return (
                    p.first_name.toLowerCase().includes(lowerTerm) ||
                    p.last_name.toLowerCase().includes(lowerTerm) ||
                    cleanRutDisplay.includes(cleanSearchTerm) ||
                    cleanRutNormalized.includes(cleanSearchTerm) ||
                    p.company.toLowerCase().includes(lowerTerm)
                );
            });
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
            const res = await fetch(`/api/people/${deletingPerson.id}`, { method: 'DELETE' });
            if (res.ok) { fetchPeople(); setDeletingPerson(null); }
            else { alert('Error al eliminar'); }
        } catch (error) { console.error(error); alert('Error al eliminar'); }
    };

    return (
        <Card className="border-none shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div className="relative w-full max-w-md group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-indigo-500 transition-colors" />
                        <Input
                            placeholder="Buscar por nombre, RUT o empresa..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 transition-all font-normal"
                        />
                    </div>

                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 transition-all active:scale-95 w-full md:w-auto font-normal">
                                <Plus className="mr-2 h-4 w-4" /> Nuevo Pasajero
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle className="text-xl flex items-center gap-2">
                                    <UserPlus className="w-5 h-5 text-indigo-500" />
                                    Agregar Pasajero
                                </DialogTitle>
                            </DialogHeader>
                            <div className="py-4 font-normal">
                                <PersonForm onSuccess={() => { setIsOpen(false); fetchPeople(); }} />
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white/30 dark:bg-slate-900/30">
                    <Table>
                        <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                            <TableRow className="hover:bg-transparent border-slate-200 dark:border-slate-800">
                                <TableHead onClick={() => handleSort('first_name')} className="cursor-pointer hover:text-indigo-600 transition-colors py-4 px-6">
                                    <div className="flex items-center gap-2 uppercase text-[10px] font-bold tracking-wider text-slate-500">
                                        Nombres <ArrowUpDown className="h-3 w-3 opacity-50" />
                                    </div>
                                </TableHead>
                                <TableHead onClick={() => handleSort('last_name')} className="cursor-pointer hover:text-indigo-600 transition-colors py-4">
                                    <div className="flex items-center gap-2 uppercase text-[10px] font-bold tracking-wider text-slate-500">
                                        Apellidos <ArrowUpDown className="h-3 w-3 opacity-50" />
                                    </div>
                                </TableHead>
                                <TableHead className="py-4 uppercase text-[10px] font-bold tracking-wider text-slate-500">Documentación</TableHead>
                                <TableHead className="py-4 uppercase text-[10px] font-bold tracking-wider text-slate-500">Empresa / Cargo</TableHead>
                                <TableHead className="py-4 uppercase text-[10px] font-bold tracking-wider text-slate-500">Contacto</TableHead>
                                <TableHead className="w-[100px] py-4 text-right pr-6 uppercase text-[10px] font-bold tracking-wider text-slate-500">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i} className="animate-pulse border-slate-100 dark:border-slate-800">
                                        <TableCell colSpan={6} className="py-6 px-6">
                                            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : filteredPeople.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-20 bg-slate-50/20 dark:bg-slate-900/20">
                                        <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                                            <User className="w-12 h-12 opacity-10" />
                                            <p className="text-lg font-medium">
                                                {searchTerm ? "No se encontraron resultados" : "No hay pasajeros registrados."}
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredPeople.map((p) => (
                                    <TableRow key={p.id} className="group hover:bg-white dark:hover:bg-slate-800/50 border-slate-100 dark:border-slate-800 transition-all duration-200">
                                        <TableCell className="py-4 px-6">
                                            <span className="font-semibold text-slate-700 dark:text-slate-200 uppercase">{p.first_name}</span>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <span className="font-semibold text-slate-700 dark:text-slate-200 uppercase">{p.last_name}</span>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="px-2 py-0.5 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-mono text-[10px]">
                                                    <CreditCard className="w-3 h-3 mr-1 opacity-50" />
                                                    {formatRut(p.rut_normalized)}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                                    <Building2 className="w-3 h-3 text-indigo-500" />
                                                    {p.company}
                                                </span>
                                                <span className="text-[10px] text-slate-500 flex items-center gap-1.5 ml-4">
                                                    <Briefcase className="w-2.5 h-2.5" />
                                                    {p.job_title || 'S/I'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            {p.phone_e164 ? (
                                                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                                                    <Phone className="w-3 h-3 text-emerald-500" />
                                                    {formatPhone(p.phone_e164)}
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-slate-400">S/I</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="py-4 text-right pr-6">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" onClick={() => setEditingPerson(p)} className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/30">
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => setDeletingPerson(p)} className="h-8 w-8 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30">
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
                    <p>Total: {filteredPeople.length} pasajeros</p>
                    <p className="flex items-center gap-1">
                        <Filter className="w-3 h-3" />
                        Listado optimizado para búsqueda rápida
                    </p>
                </div>
            </CardContent>

            {/* Dialogs */}
            <Dialog open={!!editingPerson} onOpenChange={(open: boolean) => !open && setEditingPerson(null)}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl flex items-center gap-2">
                            <Pencil className="w-5 h-5 text-indigo-500" />
                            Editar Pasajero
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4 font-normal">
                        <PersonForm initialData={editingPerson || undefined} onSuccess={() => { setEditingPerson(null); fetchPeople(); }} />
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deletingPerson} onOpenChange={(open: boolean) => !open && setDeletingPerson(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl text-red-600 flex items-center gap-2 font-normal">
                            <Trash2 className="w-5 h-5" />
                            ¿Eliminar pasajero?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-base pt-2 font-normal">
                            ¿Estás seguro de eliminar a <strong>{deletingPerson?.first_name} {deletingPerson?.last_name}</strong>? Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 pt-4 font-normal">
                        <AlertDialogCancel className="bg-slate-100 border-none">Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/20">
                            Eliminar Pasajero
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}
