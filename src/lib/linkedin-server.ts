import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase';

export async function ownedLinkedInResume(resumeId: unknown, clients = { createServerClient, createAdminClient }) {
    const auth = await clients.createServerClient();
    const { data: { user }, error: authError } = await auth.auth.getUser();
    if (authError || !user) return { error: NextResponse.json({ error: 'Please sign in to access your LinkedIn content.' }, { status: 401 }) };
    if (typeof resumeId !== 'string' || !/^[0-9a-f-]{36}$/i.test(resumeId)) return { error: NextResponse.json({ error: 'Invalid resume.' }, { status: 400 }) };
    const db = clients.createAdminClient();
    // The service client bypasses RLS, so always filter by the verified owner.
    const { data: resume, error } = await db.from('resumes')
        .select('id, user_id, status, linkedin_content')
        .eq('id', resumeId).eq('user_id', user.id).maybeSingle();
    if (error) return { error: NextResponse.json({ error: 'Unable to load your resume. Please try again.' }, { status: 503 }) };
    if (!resume) return { error: NextResponse.json({ error: 'Resume not found.' }, { status: 404 }) };
    return { db, user, resume };
}
