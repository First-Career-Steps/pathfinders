import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getResumeAIModel } from '@/lib/resume-ai';
import type { LinkedInContent } from '@/types/linkedin';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
    try {
        const { headline, aboutText, experiences, skills } = await request.json();

        if (!process.env.OPENAI_API_KEY) {
            console.error('OPENAI_API_KEY is not set');
            return NextResponse.json(
                { error: 'OpenAI API key not configured' },
                { status: 500 }
            );
        }

        // Create a comprehensive prompt for LinkedIn profile optimization
        const prompt = `You are a LinkedIn profile optimization expert helping high school and college students create professional LinkedIn profiles.

Given the following resume information, generate optimized LinkedIn profile content:

HEADLINE: ${headline || 'Student'}
ABOUT: ${aboutText || 'High school/college student'}
EXPERIENCES: ${experiences?.map((exp: { title: string; organization: string }) => `${exp.title} at ${exp.organization}`).join(', ') || 'None'}
SKILLS: ${skills?.join(', ') || 'None'}

Generate the following sections:

1. HEADLINE (120 characters max):
   - Professional and concise
   - Include key interests or career goals
   - Age-appropriate for students

2. ABOUT SECTION (300-500 words):
   - First person narrative
   - Authentic and genuine
   - Highlight accomplishments without exaggeration
   - Include future goals and aspirations
   - Professional but student-appropriate tone

3. EXPERIENCE DESCRIPTIONS:
   - For each experience, create 3-4 bullet points
   - Use action verbs
   - Quantify achievements where possible
   - Be truthful and realistic for student-level work
   - Format as bullet points with • symbol

4. SKILLS SUMMARY:
   - Organize skills into categories if applicable
   - Keep it concise

Return ONLY a valid JSON object with this exact structure:
{
  "headline": "string",
  "about": "string",
  "experiences": [
    {
      "title": "string",
      "organization": "string",
      "description": "string with bullet points"
    }
  ],
  "skills": ["string"],
  "copyableText": "Complete formatted text ready to paste"
}`;

        const completion = await openai.chat.completions.create({
            model: getResumeAIModel(),
            messages: [
                {
                    role: 'system',
                    content: 'You are a LinkedIn profile expert helping students create professional, authentic profiles. Always return valid JSON.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.7,
            max_tokens: 2000,
            response_format: { type: 'json_object' },
        });

        const content = completion.choices[0]?.message?.content;

        if (!content) {
            throw new Error('No content generated');
        }

        // Parse the JSON response
        const linkedInContent: LinkedInContent = JSON.parse(content);

        // Generate copyable text if not provided
        if (!linkedInContent.copyableText) {
            linkedInContent.copyableText = generateCopyableText(linkedInContent);
        }

        return NextResponse.json(linkedInContent);
    } catch (error: unknown) {
        console.error('LinkedIn profile generation error:', error);

        if (error instanceof Error) {
            return NextResponse.json(
                { error: error.message || 'Failed to generate LinkedIn profile content' },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to generate LinkedIn profile content' },
            { status: 500 }
        );
    }
}

function generateCopyableText(content: LinkedInContent): string {
    let text = `HEADLINE:\n${content.headline}\n\n`;
    text += `ABOUT:\n${content.about}\n\n`;

    if (content.experiences && content.experiences.length > 0) {
        text += `EXPERIENCE:\n\n`;
        content.experiences.forEach((exp) => {
            text += `${exp.title} at ${exp.organization}\n`;
            text += `${exp.description}\n\n`;
        });
    }

    if (content.skills && content.skills.length > 0) {
        text += `SKILLS:\n${content.skills.join(' • ')}\n`;
    }

    return text;
}
