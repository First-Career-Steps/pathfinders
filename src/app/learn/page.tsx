import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = { title:'Courses and assessments | First Career Steps', description:'Find interactive AI workshops, leadership practice cases, assessments and a student resume workshop.' };

const topics = [
    {title:'Working with AI', href:'/learn/ai', intro:'Choose a workshop. Practice with your own example, check what you learned and download your workbook.', links:[
        ['AI Basics for Teams','/learn/ai/basics'], ['Basics of AI and Effective Prompting','/learn/ai/prompting'], ['Brainstorming with AI','/learn/ai/brainstorming'], ['Leveraging Multiple AIs','/learn/ai/multiple-ais'], ['Build and test a feature with AI','/learn/ai/building'], ['Prompt library','/learn/ai/prompts']]},
    {title:'Leadership', href:'/learn/leadership', intro:'Practice decisions from Brenen Morse’s The Little Black Book on Leadership. No CPE Offered.', links:[
        ['Restaurant Leadership and shift simulations','/learn/leadership/restaurant'], ['Lead the Shift · three manager courses and paperback','/learn/leadership/team-training'], ['Leading the Financial Close','/learn/leadership/cpa/leading-the-close'], ['Coaching Accounting Teams','/learn/leadership/cpa/coaching-accounting-teams'], ['Changing Finance Operations','/learn/leadership/cpa/changing-finance-operations'], ['Leadership assessments','/learn/leadership#assessments']]},
];

export default function Catalog() {
    return <><Header/><main className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
        <p className="text-sm font-semibold text-career-blue-dark">First Career Steps</p><h1 className="mt-2 text-4xl sm:text-5xl">Courses and assessments</h1>
        <p className="mt-4 text-lg">Choose a topic or jump straight into a practice case.</p>
        <div className="mt-8 grid md:grid-cols-2 gap-5">{topics.map(topic=><section key={topic.title} className="rounded-2xl border border-slate-200 p-6 sm:p-8">
            <h2 className="text-2xl"><a href={topic.href}>{topic.title}</a></h2><p className="mt-3 text-slate-700">{topic.intro}</p>
            <ul className="mt-5 space-y-3">{topic.links.map(([title,href])=><li key={href}><a className="underline text-career-blue-dark underline-offset-4" href={href}>{title}</a></li>)}</ul>
        </section>)}</div>
        <section className="mt-8 rounded-2xl bg-soft-sky p-6"><h2 className="text-2xl">Resume and interview practice</h2><p className="mt-2">Turn one experience into a bullet you can explain in an interview.</p>
        <div className="mt-3 flex flex-wrap gap-5 text-career-blue-dark font-semibold underline"><a href="/workshops/resume-bullet">Try the student workshop</a><a href="/resume-builder">Open the Resume Builder</a></div></section>
    </main><Footer/></>;
}
