import { NextRequest, NextResponse } from 'next/server';
import { ownedLinkedInResume } from '@/lib/linkedin-server';
import { parseLinkedInContent } from '@/lib/linkedin-content';

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
    try {
        const access = await ownedLinkedInResume((await params).id);
        if (access.error) return access.error;
        return NextResponse.json({ linkedInContent: parseLinkedInContent(access.resume.linkedin_content) }, { headers: { 'Cache-Control': 'private, no-store' } });
    } catch {
        return NextResponse.json({ error: 'Unable to load LinkedIn content.' }, { status: 500 });
    }
}

export async function POST(request: NextRequest, { params }: Context) {
    try {
        const access = await ownedLinkedInResume((await params).id);
        if (access.error) return access.error;
        if (access.resume.status !== 'paid') return NextResponse.json({ error: 'Unlock your resume first.' }, { status: 402 });
        const body = await request.json();
        const content = parseLinkedInContent(body.linkedInContent);
        if (!content) return NextResponse.json({ error: 'Invalid LinkedIn content.' }, { status: 400 });
        const { error } = await access.db.from('resumes')
            .update({ linkedin_content: JSON.stringify(content), updated_at: new Date().toISOString() })
            .eq('id', access.resume.id).eq('user_id', access.user.id);
        if (error) return NextResponse.json({ error: 'Unable to save LinkedIn content.' }, { status: 503 });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Unable to save LinkedIn content.' }, { status: error instanceof SyntaxError ? 400 : 500 });
    }
}
