import HeaderBar from '@/components/HeaderBar';
import { createClient } from '@/utils/supabase/server';
import { getUserRole } from '@/utils/roles';
import { UserNav } from '@/components/UserNav';
import { Sidebar } from '@/components/Sidebar';

export default async function LogisticaLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const role = await getUserRole(supabase);

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-zinc-950/20 flex flex-col lg:flex-row">
            <Sidebar role={role || undefined} />

            <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
                <div className="p-4 md:p-8 space-y-6">
                    <HeaderBar
                        title="Logística Status"
                        subtitle="Vista de Operaciones"
                        showBranding={false}
                    >
                        <UserNav email={user?.email} role={role} />
                    </HeaderBar>

                    <main className="bg-background/60 shadow-sm border border-border/50 rounded-xl p-4 md:p-8">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    )
}
