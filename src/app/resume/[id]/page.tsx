import { createServerClient } from '@/lib/supabase-server';
import { ClientResumeViewer } from '@/components/ClientResumeViewer';
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';

interface Props { params: Promise<{ id: string }> }
export const dynamic = 'force-dynamic';
export const revalidate = 0;
// Static, generic metadata: never look up or expose a student's name before authorization.
export const metadata: Metadata = {
  title: 'Private resume | FirstCareerSteps',
  robots: { index: false, follow: false, noarchive: true },
};

export default async function ResumeViewPage({ params }: Props) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect('/login');
  if (user.app_metadata?.deletion_in_progress) redirect('/dashboard/settings');
  // Owner-scoped cookie client, never an admin client or a public share token.
  const { data: resume, error } = await supabase.from('resumes')
    .select('title, status').eq('id', id).eq('user_id', user.id).eq('status', 'paid').maybeSingle();
  if (error || !resume) notFound();
  const [personResult, profileResult, experienceResult, certificationResult] = await Promise.all([
    supabase.from('users').select('full_name, email, linkedin_link').eq('id', user.id).single(),
    supabase.from('profile').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('experiences').select('*').eq('user_id', user.id).order('start_date', { ascending: false }),
    supabase.from('certifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
  ]);
  if (personResult.error || profileResult.error || experienceResult.error || certificationResult.error) notFound();
  const person = personResult.data;
  const profile = profileResult.data;
  return <div className="min-h-screen bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
    <p className="mb-6 text-center text-sm text-gray-600">Private preview. Only your signed-in account can open this page. You choose who receives a downloaded copy.</p>
    <ClientResumeViewer
      fullName={person?.full_name || ''} email={person?.email || ''}
      phone={profile?.phone || ''} location={profile?.location || ''}
      linkedin={person?.linkedin_link || ''} headline={profile?.headline || ''}
      aboutText={profile?.about_text || ''} highSchool={profile?.high_school || ''}
      graduationYear={profile?.graduation_year || ''} skills={profile?.skills || []}
      experiences={(experienceResult.data || []).map(exp => ({
        type: exp.type || '', title: exp.title || '', organization: exp.organization || '',
        description: exp.bullets?.join('\n') || '', startDate: exp.start_date || '',
        endDate: exp.end_date || '', location: exp.location || '', isCurrent: exp.is_current || false,
      }))}
      certifications={(certificationResult.data || []).map(cert => ({ name: cert.name, issuer: cert.issuer || '', dateIssued: cert.date_issued || '' }))}
      isPaid={resume.status === 'paid'} title={resume.title || 'Resume'}
    />
  </div>;
}
