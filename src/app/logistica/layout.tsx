import HeaderBar from '@/components/HeaderBar';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { getUserRole } from '@/utils/roles';
import { UserNav } from '@/components/UserNav';

export default async function LogisticaLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const role = await getUserRole(supabase);
    const navLinks = (
        <div className="flex gap-6 items-center text-sm">
            <Link href="/logistica/dashboard" className="font-medium hover:text-primary">Dashboard</Link>
            <Link href="/logistica/itineraries" className="font-medium hover:text-primary">Itinerarios</Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-zinc-950/20">
            <div className="container mx-auto p-4 md:p-6">
                <HeaderBar
                    title="Logística Status"
                    subtitle="Vista de Operaciones"
                    navContent={navLinks}
                >
                    <UserNav email={user?.email} role={role} />
                </HeaderBar>
                <main className="bg-background/60 shadow-sm border border-border/50 rounded-xl p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
