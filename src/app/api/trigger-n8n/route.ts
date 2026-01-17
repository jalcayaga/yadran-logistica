import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
    const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;

    if (!webhookUrl) {
        return NextResponse.json(
            { error: 'Server configuration error: Webhook URL not found' },
            { status: 500 }
        );
    }

    try {
        const body = await request.json();
        const { createAdminClient } = await import('@/utils/supabase/admin');
        const supabase = createAdminClient();

        // --- 1. Generate/Get Tracking Link (if itinerary exists) ---
        let trackingLink = '';
        if (body.itinerary && body.itinerary.id) {
            const { getOrCreateItineraryToken } = await import('@/utils/itinerary-token');
            const token = await getOrCreateItineraryToken(
                body.itinerary.id,
                body.itinerary.date,
                body.itinerary.start_time || body.itinerary.time
            );

            if (token) {
                // Use the CORRECT public domain (not localhost) for the link
                trackingLink = `https://yadran-logistica.artifact.cl/i/${token}`;
            }
        }

        // --- 2. Inject into Payload ---
        const enhancedBody = {
            ...body,
            tracking_link: trackingLink
        };


        // --- 3. Send to n8n ---
        console.log("🚀 Sending to n8n URL:", webhookUrl);
        console.log("📦 Payload:", JSON.stringify(enhancedBody, null, 2));

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(enhancedBody),
        });

        if (!response.ok) {
            throw new Error(`n8n responded with ${response.status}`);
        }

        // Try to parse JSON response from n8n if possible, or just return success
        const data = await response.text();
        let jsonData = {};
        try {
            jsonData = JSON.parse(data);
        } catch (e) {
            // ignore if not json
        }

        return NextResponse.json({ success: true, data: jsonData });

    } catch (error: any) {
        console.error('Error forwarding to n8n:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to send to n8n' },
            { status: 500 }
        );
    }
}
