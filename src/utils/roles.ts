import { type SupabaseClient } from '@supabase/supabase-js';

export type AppRole = 'sysadmin' | 'manager' | 'operator';

export const ROLES = {
    SYSADMIN: 'sysadmin' as AppRole,
    MANAGER: 'manager' as AppRole,
    OPERATOR: 'operator' as AppRole,
};

export async function getUserRole(supabase: SupabaseClient): Promise<AppRole | null> {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        console.log("DEBUG: getUserRole - No Auth User", authError);
        return null;
    }

    // OPTIMIZATION: Check metadata first (synced by trigger)
    const metadataRole = user.app_metadata?.role;
    if (metadataRole) {
        return metadataRole as AppRole;
    }

    // Fallback: Query database
    const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

    if (error) {
        console.log("DEBUG: getUserRole - DB Error for user", user.id, error);
        return null;
    }
    if (!data) {
        console.log("DEBUG: getUserRole - No data found for user", user.id);
        return null;
    }

    return data.role as AppRole;
}
