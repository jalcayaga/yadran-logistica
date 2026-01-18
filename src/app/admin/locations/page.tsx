import LocationTable from './LocationTable';
import { MapPin } from 'lucide-react';

export default function AdminLocationsPage() {
    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-1 mb-8">
                <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3 text-slate-900 dark:text-white">
                    <span className="bg-emerald-600 text-white p-2.5 rounded-2xl shadow-xl shadow-emerald-500/20">
                        <MapPin className="w-7 h-7" />
                    </span>
                    Gestión de Ubicaciones
                </h1>
                <p className="text-muted-foreground text-sm pl-16">
                    Administre puertos, centros de cultivo y bases operativas.
                </p>
            </div>
            <LocationTable hideHeader={true} />
        </div>
    );
}
