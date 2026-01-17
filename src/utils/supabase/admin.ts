import { createClient } from '@supabase/supabase-js'

/**
 * Truly isolated admin client that bypasses RLS by using the SERVICE_ROLE_KEY.
 * Use ONLY for server-side system tasks.
 */
export function createAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceRoleKey) {
        console.error('❌ Supabase Admin Error: Required env variables (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) are missing!')
        throw new Error('Missing Supabase Service Role environment variables')
    }

    // Debug (safe)
    console.log(`📡 Using Admin Client with URL: ${supabaseUrl.substring(0, 20)}... Key exists: ${!!supabaseServiceRoleKey}`);

    return createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
}
