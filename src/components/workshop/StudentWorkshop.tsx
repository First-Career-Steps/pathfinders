'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkWriting, draftKey, emptyDraft, type WorkshopDraft } from '@/lib/workshop';
import Link from 'next/link';

const transfer = [
    ['Trained the robotics team and secured first place.', 'Who did the training? Who won? The notes give neither of those facts.'],
    ['Labeled parts bins and showed two new members where to find tools.', 'You kept the concrete actions and the supported count.'],
    ['Improved team efficiency by reorganizing the entire workshop.', 'The notes describe labeling bins. They give no measured improvement or shop-wide responsibility.'],
];
const section = 'rounded-2xl border border-gray-200 bg-white p-5 sm:p-7 space-y-4';
type Saved = WorkshopDraft & { passed: boolean; reviewed: string; finished: boolean };
const initial: Saved = { ...emptyDraft, passed:false, reviewed:'', finished:false };

export default function StudentWorkshop({ userId, learnerName }: { userId: string; learnerName: string }) {
    const router = useRouter();
    const [work,setWork] = useState<Saved>(initial);
    const [loaded,setLoaded] = useState(false);
    const [choice,setChoice] = useState<number | null>(null);
    const [feedback,setFeedback] = useState('');
    const [responseFor,setResponseFor] = useState<'draft'|'review'>('draft');
    const [busy,setBusy] = useState(false);
    const [notice,setNotice] = useState('');
    const [storageWarning,setStorageWarning] = useState(false);
    const [riskAccepted,setRiskAccepted] = useState(false);
    const key = draftKey(userId);
    useEffect(()=>{
        try {
            const saved = JSON.parse(sessionStorage.getItem(key) || 'null');
            if (saved && ['facts','bullet','answer','reviewed'].every(k=>typeof saved[k]==='string')) {
                setWork(saved); if (saved.passed) setChoice(1);
            }
        } catch { setStorageWarning(true); }
        setLoaded(true);
    },[key]);
    useEffect(()=>{
        if (loaded) try { sessionStorage.setItem(key,JSON.stringify(work)); } catch { setStorageWarning(true); }
    },[work,key,loaded]);
    function edit(field: keyof WorkshopDraft, value: string) {
        setWork(w=>({...w,[field]:value,finished:false,reviewed:''}));
        setRiskAccepted(false); setFeedback(''); setNotice('');
    }
    const allWritten = Boolean(work.facts.trim() && work.bullet.trim() && work.answer.trim());
    const concerns = checkWriting(work);
    async function coach(task: 'draft'|'review') {
        setResponseFor(task);setBusy(true);setFeedback('');setNotice('');
        try {
            const result = await fetch('/api/workshops/resume-bullet/coach',{method:'POST',headers:{'Content-Type':'application/json'},
                body:JSON.stringify({task,facts:work.facts,bullet:work.bullet,answer:work.answer})});
            const data = await result.json();
            if (!result.ok || typeof data.text !== 'string') throw new Error();
            setFeedback(data.text);
        } catch {setNotice('AI feedback is unavailable right now. You can keep working with the examples and the writing check below.');}
        finally {setBusy(false);}
    }
    function runCheck() {
        setFeedback('');setNotice('');
        setWork(w=>({...w,reviewed:JSON.stringify([w.facts,w.bullet,w.answer]),finished:false}));
        setRiskAccepted(false);
    }
    function download() {
        const body = ['My interview practice sheet','Original notes',work.facts,'My resume bullet',work.bullet,'What did you personally do?',work.answer,
            'After one week','Did you put the bullet on your resume? Which detail did you change after checking your notes?'].join('\n\n');
        const url = URL.createObjectURL(new Blob([body],{type:'text/plain;charset=utf-8'}));
        const link = document.createElement('a');link.href=url;link.download='my-resume-workshop.txt';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    }
    function toBuilder() {
        try {sessionStorage.setItem(key+'.transfer',work.bullet);router.push('/builder/step-4?from=workshop');}
        catch {setNotice('Your browser could not transfer this draft. Download the practice sheet and paste your bullet into an experience.');}
    }
    function suggestion(task: 'draft'|'review') {
        if (responseFor !== task) return null;
        return <div role="status">
            {busy && <p>Reading your writing…</p>}
            {feedback && <div className="rounded-xl bg-soft-sky p-4">
                <h3 className="font-semibold">AI suggestion</h3><p className="whitespace-pre-line">{feedback}</p>
                {task === 'draft' && <button type="button" className="underline mt-2" onClick={()=>edit('bullet',feedback)}>Use this wording in my draft</button>}
            </div>}
        </div>;
    }
    return <div className="space-y-6">
        <p className="text-sm text-gray-600">{storageWarning?'Your browser could not save this draft. Download your work before leaving.':'Your writing stays in this browser tab while you work. Download a copy before closing it.'}</p>
        <section className={section}><h2 className="text-2xl">1. Find the claim you can support</h2>
            <p>Your notes say, “At robotics club I labeled the parts bins and showed two new members where to find tools.” Which line could you explain to an interviewer?</p>
            <fieldset className="space-y-2"><legend className="sr-only">Choose a supported bullet</legend>{transfer.map(([label], i)=>
                <label key={label} className="block p-3 bg-gray-50 rounded-lg"><input type="radio" className="mr-2" name="practice" checked={choice===i} onChange={()=>{setChoice(i);setWork(w=>({...w,passed:i===1,finished:false}));}}/>{label}</label>)}</fieldset>
            <p role="status">{choice!==null && transfer[choice][1]}</p></section>
        <section className={section}><h2 className="text-2xl">2. Write one bullet from your own notes</h2>
            <p>Pick a project, volunteer shift, job, or responsibility at home. Write what your hands actually did, who it was for, and one detail you remember. A number is optional.</p>
            <label className="block font-semibold">My factual notes<textarea disabled={busy} className="input-base mt-1" rows={3} maxLength={1600} value={work.facts} onChange={e=>edit('facts',e.target.value)} placeholder="I sorted donated coats by size and helped families find the right rack."/></label>
            <p className="text-sm text-gray-600">The optional AI buttons send your notes and relevant writing to OpenAI. Leave out names and contact details. <Link href="/privacy" className="underline">Privacy policy</Link></p>
            <button className="btn-secondary disabled:opacity-60" disabled={busy || !work.facts.trim()} onClick={()=>coach('draft')}>Suggest a bullet with AI</button>{suggestion('draft')}
            <p>Start with your action. Add the object and one detail you can defend. For example, “Sorted donated coats by size and helped families find their section.”</p>
            <label className="block font-semibold">My resume bullet<textarea disabled={busy} className="input-base mt-1" rows={2} maxLength={400} value={work.bullet} onChange={e=>edit('bullet',e.target.value)}/></label>
        </section>
        <section className={section}><h2 className="text-2xl">3. Answer the interviewer</h2>
            <p>“Walk me through that. What did you personally do?” Say your answer aloud. Tell the listener what was happening, what you did, and what you saw next. If someone else led, give them that credit.</p>
            <label className="block font-semibold">My 30-second answer<textarea disabled={busy} className="input-base mt-1" rows={4} maxLength={1200} value={work.answer} onChange={e=>edit('answer',e.target.value)} placeholder="Families were looking through mixed racks. I sorted the coats by size. When people arrived, I showed them where to start."/></label>
            <div className="flex flex-wrap gap-3"><button disabled={busy||!allWritten} className="btn-secondary disabled:opacity-60" onClick={()=>coach('review')}>Ask AI to critique my writing</button>
            <button disabled={busy||!allWritten} className="btn-primary disabled:opacity-60" onClick={runCheck}>Check my final draft</button></div>{suggestion('review')}
        </section>
        {notice && <p role="alert" className="bg-orange-50 rounded-xl p-4">{notice}</p>}
        {work.reviewed && <section className={section}><h2 className="text-2xl">Review your evidence</h2>
            {concerns.length ? <ul className="list-disc pl-5">{concerns.map(c=><li key={c}>{c}</li>)}</ul> : <p>The basic writing check found no flags for new numeric figures, leadership verbs, or first-person phrasing. Compare each claim with the original notes yourself.</p>}
            <blockquote className="border-l-4 border-career-blue pl-4">{work.bullet}</blockquote>
            <label className="block"><input type="checkbox" checked={riskAccepted||work.finished} onChange={e=>{setRiskAccepted(e.target.checked);if(!e.target.checked)setWork(w=>({...w,finished:false}));}}/> I checked the details against my experience and can explain every claim.</label>
            {!work.passed && <p>Complete the robotics example above to finish.</p>}
            {!work.finished && <button disabled={!work.passed||!riskAccepted} className="btn-primary disabled:opacity-60" onClick={()=>setWork(w=>({...w,finished:true}))}>Finish my workshop</button>}
        </section>}
        {work.finished && <section className="p-6 rounded-2xl bg-green-50 space-y-4"><h2 className="text-2xl">Your bullet is ready to use</h2>
            <p>Take the bullet into a new experience in your builder, or download the bullet and interview answer together. You can edit the experience before saving it.</p>
            <div className="flex flex-wrap gap-3"><button onClick={toBuilder} className="btn-primary">Use this bullet in my resume</button><button className="btn-secondary" onClick={download}>Download my practice sheet</button>
            <button className="btn-secondary" onClick={()=>window.print()}>Print completion certificate</button></div>
            <div id="workshop-certificate" className="hidden"><p>First Career Steps</p><h1>Certificate of completion</h1>
            <h2>{learnerName}</h2><p>Completed the student workshop <strong>Write a resume bullet you can defend</strong>.</p>
            <p>Practiced checking an AI draft, writing an evidence-based resume bullet, and explaining it in an interview.</p><p>No CPE offered.</p></div>
            <p className="text-sm">In one week, check whether this bullet made it onto your resume and practice saying the answer once more.</p></section>}
    </div>;
}
