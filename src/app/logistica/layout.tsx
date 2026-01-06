import LogoutButton from '@/components/LogoutButton';

export default function LogisticaLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-slate-50">
            <nav className="bg-blue-800 text-white p-4 shadow-md">
                <div className="container mx-auto flex gap-6 items-center">
                    <span className="font-bold text-lg">Logística Status</span>
                    <a href="/logistica/itineraries" className="hover:underline opacity-90">Plan Diario</a>
                    <a href="/logistica/itineraries" className="hover:underline opacity-90">Itinerarios</a>
                    <a href="/admin" className="ml-auto text-xs bg-blue-900 px-2 py-1 rounded">Switch to Admin</a>
                    <LogoutButton />
                </div>
            </nav>
            <main className="container mx-auto p-6">
                {children}
            </main>
        </div>
    )
}
