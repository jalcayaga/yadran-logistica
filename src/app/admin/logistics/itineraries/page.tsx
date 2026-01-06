import ItineraryTable from './ItineraryTable';

export default function ItinerariesPage() {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">Gestión de Itinerarios</h1>
            <ItineraryTable />
        </div>
    );
}
