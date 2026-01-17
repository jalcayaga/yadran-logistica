import { createClient } from '@/utils/supabase/server';
import RolesTable from './RolesTable';
import { AppRole } from '@/utils/roles';
import { ShieldCheck } from 'lucide-react';

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
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-1 mb-8">
                <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3 text-slate-900 dark:text-white">
                    <span className="bg-purple-600 text-white p-2.5 rounded-2xl shadow-xl shadow-purple-500/20">
                        <ShieldCheck className="w-7 h-7" />
                    </span>
                    Control de Accesos
                </h1>
                <p className="text-muted-foreground text-sm pl-16">
                    Gestione los roles y permisos de seguridad para los usuarios de la plataforma.
                </p>
                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl mt-4 border border-red-100 font-medium text-sm flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                        Error cargando usuarios: {error.message}
                    </div>
                )}
            </div>

            <RolesTable initialUsers={formattedUsers} />
        </div>
    );
}
