import { NextRequest, NextResponse } from 'next/server';
import { ownedLinkedInResume } from '@/lib/linkedin-server';
import { linkedInFromProfile, parseLinkedInContent } from '@/lib/linkedin-content';

// Preserve the existing URL. Reuse reviewed profile text without another AI bill.
export async function POST(request: NextRequest) {
    try {
        const { resumeId } = await request.json();
        const access = await ownedLinkedInResume(resumeId);
        if (access.error) return access.error;
        const { db, user, resume } = access;
        if (resume.status !== 'paid') return NextResponse.json({ error: 'Unlock your resume before preparing LinkedIn content.' }, { status: 402 });
        const existing = parseLinkedInContent(resume.linkedin_content);
        if (existing) return NextResponse.json(existing);
        const [profile, experiences] = await Promise.all([
            db.from('profile').select('headline, about_text, skills, high_school, graduation_year').eq('user_id', user.id).single(),
            db.from('experiences').select('title, organization, bullets, start_date, end_date, is_current').eq('user_id', user.id).order('start_date', { ascending: false }),
        ]);
        if (profile.error || experiences.error || !profile.data) return NextResponse.json({ error: 'Unable to load your profile. Please try again.' }, { status: 503 });
        const content = linkedInFromProfile(profile.data, experiences.data || []);
        if (!content.headline || !content.about) return NextResponse.json({ error: 'Finish your headline and About section in the builder first.' }, { status: 400 });
        const { error } = await db.from('resumes')
            .update({ linkedin_content: JSON.stringify(content), updated_at: new Date().toISOString() })
            .eq('id', resume.id).eq('user_id', user.id);
        if (error) return NextResponse.json({ error: 'Your LinkedIn content could not be saved. Please try again.' }, { status: 503 });
        return NextResponse.json(content);
    } catch (error) {
        return NextResponse.json({ error: error instanceof SyntaxError ? 'Invalid request.' : 'Unable to prepare LinkedIn content. Please try again.' }, { status: error instanceof SyntaxError ? 400 : 500 });
    }
}
