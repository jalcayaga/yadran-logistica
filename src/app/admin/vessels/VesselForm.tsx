'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { vesselSchema, type Vessel, VesselTypeEnum } from '@/utils/zod_schemas';
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
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

type VesselFormData = z.input<typeof vesselSchema>;

interface VesselFormProps {
    onSuccess: () => void;
    initialData?: Vessel;
}

export default function VesselForm({ onSuccess, initialData }: VesselFormProps) {
    const [loading, setLoading] = useState(false);
    const [globalError, setGlobalError] = useState('');
    const { toast } = useToast();

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
        reset
    } = useForm<VesselFormData>({
        resolver: zodResolver(vesselSchema),
        defaultValues: initialData || {
            active: true,
            name: '',
            type: 'other', // Default
            capacity: 0,
        }
    });

    const selectedType = watch('type');

    const onSubmit = async (data: VesselFormData) => {
        setLoading(true);
        setGlobalError('');

        try {
            const isEdit = initialData && initialData.id;
            if (initialData && !isEdit) {
                console.error("Critical: Initial data present but missing ID", initialData);
                throw new Error("Error interno: No se pudo identificar la nave a editar.");
            }

            const url = isEdit ? `/api/vessels/${initialData.id}` : '/api/vessels';
            const method = isEdit ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const body = await res.json();
                throw new Error(body.error || 'Error al guardar');
            }

            toast({
                title: initialData ? "Nave actualizada" : "Nave creada",
                description: "Los cambios se guardaron correctamente.",
                className: "bg-green-500 text-white border-green-600"
            });

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
                    <Label htmlFor="type">Tipo Nave</Label>
                    <Select onValueChange={(val) => setValue('type', val as any)} defaultValue={selectedType}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecciona tipo" />
                        </SelectTrigger>
                        <SelectContent>
                            {VesselTypeEnum.options.map((opt) => (
                                <SelectItem key={opt} value={opt}>
                                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.type && <p className="text-red-500 text-xs">{errors.type.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="name">Nombre Nave</Label>
                    <Input id="name" placeholder="Lancha 1, Barcaza X..." {...register('name')} />
                    {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
                </div>
            </div>



            <div className="space-y-2">
                <Label htmlFor="capacity">Capacidad Pasajeros</Label>
                <Input type="number" id="capacity" min="0" {...register('capacity')} />
                {errors.capacity && <p className="text-red-500 text-xs">{errors.capacity.message}</p>}
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => onSuccess()}>Cancelar</Button>
                <Button type="submit" disabled={loading}>
                    {loading ? 'Guardando...' : (initialData ? 'Actualizar' : 'Guardar Nave')}
                </Button>
            </div>
        </form >
    );
}
