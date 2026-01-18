'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge";
import { AppRole, ROLES } from '@/utils/roles';
import { formatDate } from '@/utils/formatters';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import {
    ShieldCheck,
    Mail,
    Calendar,
    UserCog,
    ShieldAlert,
    CheckCircle2,
    Lock,
    Search,
    Filter
} from 'lucide-react';
import { Input } from '@/components/ui/input';

interface UserRoleData {
    id: string;
    user_id: string;
    email: string | null;
    role: AppRole;
    created_at: string;
}

interface RolesTableProps {
    initialUsers: UserRoleData[];
}

export default function RolesTable({ initialUsers, hideHeader = false }: RolesTableProps & { hideHeader?: boolean }) {
    const [users, setUsers] = useState<UserRoleData[]>(initialUsers);
    const [searchTerm, setSearchTerm] = useState('');
    const { toast } = useToast();
    const supabase = createClient();

    const fetchUsers = async () => {
        const { data, error } = await supabase
            .from('user_roles')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setUsers(data as UserRoleData[]);
        }
    };

    const updateRole = async (userId: string, newRole: AppRole) => {
        const { error } = await supabase
            .from('user_roles')
            .update({ role: newRole })
            .eq('user_id', userId);

        if (error) {
            toast({
                title: "Error",
                description: "No se pudo actualizar el rol.",
                variant: "destructive"
            });
        } else {
            toast({
                title: "Permisos Actualizados",
                description: `El usuario ahora tiene rol de ${newRole}.`,
                className: "bg-emerald-600 text-white border-emerald-700"
            });
            fetchUsers();
        }
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case ROLES.SYSADMIN:
                return (
                    <Badge className="bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 font-bold px-2 py-0.5 rounded-full text-[9px]">
                        <ShieldAlert className="w-3 h-3 mr-1" />
                        SYSTEM ADMIN
                    </Badge>
                );
            case ROLES.MANAGER:
                return (
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 font-bold px-2 py-0.5 rounded-full text-[9px]">
                        <UserCog className="w-3 h-3 mr-1" />
                        LOGISTICS MANAGER
                    </Badge>
                );
            case ROLES.OPERATOR:
                return (
                    <Badge className="bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 font-bold px-2 py-0.5 rounded-full text-[9px]">
                        <Lock className="w-3 h-3 mr-1" />
                        OPERATOR
                    </Badge>
                );
            default:
                return <Badge variant="outline">{role}</Badge>;
        }
    };

    const filteredUsers = users.filter(u =>
        (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Card className="border-none shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-0">
                <div className={`flex flex-col sm:flex-row ${hideHeader ? 'justify-end' : 'justify-between'} items-start sm:items-center p-6 gap-4 border-b border-slate-100 dark:border-slate-800/50`}>
                    {!hideHeader && (
                        <div className="flex flex-col gap-0.5">
                            <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2.5 text-slate-900 dark:text-white">
                                <div className="p-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                    <ShieldCheck className="w-5 h-5 text-purple-600" />
                                </div>
                                Usuarios Registrados
                            </h2>
                            <p className="text-[11px] text-muted-foreground font-medium pl-10">
                                Listado completo de personal con acceso al sistema
                            </p>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-purple-500 transition-colors" />
                            <Input
                                placeholder="Buscar por email o rol..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 focus-visible:ring-purple-500/20 focus-visible:border-purple-500 transition-all font-normal"
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                            <TableRow className="hover:bg-transparent border-slate-200 dark:border-slate-800/50">
                                <TableHead className="py-4 px-6 uppercase text-xs font-black tracking-widest text-slate-500 dark:text-slate-400/80">Identidad / Email</TableHead>
                                <TableHead className="py-4 text-center uppercase text-xs font-black tracking-widest text-slate-500 dark:text-slate-400/80">Nivel de Acceso</TableHead>
                                <TableHead className="py-4 text-center uppercase text-xs font-black tracking-widest text-slate-500 dark:text-slate-400/80">Acción</TableHead>
                                <TableHead className="py-4 text-right pr-6 uppercase text-xs font-black tracking-widest text-slate-500 dark:text-slate-400/80">Fecha Registro</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-20 bg-slate-50/20 dark:bg-slate-900/20">
                                        <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                                            <ShieldAlert className="w-12 h-12 opacity-10" />
                                            <p className="text-lg font-medium">No se encontraron usuarios.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map((user) => (
                                    <TableRow key={user.id} className="group hover:bg-white dark:hover:bg-slate-800/50 border-slate-100 dark:border-slate-800 transition-all duration-200">
                                        <TableCell className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 font-bold text-xs uppercase">
                                                    {user.email?.[0] || '?'}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900 dark:text-white text-xs">{user.email || 'S/I'}</span>
                                                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                                        <Mail className="w-2.5 h-2.5" />
                                                        Acceso Autorizado
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 text-center">
                                            {getRoleBadge(user.role)}
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex justify-center">
                                                <Select
                                                    defaultValue={user.role}
                                                    onValueChange={(val) => updateRole(user.user_id, val as AppRole)}
                                                >
                                                    <SelectTrigger className="w-[160px] h-8 text-[11px] bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-normal">
                                                        <SelectValue placeholder="Cambiar rol" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value={ROLES.SYSADMIN} className="text-[11px]">System Admin</SelectItem>
                                                        <SelectItem value={ROLES.MANAGER} className="text-[11px]">Logistics Manager</SelectItem>
                                                        <SelectItem value={ROLES.OPERATOR} className="text-[11px]">Operator</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 text-right pr-6">
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase">
                                                    <Calendar className="w-3 h-3 text-slate-400" />
                                                    {formatDate(user.created_at)}
                                                </span>
                                                <span className="text-[9px] text-emerald-600 dark:text-emerald-500 flex items-center gap-1 font-bold">
                                                    <CheckCircle2 className="w-2.5 h-2.5" />
                                                    ACTIVO
                                                </span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800/50 text-[10px] text-muted-foreground flex justify-between items-center px-6">
                    <p>Total: {filteredUsers.length} usuarios autorizados</p>
                    <p className="flex items-center gap-1.5 font-medium">
                        <Filter className="w-3 h-3" />
                        Filtrado dinámico activo
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
