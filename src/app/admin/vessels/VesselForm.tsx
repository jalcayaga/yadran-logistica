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
import {
    Ship,
    Anchor,
    Users,
    Hash,
    AlertCircle,
    CheckCircle2,
    Loader2
} from 'lucide-react';

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
            type: 'other',
            capacity: 0,
            registration_number: '',
            vessel_class: 'LANCHA MOTOR',
            call_sign: '',
            operator_name: 'Yadran Quellon',
            registration_port: '',
            nationality: 'CHILENA',
        }
    });

    const selectedType = watch('type');

    const onSubmit = async (data: VesselFormData) => {
        setLoading(true);
        setGlobalError('');

        try {
            const isEdit = initialData && initialData.id;
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
                className: "bg-green-600 text-white border-green-700 shadow-xl"
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {globalError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    {globalError}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="type" className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                        <Anchor className="w-3 h-3" /> Tipo de Embarcación
                    </Label>
                    <Select onValueChange={(val) => setValue('type', val as any)} defaultValue={selectedType}>
                        <SelectTrigger className="h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-blue-500/20">
                            <SelectValue placeholder="Selecciona el tipo" />
                        </SelectTrigger>
                        <SelectContent>
                            {VesselTypeEnum.options.map((opt) => (
                                <SelectItem key={opt} value={opt} className="capitalize py-3">
                                    {opt}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.type && <p className="text-red-500 text-[10px] font-bold">{errors.type.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                        <Ship className="w-3 h-3" /> Nombre de la Nave
                    </Label>
                    <Input
                        id="name"
                        placeholder="Ej: Blue Whale, Doña Mayte..."
                        className="h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-blue-500/20"
                        {...register('name')}
                    />
                    {errors.name && <p className="text-red-500 text-[10px] font-bold">{errors.name.message}</p>}
                </div>

                <div className="space-y-2 text-normal">
                    <Label htmlFor="registration_number" className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                        <Hash className="w-3 h-3" /> Matrícula (Opcional)
                    </Label>
                    <Input
                        id="registration_number"
                        placeholder="Ej: VAL-1234..."
                        className="h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-blue-500/20 font-mono uppercase"
                        {...register('registration_number')}
                    />
                    {errors.registration_number && <p className="text-red-500 text-[10px] font-bold">{errors.registration_number.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="capacity" className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                        <Users className="w-3 h-3" /> Capacidad Pasajeros
                    </Label>
                    <div className="relative">
                        <Input
                            type="number"
                            id="capacity"
                            min="0"
                            className="h-11 pl-4 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-blue-500/20 pr-10"
                            {...register('capacity')}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">pax</span>
                    </div>
                    {errors.capacity && <p className="text-red-500 text-[10px] font-bold">{errors.capacity.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="vessel_class" className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                        <Ship className="w-3 h-3" /> Clase de Nave
                    </Label>
                    <Input
                        id="vessel_class"
                        placeholder="Ej: LANCHA MOTOR, BARCAZA..."
                        className="h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-blue-500/20 uppercase"
                        {...register('vessel_class')}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="call_sign" className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                        <Hash className="w-3 h-3" /> Distintivo de Llamada
                    </Label>
                    <Input
                        id="call_sign"
                        placeholder="Ej: CB 1234..."
                        className="h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-blue-500/20 uppercase"
                        {...register('call_sign')}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="operator_name" className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                        <Users className="w-3 h-3" /> Armador / Operador
                    </Label>
                    <Input
                        id="operator_name"
                        placeholder="Nombre del Armador..."
                        className="h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-blue-500/20"
                        {...register('operator_name')}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="registration_port" className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                        <Anchor className="w-3 h-3" /> Puerto de Matrícula
                    </Label>
                    <Input
                        id="registration_port"
                        placeholder="Ej: CHACABUCO, QUINTERO..."
                        className="h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-blue-500/20 uppercase"
                        {...register('registration_port')}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="nationality" className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                        <Ship className="w-3 h-3" /> Nacionalidad
                    </Label>
                    <Input
                        id="nationality"
                        placeholder="CHILENA"
                        className="h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-blue-500/20 uppercase"
                        {...register('nationality')}
                    />
                </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onSuccess()}
                    className="hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                    Cancelar
                </Button>
                <Button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 shadow-lg shadow-blue-500/20 min-w-[140px]"
                >
                    {loading ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Guardando...</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{initialData ? 'Actualizar Nave' : 'Registrar Nave'}</span>
                        </div>
                    )}
                </Button>
            </div>
        </form>
    );
}
