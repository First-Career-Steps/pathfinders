import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase-server';
import Header from '@/components/Header';
import StudentWorkshop from '@/components/workshop/StudentWorkshop';
import { hasWorkshop, WORKSHOP } from '@/lib/workshop';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'My resume workshop | First Career Steps', robots: {index:false,follow:false} };
export default async function Learn() {
    const client = await createServerClient();
    const {data:{user}} = await client.auth.getUser();
    if (!user || !hasWorkshop(user.app_metadata)) redirect(WORKSHOP+'#enroll');
    return <><Header/><main className="max-w-3xl px-5 py-10 mx-auto">
        <Link href={WORKSHOP} className="underline text-career-blue-dark">Workshop overview</Link>
        <h1 className="text-3xl sm:text-4xl mt-4">Your experience, in your own words</h1>
        <p className="mt-2 mb-6">Keep your notes alongside your draft. An interviewer may ask about any word you leave in.</p>
        <StudentWorkshop key={user.id} userId={user.id} learnerName={typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : 'Workshop participant'}/></main></>;
}
