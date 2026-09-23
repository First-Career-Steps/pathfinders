import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'First Resume Workshop for Students | FirstCareerSteps',
  description: 'A practical first-resume lesson for students with no paid work experience. Turn projects, volunteering and school activities into an honest resume.',
  alternates: { canonical: '/for-educators' },
};

export default function ForEducators() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="mx-auto max-w-4xl px-5 py-12 sm:py-16">
        <p className="font-semibold text-career-blue">For counselors, teachers and families</p>
        <h1 className="mt-3 font-poppins text-4xl font-bold leading-tight text-charcoal sm:text-5xl">Help a student write their first resume.</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-charcoal-light">No paid job yet? Start with what they have already done: a class project, a club, volunteering, caring for others or helping a local business.</p>
        <div className="mt-7 rounded-2xl bg-soft-sky/40 p-5">
          <p className="font-semibold text-charcoal">Try the builder and preview free. PDF downloads cost $1.99 per student per year, billed annually.</p>
          <p className="mt-2 text-sm text-charcoal-light">Each student has their own account. Plan how downloads will be paid for before a group session. LinkedIn setup is optional.</p>
          <Link href="/signup?utm_source=educator&utm_medium=workshop&utm_campaign=first_resume" className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-career-blue px-5 py-3 font-semibold text-white hover:bg-career-blue-dark">Try the student experience</Link>
        </div>
        <section className="mt-12" aria-labelledby="lesson-title">
          <h2 id="lesson-title" className="font-poppins text-2xl font-semibold text-charcoal">A suggested 40-minute lesson</h2>
          <p className="mt-2 text-charcoal-light">Adjust the timing for your group. The goal is a truthful resume draft the student understands and can explain.</p>
          <ol className="mt-6 space-y-5">
            {[
              ['5 minutes: find the experience', 'Ask students to list three things they have helped make, organize, solve or care for. A paid job is not required.'],
              ['10 minutes: make it specific', 'For one activity, write what they did, who it helped and what changed. Include numbers only when they know them.'],
              ['15 minutes: build and review', 'Use the guided builder. Review every suggestion together: dates, spelling, contact details and achievements should all be accurate.'],
              ['10 minutes: use the resume', 'Preview the result and discuss one suitable job. Download if ready. Older students can follow the optional LinkedIn guide in their resume dashboard.'],
            ].map(([title, body]) => <li key={title} className="border-l-4 border-career-blue/30 pl-5"><h3 className="font-semibold text-charcoal">{title}</h3><p className="mt-1 leading-relaxed text-charcoal-light">{body}</p></li>)}
          </ol>
        </section>
        <section className="mt-12 rounded-2xl border border-gray-200 p-6">
          <h2 className="font-poppins text-2xl font-semibold text-charcoal">An example without job experience</h2>
          <p className="mt-4 text-charcoal-light"><strong className="text-charcoal">Starting point:</strong> “I helped with our school food drive.”</p>
          <p className="mt-3 text-charcoal-light"><strong className="text-charcoal">If these are the actual duties:</strong> “Sorted donated food, organized collection boxes and helped prepare deliveries for the school food drive.”</p>
          <p className="mt-3 text-sm text-charcoal-light">Ask what the student really did before adding details. Do not invent totals, leadership titles or results.</p>
        </section>
        <section className="mt-12">
          <h2 className="font-poppins text-2xl font-semibold text-charcoal">Three questions to review together</h2>
          <ul className="mt-4 list-disc space-y-3 pl-5 text-charcoal-light"><li>Could you explain every line to an employer?</li><li>Can an employer tell what you contributed?</li><li>Are the contact details correct and appropriate to share?</li></ul>
          <p className="mt-5 text-sm text-charcoal-light">Keep students&apos; resumes private unless they choose to share them. LinkedIn generally requires age 16 or older; local requirements may be higher.</p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
