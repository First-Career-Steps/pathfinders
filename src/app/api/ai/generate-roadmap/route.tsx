import { privateAssetPath } from '@/lib/student-privacy';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { ImageResponse } from '@vercel/og';
import type { RoadmapResponse, CareerRoadmap } from '@/types/roadmap';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
    try {
        const { careerGoal, userId } = await request.json();

        if (!careerGoal || !userId) {
            return NextResponse.json(
                { error: 'Career goal and user ID are required' },
                { status: 400 }
            );
        }

        if (!process.env.OPENAI_API_KEY) {
            console.error('OPENAI_API_KEY is not set');
            return NextResponse.json(
                { error: 'OpenAI API key not configured' },
                { status: 500 }
            );
        }

        // Generate roadmap content using GPT
        const roadmapPrompt = `You are a career planning assistant and visual designer.

The user wants to become: ${careerGoal}

Create a detailed career roadmap including:

1. Key skills they need to learn (list 8-12 skills)
2. Tools or software they should master (list 5-8 tools)
3. At least 5 free online courses or classes. For each course:
   - Course name
   - Direct link to the class (use real URLs from platforms like Coursera, edX, Khan Academy, YouTube, etc.)
   - Explanation of why it matters
   - Make sure no link repeats
4. A step-by-step plan (EXACTLY 7 steps, no more, no less). For each step:
   - Step number
   - Title (MAXIMUM 2 WORDS, e.g., "MASTER REACT" or "LEARN PYTHON")
   - Detailed description (Write a short sentence of approx 120-150 characters)
   - 1-3 relevant hashtags
5. Estimated learning timeline (e.g., "6-12 months" or "1-2 years")
6. Suggested starter projects to build experience (list 3-5 projects)
7. Hashtags or community spaces they could join (list 5-8 relevant hashtags/communities)

Rules:
- Tone should be confident, clear, and professional
- Roadmap should be actionable and beginner-friendly
- Include 1-3 relevant hashtags per section
- Do NOT include real person identification from images
- CRITICAL: DO NOT HALLUCINATE LINKS. If you do not know a 100% strictly accurate URL, you MUST output a Google search URL instead (e.g., https://www.google.com/search?q=free+online+course+golf+basics). Do not make up Coursera or Udemy URLs.

Return ONLY a valid JSON object with this exact structure:
{
  "careerName": "string",
  "keySkills": ["string"],
  "tools": ["string"],
  "courses": [
    {
      "name": "string",
      "link": "string (real URL)",
      "reason": "string"
    }
  ],
  "steps": [
    {
      "step": number,
      "title": "string",
      "description": "string",
      "hashtags": ["string"]
    }
  ],
  "timeline": "string",
  "starterProjects": ["string"],
  "communities": ["string"],
  "hashtags": ["string"]
}`;

        console.log('Generating roadmap content...');
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: 'You are a career planning assistant. Always return valid JSON. Ensure all course links are real and accessible.',
                },
                {
                    role: 'user',
                    content: roadmapPrompt,
                },
            ],
            temperature: 0.7,
            max_tokens: 3000,
            response_format: { type: 'json_object' },
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
            throw new Error('No roadmap content generated');
        }

        const roadmapData: CareerRoadmap = JSON.parse(content);

        // Generate formatted content
        const formattedContent = formatRoadmapContent(roadmapData);

        // Generate roadmap images using Canvas
        console.log('Creating infographic with Canvas...');

        // Create structured roadmap data
        const roadmapStructure = {
            careerName: roadmapData.careerName,
            totalSteps: roadmapData.steps.length,
            steps: roadmapData.steps.map(step => ({
                number: step.step,
                title: step.title
            }))
        };

        // Generate infographic using Canvas
        const infographicBuffer = await generateInfographicImage(
            roadmapStructure.careerName,
            roadmapStructure.steps
        );

        // Upload the infographic
        const infographicUrl = await uploadImageToStorage(
            infographicBuffer,
            userId,
            'infographic'
        );

        console.log('Creating milestone roadmap with Canvas...');

        // Generate milestone roadmap using Canvas with descriptions
        const milestoneSteps = roadmapData.steps.map(step => ({
            number: step.step,
            title: step.title,
            description: step.description
        }));

        const milestoneBuffer = await generateMilestoneRoadmapImage(
            roadmapStructure.careerName,
            milestoneSteps
        );

        // Upload the milestone roadmap
        const milestoneRoadmapUrl = await uploadImageToStorage(
            milestoneBuffer,
            userId,
            'milestone'
        );

        // Images are already uploaded, use the URLs directly
        const infographicStorageUrl = infographicUrl;
        const milestoneStorageUrl = milestoneRoadmapUrl;

        // Save roadmap to database
        console.log('Saving roadmap to database...');
        const { data: roadmapRecord, error: dbError } = await supabase
            .from('career_roadmaps')
            .insert({
                user_id: userId,
                career_name: roadmapData.careerName,
                roadmap_data: roadmapData,
                infographic_url: infographicStorageUrl,
                milestone_roadmap_url: milestoneStorageUrl,
            })
            .select()
            .single();

        if (dbError) {
            console.error('Database error:', dbError);
            throw dbError;
        }

        const response: RoadmapResponse = {
            roadmap: roadmapData,
            formattedContent,
            infographicUrl: infographicStorageUrl,
            milestoneRoadmapUrl: milestoneStorageUrl,
            roadmapId: roadmapRecord.id,
        };

        return NextResponse.json(response);
    } catch (error: unknown) {
        console.error('Roadmap generation error:', error);

        if (error instanceof Error) {
            return NextResponse.json(
                { error: error.message || 'Failed to generate career roadmap' },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to generate career roadmap' },
            { status: 500 }
        );
    }
}

async function generateInfographicImage(
    careerName: string,
    steps: Array<{ number: number; title: string }>
): Promise<Buffer> {
    const width = 1792;
    const height = 1024;

    // Calculate spacing for arrow boxes
    const margin = 120;
    const availableWidth = width - (margin * 2);
    const boxWidth = 180;
    const boxSpacing = (availableWidth - (boxWidth * steps.length)) / (steps.length - 1);

    // Brand colors
    const colors = {
        careerBlue: '#1E88E5',
        careerBlueDark: '#1565C0',
        stepGreen: '#43A047',
        optimismOrange: '#FB8C00',
        softSky: '#E3F2FD',
        charcoal: '#263238',
    };

    // Use brand colors - alternate between blue, green, and orange
    const getStepColor = (index: number) => {
        const colorIndex = index % 3;
        if (colorIndex === 0) return colors.careerBlue;
        if (colorIndex === 1) return colors.stepGreen;
        return colors.optimismOrange;
    };

    const imageResponse = new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: colors.charcoal, // Dark charcoal background
                    padding: '60px 80px',
                    justifyContent: 'center',
                }}
            >
                {/* Title */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        marginBottom: '60px',
                    }}
                >
                    <div
                        style={{
                            fontSize: 72,
                            fontWeight: 'bold',
                            color: '#ffffff',
                            textAlign: 'center',
                            display: 'flex',
                        }}
                    >
                        Career Roadmap
                    </div>
                </div>

                {/* Timeline Container - Centered vertically */}
                <div
                    style={{
                        position: 'relative',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flex: 1,
                    }}
                >
                    {/* Arrow-shaped boxes timeline */}
                    <div
                        style={{
                            position: 'relative',
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'flex-start',
                            alignItems: 'center',
                            paddingLeft: `${margin}px`,
                        }}
                    >
                        {steps.map((step, index) => {
                            const stepColor = getStepColor(index);
                            const stepX = (index * (boxWidth + boxSpacing));
                            const titleLines = wrapText(step.title, 240, 22);
                            const isEven = index % 2 === 0;

                            return (
                                <div
                                    key={step.number}
                                    style={{
                                        position: 'absolute',
                                        left: `${stepX}px`,
                                        top: '0px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                    }}
                                >
                                    {/* Arrow-shaped box - using connected rectangles */}
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                        }}
                                    >
                                        {/* Main box */}
                                        <div
                                            style={{
                                                width: `${boxWidth}px`,
                                                height: '80px',
                                                backgroundColor: stepColor,
                                                borderRadius: '8px 0 0 8px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            {/* Step number */}
                                            <span
                                                style={{
                                                    fontSize: 36,
                                                    fontWeight: 'bold',
                                                    color: '#ffffff',
                                                    display: 'flex',
                                                }}
                                            >
                                                {step.number}
                                            </span>
                                        </div>

                                        {/* Arrow point (triangle shape using border) */}
                                        {index < steps.length - 1 && (
                                            <div
                                                style={{
                                                    width: '0',
                                                    height: '0',
                                                    borderTop: '40px solid transparent',
                                                    borderBottom: '40px solid transparent',
                                                    borderLeft: `30px solid ${stepColor}`,
                                                    display: 'flex',
                                                }}
                                            />
                                        )}
                                    </div>

                                    {/* Event marker (circle with icon placeholder) */}
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: isEven ? '-120px' : '100px',
                                            width: '60px',
                                            height: '60px',
                                            borderRadius: '50%',
                                            border: '2px dashed #F8F8F8',
                                            backgroundColor: 'transparent',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '50%',
                                                backgroundColor: '#F8F8F8',
                                                display: 'flex',
                                            }}
                                        />
                                    </div>

                                    {/* Dotted line connecting box to marker */}
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: isEven ? '-60px' : '80px',
                                            width: '2px',
                                            height: '60px',
                                            borderLeft: '2px dashed #F8F8F8',
                                            display: 'flex',
                                        }}
                                    />

                                    {/* Event description text */}
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: isEven ? '-200px' : '200px', // Increased spacing from marker
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            width: '240px',
                                        }}
                                    >
                                        {titleLines.map((line, lineIndex) => (
                                            <div
                                                key={lineIndex}
                                                style={{
                                                    fontSize: 22,
                                                    fontWeight: 'normal',
                                                    color: '#F8F8F8',
                                                    textAlign: 'center',
                                                    marginBottom: lineIndex < titleLines.length - 1 ? '4px' : '0',
                                                    display: 'flex',
                                                    width: '100%',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                {line}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        ),
        {
            width,
            height,
        }
    );

    const arrayBuffer = await imageResponse.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

async function generateMilestoneRoadmapImage(
    careerName: string,
    steps: Array<{ number: number; title: string; description: string }>
): Promise<Buffer> {
    const width = 1792;
    const height = 1024;

    // Strict 7 colors matching the card design provided by user
    const COLORS = [
        { hex: '#9d94ff' }, // Purple
        { hex: '#7ef0eb' }, // Teal
        { hex: '#a8fc58' }, // Lime
        { hex: '#ffcf3d' }, // Yellow
        { hex: '#ffa063' }, // Light Orange
        { hex: '#ff771a' }, // Deep Orange
        { hex: '#ff4c4c' }, // Red
    ];

    // Ensure we only process up to 7 steps to strictly enforce the design
    const displaySteps = steps.slice(0, 7);

    // Layout Constants
    const paddingX = 80;
    const cardWidth = 200;
    // Calculate gap dynamically to distribute cards evenly across available width
    const totalCardsWidth = 7 * cardWidth;
    const availableWidth = width - (paddingX * 2);
    const gap = (availableWidth - totalCardsWidth) / 6;

    const cardY = 120; // Lowered slightly, plenty of room below
    const cardHeight = 480; // Shorter card, supports 150 chars perfectly
    const circleRadius = 50;

    // Timeline positioning
    const timelineY = cardY + cardHeight + 80; // 120 + 480 + 80 = 680 (Fits in the 800px view area)

    // Card SVG Path (rectangle with pointed bottom)
    const cardPath = `M 0 0 L ${cardWidth} 0 L ${cardWidth} ${cardHeight - 40} L ${cardWidth / 2} ${cardHeight} L 0 ${cardHeight - 40} Z`;

    const imageResponse = new ImageResponse(
        (
            <div
                style={{
                    width: '1792px',
                    height: '1024px',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: '#F4F7FB', // Light blue/gray background from design
                    paddingTop: '60px',
                }}
            >
                {/* Header Section */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        marginBottom: '40px',
                    }}
                >
                    <h1
                        style={{
                            fontSize: '72px',
                            fontWeight: 'bold',
                            color: '#0B1120',
                            textAlign: 'center',
                            display: 'flex',
                            letterSpacing: '1px',
                            margin: 0,
                        }}
                    >
                        Milestone Roadmap
                    </h1>
                </div>

                {/* Timeline Container */}
                <div
                    style={{
                        position: 'relative',
                        width: '1792px',
                        flex: 1,
                        display: 'flex',
                    }}
                >
                    {/* Render the background SVG containing timeline line, cards, and bottom dots */}
                    <svg
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '1792px',
                            height: '800px',
                        }}
                        viewBox={`0 0 1792 800`}
                    >
                        {/* 1. Timeline segments (behind dots) */}
                        {displaySteps.map((_, index) => {
                            if (index === displaySteps.length - 1) return null; // No line after last dot
                            const currentCenterX = paddingX + index * (cardWidth + gap) + (cardWidth / 2);
                            const nextCenterX = currentCenterX + cardWidth + gap;
                            const color = COLORS[index].hex;

                            return (
                                <g key={`timeline-line-${index}`}>
                                    <line
                                        x1={currentCenterX}
                                        y1={timelineY}
                                        x2={nextCenterX}
                                        y2={timelineY}
                                        stroke={color}
                                        strokeWidth="6"
                                    />
                                </g>
                            );
                        })}
                        {/* Extension line for the end arrow */}
                        <g>
                            <line
                                x1={paddingX + 6 * (cardWidth + gap) + (cardWidth / 2)}
                                y1={timelineY}
                                x2={paddingX + 6 * (cardWidth + gap) + cardWidth + 40}
                                y2={timelineY}
                                stroke={COLORS[6].hex}
                                strokeWidth="6"
                            />
                            {/* Arrow head */}
                            <path
                                d={`M ${paddingX + 6 * (cardWidth + gap) + cardWidth + 30} ${timelineY - 10} L ${paddingX + 6 * (cardWidth + gap) + cardWidth + 50} ${timelineY} L ${paddingX + 6 * (cardWidth + gap) + cardWidth + 30} ${timelineY + 10} Z`}
                                fill={COLORS[6].hex}
                            />
                            {/* Extension line at the beginning */}
                            <line
                                x1={paddingX - 40}
                                y1={timelineY}
                                x2={paddingX + (cardWidth / 2)}
                                y2={timelineY}
                                stroke={COLORS[0].hex}
                                strokeWidth="6"
                            />
                            <line
                                x1={paddingX - 40}
                                y1={timelineY - 15}
                                x2={paddingX - 40}
                                y2={timelineY + 15}
                                stroke={COLORS[0].hex}
                                strokeWidth="4"
                            />
                        </g>

                        {/* 2. Timeline dots */}
                        {displaySteps.map((_, index) => {
                            const currentCenterX = paddingX + index * (cardWidth + gap) + (cardWidth / 2);
                            const color = COLORS[index].hex;
                            return (
                                <circle
                                    key={`timeline-dot-${index}`}
                                    cx={currentCenterX}
                                    cy={timelineY}
                                    r="14"
                                    fill={color}
                                />
                            );
                        })}

                        {/* 3. Cards backgrounds */}
                        {displaySteps.map((_, index) => {
                            const currentX = paddingX + index * (cardWidth + gap);
                            return (
                                <g key={`card-bg-${index}`} transform={`translate(${currentX}, ${cardY})`}>
                                    <path d={cardPath} fill="#E8EAEF" />
                                </g>
                            );
                        })}

                        {/* 4. Top Color Circles */}
                        {displaySteps.map((_, index) => {
                            const currentCenterX = paddingX + index * (cardWidth + gap) + (cardWidth / 2);
                            const color = COLORS[index].hex;
                            return (
                                <circle
                                    key={`top-circle-${index}`}
                                    cx={currentCenterX}
                                    cy={cardY}
                                    r={circleRadius}
                                    fill={color}
                                />
                            );
                        })}
                    </svg>

                    {/* Text Overlay for Numbers, Headings, and Descriptions */}
                    {displaySteps.map((step, index) => {
                        const currentX = paddingX + index * (cardWidth + gap);
                        const currentCenterX = currentX + (cardWidth / 2);

                        // Ensure we respect word limits for visual consistency
                        const titleParts = step.title.split(' ').slice(0, 3).join(' ');

                        return (
                            <div key={`text-overlay-${index}`} style={{ display: 'flex' }}>
                                {/* Step Number (Inside Top Circle) */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: currentCenterX - circleRadius,
                                        top: cardY - circleRadius,
                                        width: `${circleRadius * 2}px`,
                                        height: `${circleRadius * 2}px`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '48px',
                                        fontWeight: 'normal',
                                        color: '#111827',
                                    }}
                                >
                                    {index + 1}
                                </div>

                                {/* Card Content (Heading & Description) */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: currentX,
                                        top: cardY + circleRadius + 20,
                                        width: `${cardWidth}px`,
                                        height: `${cardHeight - circleRadius - 60}px`,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        padding: '0 15px',
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: '22px',
                                            fontWeight: 'bold',
                                            color: '#0B1120',
                                            textAlign: 'center',
                                            marginBottom: '15px',
                                            textTransform: 'capitalize',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            width: '100%',
                                        }}
                                    >
                                        {titleParts}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '14px',
                                            color: '#4B5563',
                                            textAlign: 'center',
                                            lineHeight: '1.4',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                        }}
                                    >
                                        {wrapText(step.description, cardWidth - 30, 14).slice(0, 8).map((line, lIdx) => (
                                            <span key={lIdx} style={{ display: 'flex' }}>
                                                {line}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        ),
        {
            width,
            height,
        }
    );

    const arrayBuffer = await imageResponse.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

// Helper function to wrap text
function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
    // Simple approximation: ~0.6 * fontSize per character
    const avgCharWidth = fontSize * 0.6;
    const maxChars = Math.floor(maxWidth / avgCharWidth);

    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach((word) => {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (testLine.length <= maxChars) {
            currentLine = testLine;
        } else {
            if (currentLine) {
                lines.push(currentLine);
            }
            currentLine = word;
        }
    });

    if (currentLine) {
        lines.push(currentLine);
    }

    return lines.length > 0 ? lines : [text];
}


async function uploadImageToStorage(
    imageUrl: string | Buffer,
    userId: string,
    type: 'infographic' | 'milestone'
): Promise<string> {
    try {
        let buffer: Buffer;

        // If it's a base64 string (from canvas), decode it
        if (typeof imageUrl === 'string' && imageUrl.startsWith('data:image')) {
            const base64Data = imageUrl.split(',')[1];
            buffer = Buffer.from(base64Data, 'base64');
        } else if (typeof imageUrl === 'string') {
            // It's a URL, download it
            const imageResponse = await fetch(imageUrl);
            if (!imageResponse.ok) {
                throw new Error('Failed to download image');
            }
            const imageBlob = await imageResponse.blob();
            const arrayBuffer = await imageBlob.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);
        } else {
            // It's already a Buffer
            buffer = imageUrl;
        }

        // Create unique filename
        const timestamp = Date.now();
        const fileExt = 'png';
        const fileName = `${userId}/${type}-${timestamp}.${fileExt}`;
        const filePath = `roadmaps/${fileName}`;

        // Upload to Supabase storage
        const { error: uploadError } = await supabase.storage
            .from('roadmaps')
            .upload(filePath, buffer, {
                contentType: 'image/png',
                upsert: false,
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            throw uploadError;
        }

        return privateAssetPath('roadmaps', filePath);
    } catch (error) {
        console.error('Error uploading image to storage:', error);
        // If it's a string URL, return it; otherwise throw
        if (typeof imageUrl === 'string') {
            return imageUrl;
        }
        throw error;
    }
}

function formatRoadmapContent(roadmap: CareerRoadmap): string {
    let content = `# ${roadmap.careerName} Career Roadmap\n\n`;

    // Key Skills
    content += `## Key Skills to Learn\n\n`;
    roadmap.keySkills.forEach((skill, index) => {
        content += `${index + 1}. ${skill}\n`;
    });
    content += `\n`;

    // Tools
    content += `## Tools & Software to Master\n\n`;
    roadmap.tools.forEach((tool, index) => {
        content += `${index + 1}. ${tool}\n`;
    });
    content += `\n`;

    // Courses
    content += `## Recommended Free Courses\n\n`;
    roadmap.courses.forEach((course, index) => {
        content += `### ${index + 1}. ${course.name}\n`;
        content += `**Link:** [${course.name}](${course.link})\n`;
        content += `**Why it matters:** ${course.reason}\n\n`;
    });

    // Steps
    content += `## Step-by-Step Plan\n\n`;
    roadmap.steps.forEach((step) => {
        content += `### Step ${step.step}: ${step.title}\n`;
        content += `${step.description}\n`;
        if (step.hashtags && step.hashtags.length > 0) {
            content += `\n**Hashtags:** ${step.hashtags.join(', ')}\n`;
        }
        content += `\n`;
    });

    // Timeline
    content += `## Estimated Timeline\n\n`;
    content += `${roadmap.timeline}\n\n`;

    // Starter Projects
    content += `## Starter Projects\n\n`;
    roadmap.starterProjects.forEach((project, index) => {
        content += `${index + 1}. ${project}\n`;
    });
    content += `\n`;

    // Communities
    content += `## Communities & Hashtags\n\n`;
    roadmap.communities.forEach((community, index) => {
        content += `${index + 1}. ${community}\n`;
    });
    if (roadmap.hashtags && roadmap.hashtags.length > 0) {
        content += `\n**Hashtags:** ${roadmap.hashtags.join(', ')}\n`;
    }

    return content;
}
