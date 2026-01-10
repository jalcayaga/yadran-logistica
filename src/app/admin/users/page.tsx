import { createClient } from '@/utils/supabase/server';
import RolesTable from './RolesTable';
import { AppRole } from '@/utils/roles';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
    const supabase = await createClient();
    const { data: users, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("SERVER ERROR: Could not fetch users", error);
    }

    // Cast the role to AppRole to satisfy TS
    const formattedUsers = (users || []).map(u => ({
        ...u,
        role: u.role as AppRole
    }));

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Gestión de Usuarios</h1>
                <p className="text-muted-foreground">
                    Administra los accesos y roles de la plataforma. Solo visible para SysAdmins.
                </p>
                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-md mt-4">
                        Error cargando usuarios: {error.message}
                    </div>
                )}
            </div>

            <RolesTable initialUsers={formattedUsers} />
        </div>
    );
}
