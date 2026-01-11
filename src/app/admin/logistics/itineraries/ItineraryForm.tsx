'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { itinerarySchema, type Itinerary, type ItineraryStop } from '@/utils/zod_schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Plus, Trash2, ArrowDown } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";

type ItineraryFormData = z.input<typeof itinerarySchema>;

interface ItineraryFormProps {
    onSuccess: () => void;
    initialData?: Itinerary;
}

export default function ItineraryForm({ onSuccess, initialData }: ItineraryFormProps) {
    const [loading, setLoading] = useState(false);
    const [globalError, setGlobalError] = useState('');

    // Catalogs
    const [vessels, setVessels] = useState<{ id: string, name: string }[]>([]);
    const [locations, setLocations] = useState<{ id: string, name: string }[]>([]);

    const {
        register,
        control,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<ItineraryFormData>({
        resolver: zodResolver(itinerarySchema),
        defaultValues: initialData || {
            date: new Date().toISOString().split('T')[0],
            start_time: '08:00',
            status: 'scheduled',
            stops: [
                { location_id: '', stop_order: 0, departure_time: '08:00' }, // Origin
                { location_id: '', stop_order: 1, arrival_time: '09:00' }   // Destination
            ]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "stops"
    });

    // Load catalogs
    useEffect(() => {
        Promise.all([
            fetch('/api/vessels').then(r => r.json()),
            fetch('/api/locations').then(r => r.json())
        ]).then(([v, l]) => {
            setVessels(v);
            setLocations(l);
        });
    }, []);

    const selectedVessel = watch('vessel_id');

    const onSubmit = async (data: ItineraryFormData) => {
        setLoading(true);
        setGlobalError('');
        console.log("Submitting:", data);

        // Normalize stops order
        const stops = data.stops.map((stop, index) => ({
            ...stop,
            stop_order: index
        }));

        const payload = { ...data, stops };

        try {
            const url = initialData?.id ? `/api/itineraries/${initialData.id}` : '/api/itineraries';
            const method = initialData?.id ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const body = await res.json();
                if (res.status === 409) {
                    // Specific FK violation error from backend
                    throw new Error(body.error);
                }
                throw new Error(body.error || 'Error saving itinerary');
            }

            onSuccess();
        } catch (err: any) {
            setGlobalError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {globalError && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm font-bold">{globalError}</div>}

            {/* Header: Date, Time, Vessel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-gray-50/50">
                <div className="space-y-2">
                    <Label htmlFor="date">Fecha de Zarpe</Label>
                    <Input type="date" {...register('date')} />
                    {errors.date && <p className="text-red-500 text-xs">{errors.date.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="start_time">Hora Inicio</Label>
                    <Input type="time" {...register('start_time')} />
                    {errors.start_time && <p className="text-red-500 text-xs">{errors.start_time.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label>Nave Asignada</Label>
                    <Select onValueChange={(val) => setValue('vessel_id', val)} defaultValue={selectedVessel}>
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccionar nave" />
                        </SelectTrigger>
                        <SelectContent>
                            {vessels.map(v => (
                                <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.vessel_id && <p className="text-red-500 text-xs">{errors.vessel_id.message}</p>}
                </div>
            </div>

            {/* Stops Sequence */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Itinerario (Paradas)</h3>
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ location_id: '', stop_order: fields.length, arrival_time: '', departure_time: '' })}>
                        <Plus className="w-4 h-4 mr-1" /> Agregar Parada Intermedia
                    </Button>
                </div>

                <div className="space-y-0 relative pl-4 border-l-2 border-gray-200 ml-4">
                    {fields.map((field, index) => (
                        <div key={field.id} className="relative pb-6 group">
                            {/* Connector dot */}
                            <div className="absolute -left-[21px] top-4 w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm z-10"></div>

                            <Card className="relative">
                                <CardContent className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                    <div className="md:col-span-1 text-xs font-bold text-muted-foreground pt-2">
                                        #{index + 1}
                                    </div>

                                    <div className="md:col-span-4 space-y-1">
                                        <Label className="text-xs">Ubicación</Label>
                                        <Select
                                            onValueChange={(val) => setValue(`stops.${index}.location_id`, val)}
                                            defaultValue={watch(`stops.${index}.location_id`)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecciona ubicación" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {locations.map(l => (
                                                    <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.stops?.[index]?.location_id && <p className="text-red-500 text-xs text-nowrap">Requerido</p>}
                                    </div>

                                    <div className="md:col-span-3 space-y-1">
                                        <Label className="text-xs">Llegada</Label>
                                        <Input type="time" {...register(`stops.${index}.arrival_time`)} placeholder="--:--" />
                                    </div>

                                    <div className="md:col-span-3 space-y-1">
                                        <Label className="text-xs">Salida</Label>
                                        <Input type="time" {...register(`stops.${index}.departure_time`)} placeholder="--:--" />
                                    </div>

                                    <div className="md:col-span-1 flex justify-end">
                                        {index > 1 && ( // Can't delete first 2 minimal stops easily for now, keep logic simple
                                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ))}
                </div>
                {errors.stops && <p className="text-red-500 text-sm">{errors.stops.message}</p>}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onSuccess}>Cancelar</Button>
                <Button type="submit" disabled={loading} className="w-40">
                    {loading ? 'Guardando...' : (initialData ? 'Guardar Cambios' : 'Crear Itinerario')}
                </Button>
            </div>
        </form>
    );
}
