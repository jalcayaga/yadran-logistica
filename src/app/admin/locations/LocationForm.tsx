'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { locationSchema, type Location, LocationTypeEnum } from '@/utils/zod_schemas';
import { translateLocationType } from '@/utils/formatters';
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
import { useState } from 'react';
import { z } from 'zod';

type LocationFormData = z.input<typeof locationSchema>;

interface LocationFormProps {
    onSuccess: () => void;
    initialData?: Location;
}

export default function LocationForm({ onSuccess, initialData }: LocationFormProps) {
    const [loading, setLoading] = useState(false);
    const [globalError, setGlobalError] = useState('');

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
        reset
    } = useForm<LocationFormData>({
        resolver: zodResolver(locationSchema),
        defaultValues: initialData || {
            active: true,
            name: '',
            code: '',
            type: 'center', // Default
        }
    });

    const selectedType = watch('type');

    const onSubmit = async (data: LocationFormData) => {
        setLoading(true);
        setGlobalError('');

        try {
            const url = initialData ? `/api/locations/${initialData.id}` : '/api/locations';
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

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="code">Código Interno</Label>
                    <Input id="code" placeholder="PMT, QLL..." {...register('code')} />
                    {errors.code && <p className="text-red-500 text-xs">{errors.code.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="type">Tipo</Label>
                    <Select onValueChange={(val) => setValue('type', val as any)} defaultValue={selectedType}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecciona tipo" />
                        </SelectTrigger>
                        <SelectContent>
                            {LocationTypeEnum.options.map((opt) => (
                                <SelectItem key={opt} value={opt}>
                                    {translateLocationType(opt)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.type && <p className="text-red-500 text-xs">{errors.type.message}</p>}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="name">Nombre Ubicación</Label>
                <Input id="name" placeholder="Puerto Montt, Centro X..." {...register('name')} />
                {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => onSuccess()}>Cancelar</Button>
                <Button type="submit" disabled={loading}>
                    {loading ? 'Guardando...' : (initialData ? 'Actualizar' : 'Guardar Ubicación')}
                </Button>
            </div>
        </form>
    );
}
