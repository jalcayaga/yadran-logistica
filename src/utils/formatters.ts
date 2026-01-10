import { format } from "date-fns";
import { es } from "date-fns/locale";

export function normalizeRut(rut: string): string {
    // Remove dots and make uppercase
    let clean = rut.replace(/\./g, '').toUpperCase();
    // Ensure hyphen
    if (clean.length > 1 && !clean.includes('-')) {
        const dv = clean.slice(-1);
        const body = clean.slice(0, -1);
        clean = `${body}-${dv}`;
    }
    return clean;
}

export const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

export const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return '-';
    return format(new Date(date), "dd/MM/yyyy", { locale: es });
};

export const formatDateTime = (date: string | Date | null | undefined) => {
    if (!date) return '-';
    return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: es });
};

export const formatTime = (date: string | Date | null | undefined) => {
    if (!date) return '-';
    return format(new Date(date), "HH:mm", { locale: es });
};

export const formatPercent = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
        style: 'percent',
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
    }).format(amount);
};


export const translateLocationType = (type: string) => {
    const map: Record<string, string> = {
        'port': 'Puerto',
        'center': 'Centro',
        'farm': 'Centro de Cultivo',
        'plant': 'Planta',
        'office': 'Oficina'
    };
    return map[type.toLowerCase()] || type;
};
