import LogoutButton from '@/components/LogoutButton';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <nav className="bg-gray-800 text-white p-4 shadow-md">
                <div className="container mx-auto flex gap-6 items-center">
                    <span className="font-bold text-lg">Admin Panel</span>
                    <a href="/admin/logistics/itineraries" className="hover:underline opacity-90">Itinerarios</a>
                    <a href="/admin/people" className="hover:underline opacity-90">Personas</a>
                    <a href="/admin/locations" className="hover:underline opacity-90">Ubicaciones</a>
                    <a href="/admin/operators" className="hover:underline opacity-90">Operadores</a>
                    <a href="/admin/vessels" className="hover:underline opacity-90">Naves</a>
                    <a href="/admin/routes" className="hover:underline opacity-90">Rutas</a>
                    <a href="/" className="ml-auto text-xs bg-gray-700 px-2 py-1 rounded">Ir al Home</a>
                    <LogoutButton />
                </div>
            </nav>
            <main className="container mx-auto p-6 bg-white shadow m-6 rounded-lg min-h-[500px]">
                {children}
            </main>
        </div>
    )
}
