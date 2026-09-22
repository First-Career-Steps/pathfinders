import { NextRequest, NextResponse } from 'next/server';
import { generateResumeText, resumeAIErrorResponse } from '@/lib/resume-ai';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
    try {
        const { aboutMe, accomplishment, goals } = (await request.json()) ?? {};

        if (![aboutMe, accomplishment, goals].every(value => typeof value === 'string' && value.trim())) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const prompt = `Create a professional "About Me" section for a high school student's resume based on:
- About: ${aboutMe}
- Key Accomplishment: ${accomplishment}
- Career Goals: ${goals}

Requirements:
- Write in first person
- 3-4 sentences maximum
- Professional tone but authentic to a student
- ATS-friendly (no special characters)
- Highlight strengths and aspirations
- Keep it under 150 words

Return ONLY the about section text, no extra formatting or labels.`;

        const enhancedText = await generateResumeText({
            system: 'You are a professional resume writer specializing in student resumes. Use only the facts provided; never invent achievements or qualifications.',
            prompt,
            maxTokens: 400,
        });
        return NextResponse.json({ enhancedText });
    } catch (error: unknown) {
        return resumeAIErrorResponse(error, 'about');
    }
}
