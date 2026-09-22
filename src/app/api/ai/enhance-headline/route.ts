import { NextRequest, NextResponse } from 'next/server';
import { generateResumeText, parseResumeLines, resumeAIErrorResponse } from '@/lib/resume-ai';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
    try {
        const { interests, school, graduationYear, currentHeadline } = (await request.json()) ?? {};

        if (!Array.isArray(interests) || !interests.every(value => typeof value === 'string') ||
            typeof school !== 'string' || !school.trim() ||
            !['string', 'number'].includes(typeof graduationYear) || !String(graduationYear).trim() ||
            (currentHeadline != null && typeof currentHeadline !== 'string')) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Build context-aware prompt
        const contextNote = currentHeadline
            ? `The student has written: "${currentHeadline}". Use this as inspiration and context for their career interests.`
            : '';

        const prompt = `Generate 3 professional headline options for a high school student's resume with the following details:
- School: ${school}
- Graduation Year: ${graduationYear}
- Interests: ${interests.join(', ')}
${contextNote}

Requirements:
- Keep each headline under 120 characters
- Make them professional and ATS-friendly
- Include graduation year
- Highlight main interest/passion
${currentHeadline ? '- Align with the career direction indicated in their draft headline' : ''}
- Format: Return ONLY 3 headlines, one per line, no numbering or extra text

Example format:
Aspiring Technology Professional | Class of 2025
Motivated Student Passionate About Computer Science | 2025 Graduate
Future Software Developer | Technology Enthusiast`;

        const text = await generateResumeText({
            system: 'You are a professional resume writer specializing in student resumes. Generate concise headlines using only the facts provided.',
            prompt,
            maxTokens: 300,
        });
        const suggestions = parseResumeLines(text, 3);
        if (suggestions.length === 0) throw new Error('No usable headlines returned');
        return NextResponse.json({ suggestions });
    } catch (error: unknown) {
        return resumeAIErrorResponse(error, 'headline');
    }
}
