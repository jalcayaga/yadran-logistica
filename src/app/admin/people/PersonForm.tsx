'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { personSchema, type Person } from '@/utils/zod_schemas';
import { Button } from '@/components/ui/button';
import { normalizeRut, normalizePhone } from '@/utils/formatters';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { z } from 'zod';

// Use z.input to handle fields with defaults (like active) correctly
type PersonFormData = z.input<typeof personSchema>;

interface PersonFormProps {
    onSuccess: () => void;
    initialData?: Person;
}

export default function PersonForm({ onSuccess, initialData }: PersonFormProps) {
    const [loading, setLoading] = useState(false);
    const [globalError, setGlobalError] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset
    } = useForm<PersonFormData>({
        resolver: zodResolver(personSchema),
        defaultValues: initialData || {
            active: true,
            first_name: '',
            last_name: '',
            rut_normalized: '',
            rut_display: '',
            company: '',
            job_title: '',
            phone_e164: '',
        }
    });

    const onSubmit = async (data: PersonFormData) => {
        setLoading(true);
        setGlobalError('');

        // Enforce normalization
        const cleanData = {
            ...data,
            rut_normalized: normalizeRut(data.rut_normalized),
            phone_e164: normalizePhone(data.phone_e164 || '')
        };

        try {
            const url = initialData ? `/api/people/${initialData.id}` : '/api/people';
            const method = initialData ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cleanData),
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
                    <Label htmlFor="rut_normalized">RUT (sin puntos)</Label>
                    <Input id="rut_normalized" placeholder="12345678-9" {...register('rut_normalized')} />
                    {errors.rut_normalized && <p className="text-red-500 text-xs">{errors.rut_normalized.message}</p>}
                    <p className="text-[10px] text-muted-foreground">Se normalizará automáticamente</p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="rut_display">RUT Visual</Label>
                    <Input id="rut_display" placeholder="12.345.678-9" {...register('rut_display')} />
                    {errors.rut_display && <p className="text-red-500 text-xs">{errors.rut_display.message}</p>}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="first_name">Nombres</Label>
                    <Input id="first_name" placeholder="Juan Andrés" {...register('first_name')} />
                    {errors.first_name && <p className="text-red-500 text-xs">{errors.first_name.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="last_name">Apellidos</Label>
                    <Input id="last_name" placeholder="Pérez Cotapos" {...register('last_name')} />
                    {errors.last_name && <p className="text-red-500 text-xs">{errors.last_name.message}</p>}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="company">Empresa</Label>
                    <Input id="company" placeholder="Yadran, Contratista..." {...register('company')} />
                    {errors.company && <p className="text-red-500 text-xs">{errors.company.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="job_title">Cargo</Label>
                    <Input id="job_title" placeholder="Operario, Gerente..." {...register('job_title')} />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="phone_e164">Celular (WhatsApp)</Label>
                <Input id="phone_e164" placeholder="+56912345678" {...register('phone_e164')} />
                {errors.phone_e164 && <p className="text-red-500 text-xs">{errors.phone_e164.message}</p>}
                <p className="text-[10px] text-muted-foreground">Opcional. Se formateará automáticamente (ej: 912345678)</p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => onSuccess()}>Cancelar</Button>
                <Button type="submit" disabled={loading}>
                    {loading ? 'Guardando...' : (initialData ? 'Actualizar' : 'Guardar Pasajero')}
                </Button>
            </div>
        </form>
    );
}
