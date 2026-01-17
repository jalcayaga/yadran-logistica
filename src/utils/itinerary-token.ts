import { createAdminClient } from '@/utils/supabase/admin';
import { v4 as uuidv4 } from 'uuid';

export async function getOrCreateItineraryToken(itineraryId: string, itineraryDate: string, itineraryTime: string): Promise<string | null> {
    const supabase = createAdminClient();

    // Check if share exists
    const { data: existingShare } = await supabase
        .from('itinerary_shares')
        .select('token')
        .eq('itinerary_id', itineraryId)
        .single();

    if (existingShare?.token) {
        return existingShare.token;
    }

    // Calculate expiration
    const tripDateStr = itineraryDate;
    const tripTimeStr = itineraryTime || "00:00";
    const tripStart = new Date(`${tripDateStr}T${tripTimeStr}:00`);
    const baseDate = isNaN(tripStart.getTime()) ? new Date() : tripStart;
    const expirationDate = new Date(baseDate.getTime() + 24 * 60 * 60 * 1000);

    // Use the security definer function to generate/get token safely in ONE step
    const { data: newToken, error: rpcError } = await supabase
        .rpc('generate_share_token', {
            p_itinerary_id: itineraryId,
            p_expires_at: expirationDate.toISOString()
        });

    if (rpcError || !newToken) {
        console.error("Error generating itinerary token via RPC:", rpcError);
        return null;
    }

    return newToken;
}
