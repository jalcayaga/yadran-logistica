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
    message += `🚢 Nave: ${vesselName}\n\n`;

    message += `*Tripulación:*\n`;
    crew.forEach(c => {
        const role = c.role === 'captain' ? 'Capitán' : c.role === 'substitute' ? 'Patrón' : 'Tripulante';
        const name = c.person ? `${c.person.first_name} ${c.person.last_name}` : 'N/A';
        message += `- ${role}: ${name}\n`;
    });

    message += `\n*Pasajeros (${passengers.length}):*\n`;
    passengers.forEach((p, idx) => {
        const name = p.person ? `${p.person.first_name} ${p.person.last_name}` : 'Pasajero';
        const dest = p.destination?.location?.name || 'Destino';
        message += `${idx + 1}. ${name} -> ${dest}\n`;
    });

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
        `Por favor estar 15 minutos antes. ¡Buen viaje!`;

    return getWhatsAppLink(passengerPhone, message);
}
