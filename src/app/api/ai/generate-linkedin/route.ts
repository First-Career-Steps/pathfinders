import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getResumeAIModel } from '@/lib/resume-ai';

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

        // Create context from resume data
        const topExperiences = experiences?.slice(0, 3) || [];
        const topSkills = skills?.slice(0, 5) || [];

        const prompt = `Generate 3 different LinkedIn post variations for a high school student based on their resume:

Headline: ${headline || 'Student'}
About: ${aboutText || 'High school student'}
Top Experiences: ${topExperiences.map((exp: { title: string; organization: string }) => `${exp.title} at ${exp.organization}`).join(', ')}
Top Skills: ${topSkills.join(', ')}

Create 3 variations:
1. Professional & Achievement-focused
2. Casual & Engaging
3. Story-driven & Personal

Each post should:
- Be 150-200 words
- Include relevant emojis
- Have a clear call-to-action
- Be authentic to a high school student's voice
- Highlight their achievements and goals

Format as JSON array with objects containing: { type, content }`;

        const completion = await openai.chat.completions.create({
            model: getResumeAIModel(),
            messages: [
                {
                    role: 'system',
                    content: 'You are a LinkedIn content expert helping high school students create engaging posts about their achievements and career goals.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.8,
            max_tokens: 1000,
        });

        const content = completion.choices[0]?.message?.content;

        if (!content) {
            throw new Error('No content generated');
        }

        // Parse the JSON response
        let posts;
        try {
            posts = JSON.parse(content);
        } catch {
            // If not valid JSON, create structured response
            posts = [
                {
                    type: 'Professional',
                    content: content.split('\n\n')[0] || content,
                },
                {
                    type: 'Casual',
                    content: content.split('\n\n')[1] || content,
                },
                {
                    type: 'Story-driven',
                    content: content.split('\n\n')[2] || content,
                },
            ];
        }

        return NextResponse.json({ posts });
    } catch (error: unknown) {
        console.error('LinkedIn generation error:', error);

        if (error instanceof Error) {
            return NextResponse.json(
                { error: error.message || 'Failed to generate LinkedIn content' },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to generate LinkedIn content' },
            { status: 500 }
        );
    }
}
