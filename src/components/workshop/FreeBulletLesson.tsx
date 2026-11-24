'use client';
import { useState } from 'react';
import Link from 'next/link';
import { WORKSHOP } from '@/lib/workshop';

const choices = [
    ['Use the AI draft as written.', '“Led” says you ran the fundraisers. The notes only say you checked people in.'],
    ['Replace “led” with the action I actually did.', 'Exactly. “Checked in guests at two school fundraisers” is specific, accurate, and easy to explain.'],
    ['Add a guest count to make it more specific.', 'Two events is supported. A guest count would need its own evidence.'],
];

export default function FreeBulletLesson({ inBuilder = false }: { inBuilder?: boolean }) {
    const [choice, setChoice] = useState<number | null>(null);
    return <div className="space-y-4">
        <p className="text-gray-700">You volunteered at two school fundraisers. Compare your notes with the AI draft.</p>
        <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-soft-sky p-4"><strong>What you did</strong><p>“I checked people in at two school fundraisers.”</p></div>
            <div className="rounded-xl bg-orange-50 p-4"><strong>What AI wrote</strong><p>“Led fundraising operations for two school events.”</p></div>
        </div>
        <fieldset className="space-y-2"><legend className="mb-2 font-semibold">What would you change before putting this on your resume?</legend>
        {choices.map(([label],i)=><label key={label} className="flex items-start gap-3 rounded-xl border border-gray-200 p-3 cursor-pointer">
            <input type="radio" className="mt-1.5" name="fundraiser-example" checked={choice===i} onChange={()=>setChoice(i)} />{label}
        </label>)}</fieldset>
        <p role="status" className="font-medium text-charcoal">{choice === null ? '' : choices[choice][1]}</p>
        {inBuilder && <Link className="font-semibold text-career-blue underline" href={WORKSHOP} target="_blank" rel="noopener">Practice with your own experience · View the $4.99 workshop (opens in a new tab)</Link>}
    </div>;
}
