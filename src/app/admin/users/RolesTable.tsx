'use client';

import { useEffect, useState } from 'react';
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

export default function RolesTable({ initialUsers }: RolesTableProps) {
    const [users, setUsers] = useState<UserRoleData[]>(initialUsers);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const supabase = createClient();

    const fetchUsers = async () => {
        // setLoading(true); // Don't show full loader on refresh, maybe just a spinner somewhere else?
        const { data, error } = await supabase
            .from('user_roles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching users:', error);
            toast({
                title: "Error",
                description: "No tienes permisos para ver esta lista.",
                variant: "destructive"
            });
        } else {
            setUsers(data as UserRoleData[]);
        }
        // setLoading(false);
    };

    // Remove the initial useEffect fetch since we have server data
    // useEffect(() => {
    //    fetchUsers();
    // }, []);

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
                title: "Rol Actualizado",
                description: "Los permisos del usuario han cambiado.",
            });
            fetchUsers();
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case ROLES.SYSADMIN: return 'bg-purple-100 text-purple-800 border-purple-200';
            case ROLES.MANAGER: return 'bg-blue-100 text-blue-800 border-blue-200';
            case ROLES.OPERATOR: return 'bg-gray-100 text-gray-800 border-gray-200';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="border rounded-md overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="text-center">Email</TableHead>
                        <TableHead className="text-center">Rol Actual</TableHead>
                        <TableHead className="text-center">Cambiar Rol</TableHead>
                        <TableHead className="text-center">Registrado</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center py-8">Cargando usuarios...</TableCell>
                        </TableRow>
                    ) : users.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                No hay usuarios registrados.
                            </TableCell>
                        </TableRow>
                    ) : (
                        users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.email || 'Email no disponible'}</TableCell>
                                <TableCell className="text-center">
                                    <Badge variant="outline" className={getRoleColor(user.role)}>
                                        {user.role}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="flex justify-center">
                                        <Select
                                            defaultValue={user.role}
                                            onValueChange={(val) => updateRole(user.user_id, val as AppRole)}
                                        >
                                            <SelectTrigger className="w-[180px]">
                                                <SelectValue placeholder="Seleccionar rol" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={ROLES.SYSADMIN}>System Admin</SelectItem>
                                                <SelectItem value={ROLES.MANAGER}>Logistics Manager</SelectItem>
                                                <SelectItem value={ROLES.OPERATOR}>Operator</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center text-muted-foreground text-sm">
                                    {formatDate(user.created_at)}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
