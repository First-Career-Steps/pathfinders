import { NextRequest, NextResponse } from 'next/server';
import { generateResumeText, parseResumeLines, resumeAIErrorResponse } from '@/lib/resume-ai';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
    try {
        const { title, organization, description, type } = (await request.json()) ?? {};

        if (![title, organization, description].every(value => typeof value === 'string' && value.trim()) ||
            (type != null && typeof type !== 'string')) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const prompt = `Transform this ${type || 'experience'} description into 3-5 professional bullet points for a resume:

Role: ${title}
Organization: ${organization}
Description: ${description}

Requirements:
- Start each bullet with a strong action verb
- Use numbers only when provided by the student; never invent metrics or achievements
- ATS-friendly format
- Professional but authentic to a student
- Each bullet should be 1-2 lines maximum
- Focus on impact and results

Return ONLY the bullet points, one per line, starting with "•" symbol.`;

        const text = await generateResumeText({
            system: 'You are a professional resume writer. Create impactful, ATS-friendly bullet points for student experiences using only the facts provided.',
            prompt,
            maxTokens: 500,
        });
        const bullets = parseResumeLines(text, 5);
        if (bullets.length === 0) throw new Error('No usable bullet points returned');
        return NextResponse.json({ bullets });
    } catch (error: unknown) {
        return resumeAIErrorResponse(error, 'experience');
    }
}
