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
