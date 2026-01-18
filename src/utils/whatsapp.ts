import { Itinerary, Person } from './zod_schemas';
import { formatDate } from './formatters';

export function getWhatsAppLink(phone: string, text: string) {
    // Remove non-numeric chars from phone
    const cleanPhone = phone.replace(/\D/g, '');
    const encodedText = encodeURIComponent(text);
    return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

export function getCaptainManifestLink(
    captainPhone: string | undefined,
    itinerary: any, // ItineraryWithRelations
    crew: any[],
    passengers: any[]
) {
    if (!captainPhone) return '';

    const date = formatDate(itinerary.date);
    const time = itinerary.start_time;
    const vesselName = itinerary.vessel?.name || 'Nave';

    let message = `*Manifiesto de Zarpe - Logística Yadran*\n\n`;
    message += `📅 Fecha: ${date} ${time}\n`;
    message += `🚢 Nave: ${vesselName} (Mat: ${itinerary.vessel?.registration_number || '---'})\n\n`;

    message += `*Tripulación:*\n`;
    crew.forEach(c => {
        const role = c.role === 'captain' ? 'Capitán' : c.role === 'substitute' ? 'Patrón' : 'Tripulante';
        const name = c.person ? `${c.person.first_name} ${c.person.last_name}` : 'N/A';
        message += `- ${role}: ${name}\n`;
    });

    message += `\n*Pasajeros:*\n`;
    passengers.forEach((p, idx) => {
        const name = p.person ? `${p.person.first_name} ${p.person.last_name}` : 'Pasajero';
        const dest = p.destination?.location?.name || 'Destino';
        message += `${idx + 1}. ${name} -> ${dest}\n`;
    });

    message += `\n*TOTAL ALMAS A BORDO: ${passengers.length + crew.length}*\n`;
    message += `(Trip: ${crew.length}, Pasajeros: ${passengers.length})`;

    return getWhatsAppLink(captainPhone, message);
}

export function getPassengerNotificationLink(
    passengerPhone: string | undefined,
    passengerName: string,
    itinerary: any,
    booking: any
) {
    if (!passengerPhone) return '';

    const date = formatDate(itinerary.date);
    const time = itinerary.start_time;
    const vesselName = itinerary.vessel?.name || 'la nave asignada';
    const origin = booking.origin?.location?.name || 'Origen';
    const dest = booking.destination?.location?.name || 'Destino';

    const message = `Hola ${passengerName}, recordatorio de tu viaje con Logística Yadran.\n\n` +
        `📅 Fecha: ${date} a las ${time}\n` +
        `🚢 Nave: ${vesselName}\n` +
        `📍 Ruta: ${origin} -> ${dest}\n\n` +
        `Por favor llegar o estar listo 15 min antes. ¡Buen viaje!`;

    return getWhatsAppLink(passengerPhone, message);
}

export const sendItineraryToWebhook = async (itinerary: any, crew: any[], manifestUrl?: string, passengers: any[] = []) => {
    // We send to our own internal API route to avoid CORS issues with n8n
    // The API route will read the env var and forward the request server-side.
    const apiUrl = '/api/trigger-n8n';

    try {
        // Calculate Route string (Origin -> Destination)
        // Assuming stops are ordered.
        const stops = itinerary.stops || [];
        const sortedStops = [...stops].sort((a: any, b: any) => a.stop_order - b.stop_order);
        const fullRoute = sortedStops.map((s: any) => s.location?.name || '---').join(' -> ');

        const payload = {
            event: 'manual_send',
            target: itinerary.target || 'all',
            itinerary: {
                ...itinerary,
                date_formatted: formatDate(itinerary.date),
                vessel_name: itinerary.vessel?.name || 'Nave por asignar',
                route: fullRoute
            },
            crew: crew.map(c => ({
                name: `${c.person.first_name} ${c.person.last_name}`,
                role: c.role,
                phone: c.person.phone_e164,
                confirmation_link: c.confirmation_link
            })),
            passengers: passengers.map(p => ({
                name: p.passenger?.first_name ? `${p.passenger.first_name} ${p.passenger.last_name}` : 'Pasajero',
                phone: p.passenger?.phone_e164 || '',
                role: 'passenger',
                origin: p.origin_stop?.location?.name || '---',
                destination: p.destination_stop?.location?.name || '---',
                confirmation_link: p.confirmation_link
            })),
            manifest_pdf: manifestUrl,
            timestamp: new Date().toISOString()
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Error HTTP: ${response.status}`);
        }

        return { success: true };
    } catch (error: any) {
        console.error("Error sending to webhook:", error);
        return { success: false, error: error.message };
    }
};
