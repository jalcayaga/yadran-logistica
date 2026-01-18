import RouteTable from './RouteTable';
import { Route as RouteIcon } from 'lucide-react';

export default function AdminRoutesPage() {
    return (
        <div className="w-full space-y-8">
            <div className="flex flex-col gap-1 mb-8">
                <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3 text-slate-900 dark:text-white">
                    <span className="bg-blue-600 text-white p-2.5 rounded-2xl shadow-xl shadow-blue-500/20">
                        <RouteIcon className="w-7 h-7" />
                    </span>
                    Gestión de Rutas
                </h1>
                <p className="text-muted-foreground text-sm pl-16">
                    Configure tramos frecuentes y combinaciones origen-destino predeterminadas.
                </p>
            </div>
            <RouteTable hideHeader={true} />
        </div>
    );
}
