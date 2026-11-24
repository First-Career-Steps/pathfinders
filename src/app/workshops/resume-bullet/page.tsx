import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FreeBulletLesson from '@/components/workshop/FreeBulletLesson';
import { createServerClient } from '@/lib/supabase-server';
import { offerState } from '@/lib/workshop-commerce';
import { hasWorkshop, WORKSHOP, WORKSHOP_NAME, workshopLogin, workshopSignup } from '@/lib/workshop';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: WORKSHOP_NAME + ' | First Career Steps', description: 'Try a free resume exercise. In the $4.99 student workshop, draft a bullet from your own experience and practice explaining it in an interview.' };

export default async function WorkshopPage({ searchParams }: { searchParams: Promise<{ enrollment?:string }> }) {
    const client = await createServerClient();
    const [{data:{user}}, params] = await Promise.all([client.auth.getUser(),searchParams]);
    const enrolled = hasWorkshop(user?.app_metadata);
    const state = enrolled ? 'enrolled' : await offerState();
    return <><Header/><main>
        <section className="bg-gradient-hero"><div className="max-w-5xl mx-auto px-5 py-12 sm:py-16">
            <p className="font-semibold text-career-blue-dark mb-3">Student workshop · About 20 minutes</p>
            <h1 className="text-4xl sm:text-5xl font-bold max-w-3xl">{WORKSHOP_NAME}</h1>
            <p className="mt-4 max-w-2xl text-lg">Use AI to turn one thing you did at school, at work, or as a volunteer into a resume bullet. Leave with an answer to “What did you personally do?”</p>
            <div className="mt-6 flex gap-5 flex-wrap items-center"><a href="#free-example" className="btn-primary">Try the free example</a>
            <a href={enrolled ? WORKSHOP+'/learn' : '#enroll'} className="font-semibold text-career-blue-dark underline">{enrolled?'Open my workshop':'See the full workshop'}</a></div>
        </div></section>
        <div className="max-w-4xl mx-auto px-5 py-10 space-y-8">
            <section id="free-example" className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-8"><h2 className="text-2xl mb-4">Free example: Can you defend “led”?</h2><FreeBulletLesson/></section>
            <section id="enroll" className="rounded-2xl bg-soft-sky p-5 sm:p-8"><h2 className="text-2xl">Practice with your own experience</h2>
            <ol className="list-decimal pl-6 my-4 space-y-1"><li>Turn your own factual notes into a first draft, with optional AI help.</li><li>Check the wording against what you personally did and revise it.</li><li>Rehearse an interview answer, then take the bullet into your resume builder.</li></ol>
            <p className="font-semibold">$4.99 once · Individual access</p><p className="text-sm mt-1">The workshop includes a downloadable practice sheet. Resume PDF downloads are a separate $1.99/year subscription.</p>
            <div className="mt-5">{enrolled ? <Link className="btn-primary inline-block" href={WORKSHOP+'/learn'}>Open my workshop</Link> :
                state==='open' ? (user ? <form action="/api/workshops/resume-bullet/checkout" method="post"><button className="btn-primary">Enroll for $4.99</button></form> :
                    <div className="flex gap-4 flex-wrap items-center"><Link className="btn-primary" href={workshopSignup}>Create an account to enroll</Link><Link className="underline" href={workshopLogin}>Already have an account? Sign in</Link></div>) :
                <p role="status">{state==='closed'?'Enrollment for the first 10 students is closed. The free exercise is still open.':state==='unavailable'?'Checkout is temporarily unavailable. Please try again later.':'Paid enrollment opens soon. The free exercise is ready to try.'}</p>}</div>
            {params.enrollment==='unavailable' && state==='open' && <p role="alert">Checkout could not open. Please try again.</p>}
            </section>
        </div></main><Footer/></>;
}
