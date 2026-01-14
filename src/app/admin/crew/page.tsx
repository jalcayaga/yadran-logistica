import CrewTable from './CrewTable';

export default function AdminCrewPage() {
    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Gestión de Tripulación</h1>
            <p className="text-muted-foreground mb-6">Administra exclusivamente Capitanes, Patrones y Tripulantes.</p>
            <CrewTable />
        </div>
    )
}
