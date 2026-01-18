import HeaderBar from '@/components/HeaderBar';
import LogoutButton from '@/components/LogoutButton';
import { createClient } from '@/utils/supabase/server';
import { getUserRole, ROLES } from '@/utils/roles';
import { redirect } from 'next/navigation';

import { UserNav } from '@/components/UserNav';
import { Toaster } from '@/components/ui/toaster';
import { Sidebar } from '@/components/Sidebar';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const role = await getUserRole(supabase);

    // Security: Operators cannot access Admin Dashboard
    if (role === ROLES.OPERATOR) {
        redirect('/logistica');
    }

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-zinc-950/20 flex flex-col lg:flex-row">
            <Sidebar role={role || undefined} />

            <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
                <div className="p-4 md:p-6 space-y-6">
                    <HeaderBar
                        title="Admin Panel"
                        subtitle="Gestión Logística"
                        showBranding={false}
                    >
                        <UserNav email={user?.email} role={role} />
                    </HeaderBar>

                    <main className="bg-background/60 shadow-sm border border-border/50 rounded-xl p-4 md:p-6 min-h-[calc(100vh-160px)]">
                        {children}
                    </main>
                </div>
            </div>
            <Toaster />
        </div>
    )
}
