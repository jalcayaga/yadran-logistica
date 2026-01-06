'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { routeSchema, type Route, TransportModeEnum } from '@/utils/zod_schemas';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useEffect, useState } from 'react';
import { z } from 'zod';

// We need types for the dropdowns
interface LocationOption { id: string; name: string; type: string; }
interface OperatorOption { id: string; name: string; type: string; }
interface VesselOption { id: string; name: string; type: string; }

type RouteFormData = z.input<typeof routeSchema>;

interface RouteFormProps {
    onSuccess: () => void;
    initialData?: Route;
}

export default function RouteForm({ onSuccess, initialData }: RouteFormProps) {
    const [loading, setLoading] = useState(false);
    const [globalError, setGlobalError] = useState('');

    // Catalogs State
    const [locations, setLocations] = useState<LocationOption[]>([]);
    const [operators, setOperators] = useState<OperatorOption[]>([]);
    const [vessels, setVessels] = useState<VesselOption[]>([]);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
        reset
    } = useForm<RouteFormData>({
        resolver: zodResolver(routeSchema),
        defaultValues: initialData || {
            active: true,
            mode: 'lancha',
            origin_location_id: '',
            destination_location_id: '',
            default_operator_id: null, // explicit null for optional
            default_vessel_id: null,   // explicit null for optional
        }
    });

    const selectedMode = watch('mode');
    const selectedOrigin = watch('origin_location_id');
    const selectedDestination = watch('destination_location_id');
    const selectedOperator = watch('default_operator_id');
    const selectedVessel = watch('default_vessel_id');

    // Load Catalogs
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [locsRes, opsRes, vessRes] = await Promise.all([
                    fetch('/api/locations').then(r => r.json()),
                    fetch('/api/operators').then(r => r.json()),
                    fetch('/api/vessels').then(r => r.json())
                ]);
                setLocations(locsRes);
                setOperators(opsRes);
                setVessels(vessRes);
            } catch (err) {
                console.error("Error loading catalogs", err);
            }
        };
        fetchData();
    }, []);

    const onSubmit = async (data: RouteFormData) => {
        setLoading(true);
        setGlobalError('');

        try {
            const url = initialData ? `/api/routes/${initialData.id}` : '/api/routes';
            const method = initialData ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const body = await res.json();
                throw new Error(body.error || 'Error al guardar');
            }

            reset();
            onSuccess();
        } catch (err: any) {
            setGlobalError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {globalError && <div className="text-red-500 text-sm font-bold">{globalError}</div>}

            <div className="space-y-2">
                <Label htmlFor="mode">Medio de Transporte</Label>
                <Select onValueChange={(val) => setValue('mode', val as any)} defaultValue={selectedMode}>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecciona medio" />
                    </SelectTrigger>
                    <SelectContent>
                        {TransportModeEnum.options.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                                {opt.charAt(0).toUpperCase() + opt.slice(1)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors.mode && <p className="text-red-500 text-xs">{errors.mode.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="origin">Origen</Label>
                    <Select onValueChange={(val) => setValue('origin_location_id', val)} defaultValue={selectedOrigin}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecciona origen" />
                        </SelectTrigger>
                        <SelectContent>
                            {locations.map((loc) => (
                                <SelectItem key={loc.id} value={loc.id}>
                                    {loc.name} ({loc.type})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.origin_location_id && <p className="text-red-500 text-xs">{errors.origin_location_id.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="destination">Destino</Label>
                    <Select onValueChange={(val) => setValue('destination_location_id', val)} defaultValue={selectedDestination}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecciona destino" />
                        </SelectTrigger>
                        <SelectContent>
                            {locations.map((loc) => (
                                <SelectItem key={loc.id} value={loc.id}>
                                    {loc.name} ({loc.type})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.destination_location_id && <p className="text-red-500 text-xs">{errors.destination_location_id.message}</p>}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t pt-4 mt-2">
                <div className="space-y-2">
                    <Label htmlFor="operator" className="text-muted-foreground">Operador por Defecto (Opcional)</Label>
                    <Select onValueChange={(val) => setValue('default_operator_id', val === 'none' ? null : val)} defaultValue={selectedOperator || 'none'}>
                        <SelectTrigger>
                            <SelectValue placeholder="Sin operador por defecto" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">-- Ninguno --</SelectItem>
                            {operators.map((op) => (
                                <SelectItem key={op.id} value={op.id}>
                                    {op.name} ({op.type})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="vessel" className="text-muted-foreground">Nave por Defecto (Opcional)</Label>
                    <Select onValueChange={(val) => setValue('default_vessel_id', val === 'none' ? null : val)} defaultValue={selectedVessel || 'none'}>
                        <SelectTrigger>
                            <SelectValue placeholder="Sin nave por defecto" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">-- Ninguna --</SelectItem>
                            {vessels.map((v) => (
                                <SelectItem key={v.id} value={v.id}>
                                    {v.name} ({v.type})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground">Dejar vacío para avionetas sin nombre fijo</p>
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => onSuccess()}>Cancelar</Button>
                <Button type="submit" disabled={loading}>
                    {loading ? 'Guardando...' : (initialData ? 'Actualizar' : 'Guardar Ruta')}
                </Button>
            </div>
        </form>
    );
}
