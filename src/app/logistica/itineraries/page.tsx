'use client';

import ItineraryTable from '@/app/admin/logistics/itineraries/ItineraryTable';

export default function LogisticsItinerariesPage() {
    return (
        <div className="container mx-auto py-6">
            <h1 className="text-2xl font-bold mb-6">Gestión de Itinerarios</h1>
            <ItineraryTable hideHeader={true} />
        </div>
    );
}
