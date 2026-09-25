import { createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase';

export interface AdminUser {
    id: string;
    email: string;
    role: string;
}

/**
 * Get the current request user if they are an admin. Use in API routes under /api/admin/*.
 * Returns null if not authenticated or not admin (caller should return 401/403).
 */
export async function getAdminUser(): Promise<AdminUser | null> {
    const supabase = await createServerClient();
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || user.app_metadata?.deletion_in_progress) return null;

    const adminClient = createAdminClient();
    const { data: row, error: dbError } = await adminClient
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    if (dbError || !row || row.role !== 'admin') return null;

    return {
        id: user.id,
        email: user.email ?? '',
        role: row.role,
    };
}
