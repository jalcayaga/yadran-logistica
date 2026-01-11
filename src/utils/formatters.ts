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

export function formatRut(rut: string): string {
    // 1. Clean data (remove dots, hyphens)
    let value = rut.replace(/\./g, '').replace(/-/g, '');

    // 2. Get body and dv
    const body = value.slice(0, -1);
    const dv = value.slice(-1).toUpperCase();

    if (value.length <= 1) return value; // Too short to format

    // 3. Format body with dots
    let formattedBody = "";
    for (let i = body.length - 1, j = 1; i >= 0; i--, j++) {
        formattedBody = body.charAt(i) + formattedBody;
        if (j % 3 === 0 && i !== 0) {
            formattedBody = "." + formattedBody;
        }
    }

    // 4. Return formatted
    return `${formattedBody}-${dv}`;
}

export function formatPhone(phone: string | null): string {
    if (!phone) return '-';
    // Clean it first
    const clean = phone.replace(/\D/g, '');

    // Format: 56 9 1234 5678 (Chile Mobile)
    if (clean.length === 11 && clean.startsWith('569')) {
        return `+56 9 ${clean.slice(3, 7)} ${clean.slice(7)}`;
    }

    // Return original with + if looks like a number
    return `+${clean}`;
}

export function normalizePhone(phone: string): string | null {
    if (!phone) return null;

    // Remove non-digits
    let clean = phone.replace(/\D/g, '');

    // If empty after cleaning, return null
    if (!clean) return null;

    // Chile Mobile logic (Start with 9, len 9 -> add 56)
    if (clean.length === 9 && clean.startsWith('9')) {
        return `56${clean}`;
    }

    // Already 569... (len 11) -> Keep
    if (clean.length === 11 && clean.startsWith('569')) {
        return clean;
    }

    // Fallback: If it looks like a number, save it. 
    // Evolution API might fail if not correct, but we don't zero-out valid weird numbers.
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
