import VesselTable from './VesselTable';
import { Ship } from 'lucide-react';

export default function AdminVesselsPage() {
    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-1 mb-8">
                <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3 text-slate-900 dark:text-white">
                    <span className="bg-blue-600 text-white p-2.5 rounded-2xl shadow-xl shadow-blue-500/20">
                        <Ship className="w-7 h-7" />
                    </span>
                    Gestión de Naves
                </h1>
                <p className="text-muted-foreground text-sm pl-16">
                    Administre su flota, matrículas oficiales y capacidades de transporte.
                </p>
            </div>
            <VesselTable />
        </div>
    );
}
