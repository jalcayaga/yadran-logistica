import HeaderBar from '@/components/HeaderBar';
import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton';
import { createClient } from '@/utils/supabase/server';
import { getUserRole, ROLES } from '@/utils/roles';
import { redirect } from 'next/navigation';

import { UserNav } from '@/components/UserNav';
import { Toaster } from '@/components/ui/toaster';


export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const role = await getUserRole(supabase);
    console.log("DEBUG: AdminLayout detected role:", role);

    // Security: Operators cannot access Admin Dashboard
    if (role === ROLES.OPERATOR) {
        redirect('/logistica');
    }

    const navLinks = (
        <div className="flex gap-4 md:gap-6 items-center overflow-x-auto text-sm">
            <Link href="/admin/logistics/itineraries" className="font-medium hover:text-primary whitespace-nowrap">Itinerarios</Link>
            <Link href="/admin/crew" className="font-medium hover:text-primary whitespace-nowrap text-orange-600">Tripulación</Link>
            <Link href="/admin/people" className="font-medium hover:text-primary whitespace-nowrap">Pasajeros</Link>
            <Link href="/admin/locations" className="font-medium hover:text-primary whitespace-nowrap">Ubicaciones</Link>
            <Link href="/admin/operators" className="font-medium hover:text-primary whitespace-nowrap">Operadores</Link>
            <Link href="/admin/vessels" className="font-medium hover:text-primary whitespace-nowrap">Naves</Link>
            {/* <Link href="/admin/routes" className="font-medium hover:text-primary whitespace-nowrap">Rutas</Link> */}
            {role === ROLES.SYSADMIN && (
                <Link href="/admin/users" className="font-medium hover:text-primary whitespace-nowrap text-purple-600">Usuarios</Link>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-zinc-950/20">
            <div className="container mx-auto p-4 md:p-6">
                <HeaderBar
                    title="Admin Panel"
                    subtitle="Gestión Logística"
                    navContent={navLinks}
                >
                    <UserNav email={user?.email} role={role} />
                </HeaderBar>
                <main className="bg-background/60 shadow-sm border border-border/50 rounded-xl p-6 min-h-[500px]">
                    {children}
                </main>
            </div>
            <Toaster />
        </div>
    )
}
