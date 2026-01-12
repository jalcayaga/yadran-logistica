'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { personSchema, type Person } from '@/utils/zod_schemas';
import { Button } from '@/components/ui/button';
import { normalizeRut, normalizePhone, formatRut } from '@/utils/formatters';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
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
    const { toast } = useToast();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch
    } = useForm<PersonFormData>({
        resolver: zodResolver(personSchema),
        defaultValues: initialData ? {
            ...initialData,
            rut_normalized: formatRut(initialData.rut_normalized) // Display formatted initially
        } : {
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

        // Prepare data for API:
        // 1. Valid normalized RUT for unique constraint
        // 2. Formatted display RUT
        // 3. Normalized Phone
        const cleanData = {
            ...data,
            rut_normalized: normalizeRut(data.rut_normalized),
            rut_display: formatRut(data.rut_normalized),
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

            toast({
                title: initialData ? "Pasajero actualizado" : "Pasajero creado",
                description: "Los cambios se guardaron correctamente.",
                className: "bg-green-500 text-white border-green-600"
            });

            reset();
            onSuccess();
        } catch (err: any) {
            if (err.message.includes('people_rut_normalized_key')) {
                setGlobalError('Este RUT ya está registrado en el sistema.');
            } else {
                setGlobalError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {globalError && <div className="text-red-500 text-sm font-bold">{globalError}</div>}

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2 md:col-span-1">
                    <Label htmlFor="rut_normalized">RUT</Label>
                    <Input
                        id="rut_normalized"
                        placeholder="12.345.678-K"
                        {...register('rut_normalized')}
                        onChange={(e) => {
                            // Auto-format as user types
                            const formatted = formatRut(e.target.value);
                            setValue('rut_normalized', formatted);
                        }}
                    />
                    {errors.rut_normalized && <p className="text-red-500 text-xs">{errors.rut_normalized.message}</p>}
                    <p className="text-[10px] text-muted-foreground">Formato automático (ej: 12.345.678-K)</p>
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
