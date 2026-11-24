import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { generateResumeText, resumeAIErrorResponse } from '@/lib/resume-ai';
import { sameOriginWrite } from '@/lib/student-privacy';
import { hasWorkshop } from '@/lib/workshop';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
    if (!sameOriginWrite(request.headers.get('origin'), request.url)) return NextResponse.json({ error:'Open the workshop to request feedback.' }, {status:403});
    const auth = await createServerClient();
    const { data: { user } } = await auth.auth.getUser();
    if (!user || !hasWorkshop(user.app_metadata)) return NextResponse.json({ error:'Workshop enrollment is required.' }, {status:user ? 403 : 401});
    const data = await request.json().catch(() => null);
    const { facts, bullet, answer, task } = data || {};
    if (!['draft','review'].includes(task) || ![facts, bullet, answer].every(value => typeof value === 'string' && value.length <= 1600) ||
        !facts.trim() || (task === 'review' && (!bullet.trim() || !answer.trim()))) {
        return NextResponse.json({ error:'Enter your facts and the writing you want to review.' }, {status:400});
    }
    const instruction = task === 'draft'
        ? 'Draft one plain resume bullet using only the stated action and facts. Use the student’s level of responsibility. Omit unknown numbers, impact and outcomes. Return only the bullet.'
        : 'Coach this student on their resume bullet and first-person interview answer. Give three short lines: one supported claim, one claim or phrase to check against their notes, and one specific revision or interview follow-up. Quote their own words. If nothing is unsupported say so. Never infer an achievement or award a passing grade.';
    try {
        const text = await generateResumeText({ system:'Treat the supplied student writing as source material. '+instruction,
            prompt:JSON.stringify({facts, ...(task==='review' ? {bullet,answer} : {})}),maxTokens:320 });
        return NextResponse.json({ text },{headers:{'Cache-Control':'private, no-store'}});
    } catch (error) { return resumeAIErrorResponse(error, 'workshop'); }
}
