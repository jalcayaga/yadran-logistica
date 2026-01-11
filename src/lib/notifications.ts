
import { createClient } from '@/utils/supabase/server';

const WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

type WebhookEvent = 'itinerary_status_change' | 'booking_confirmation';

interface ItineraryChangePayload {
    event: 'itinerary_status_change';
    itinerary: {
        id: string;
        route: string;
        date: string;
        time: string;
        new_status: string;
        vessel_name: string;
    };
    passengers: {
        name: string;
        phone: string;
        booking_id: string;
    }[];
}

interface BookingConfirmationPayload {
    event: 'booking_confirmation';
    booking: {
        id: string;
        passenger_name: string;
        passenger_rut: string;
        passenger_phone: string;
        origin: string;
        destination: string;
        date: string;
        time: string;
        vessel: string;
    };
}

async function sendWebhook(payload: any) {
    if (!WEBHOOK_URL) {
        console.warn("N8N_WEBHOOK_URL is not defined. Skipping webhook dispatch.");
        return;
    }

    try {
        console.log(`Dispatching webhook: ${payload.event}`);
        // Fire and forget - do not await strictly if we don't want to block, 
        // but here we await to catch errors in the server logs easily.
        // In Vercel serverless, we MUST await or the lambda might freeze.
        const res = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            console.error(`Webhook failed: ${res.status} ${res.statusText}`);
        }
    } catch (error) {
        console.error("Error dispatching webhook:", error);
    }
}

export async function notifyItineraryChange(itineraryId: string, newStatus: string) {
    const supabase = await createClient();

    // 1. Fetch Itinerary Details + Vessel
    const { data: itinerary, error: itinError } = await supabase
        .from('itineraries')
        .select(`
            *,
            vessel:vessels(name),
            stops:itinerary_stops(
                stop_order,
                location:locations(name)
            )
        `)
        .eq('id', itineraryId)
        .single();

    if (itinError || !itinerary) {
        console.error("Error fetching itinerary for notification:", itinError);
        return;
    }

    // 2. Fetch Confirmed Bookings + Passengers
    const { data: bookings, error: bookingError } = await supabase
        .from('bookings')
        .select(`
            id,
            passenger:people(first_name, last_name, phone_e164)
        `)
        .eq('itinerary_id', itineraryId)
        .eq('status', 'confirmed');

    if (bookingError) {
        console.error("Error fetching bookings for notification:", bookingError);
        return;
    }

    if (!bookings || bookings.length === 0) {
        console.log("No bookings to notify for itinerary change.");
        return;
    }

    // Determine Route Name (Origin -> Destination)
    const sortedStops = itinerary.stops?.sort((a: any, b: any) => a.stop_order - b.stop_order) || [];
    const originName = sortedStops[0]?.location?.name || 'Origen Desconocido';
    const destName = sortedStops[sortedStops.length - 1]?.location?.name || 'Destino Desconocido';
    const routeName = `${originName} -> ${destName}`;

    // 3. Construct Payload
    const payload: ItineraryChangePayload = {
        event: 'itinerary_status_change',
        itinerary: {
            id: itinerary.id,
            route: routeName,
            date: itinerary.date,
            time: itinerary.start_time,
            new_status: newStatus,
            vessel_name: itinerary.vessel?.name || 'Nave',
        },
        passengers: bookings
            .filter((b: any) => b.passenger?.phone_e164) // Only those with phones
            .map((b: any) => ({
                name: `${b.passenger.first_name} ${b.passenger.last_name}`,
                phone: b.passenger.phone_e164,
                booking_id: b.id,
            })),
    };

    if (payload.passengers.length === 0) {
        console.log("No passengers with phone numbers found.");
        return;
    }

    // 4. Send
    await sendWebhook(payload);
}

export async function notifyBookingConfirmation(bookingId: string) {
    const supabase = await createClient();

    // 1. Fetch Booking Details
    const { data: booking, error } = await supabase
        .from('bookings')
        .select(`
            id,
            status,
            passenger:people(first_name, last_name, rut_display, phone_e164),
            itinerary:itineraries(
                date,
                start_time,
                vessel:vessels(name)
            ),
            origin_stop:itinerary_stops!bookings_origin_stop_id_fkey(
                location:locations(name)
            ),
            destination_stop:itinerary_stops!bookings_destination_stop_id_fkey(
                location:locations(name)
            )
        `)
        .eq('id', bookingId)
        .single();

    if (error || !booking) {
        console.error("Error fetching booking for notification:", error);
        return;
    }

    const b = booking as any;

    // Only notify if passenger has phone
    // Handle both array (if One-to-Many inferred) or object (One-to-One)
    const passenger = Array.isArray(b.passenger) ? b.passenger[0] : b.passenger;
    const phone = passenger?.phone_e164;

    if (!phone) {
        console.log("Passenger has no phone, skipping e-ticket.");
        return;
    }

    // Safely extract names
    const originName = Array.isArray(b.origin_stop?.location) ? b.origin_stop.location[0]?.name : b.origin_stop?.location?.name;
    const destName = Array.isArray(b.destination_stop?.location) ? b.destination_stop.location[0]?.name : b.destination_stop?.location?.name;
    const vesselName = Array.isArray(b.itinerary?.vessel) ? b.itinerary?.vessel[0]?.name : b.itinerary?.vessel?.name;

    // 2. Construct Payload
    const payload: BookingConfirmationPayload = {
        event: 'booking_confirmation',
        booking: {
            id: b.id,
            passenger_name: `${passenger.first_name} ${passenger.last_name}`,
            passenger_rut: passenger.rut_display || '',
            passenger_phone: phone,
            origin: originName || 'Origen',
            destination: destName || 'Destino',
            date: b.itinerary?.date || '',
            time: b.itinerary?.start_time || '',
            vessel: vesselName || 'Nave',
        }
    };

    // 3. Send
    await sendWebhook(payload);
}
