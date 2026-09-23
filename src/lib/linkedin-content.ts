import type { LinkedInContent } from '@/types/linkedin';

type ProfileSource = { headline?: string; about_text?: string; skills?: unknown; high_school?: string; graduation_year?: string };
type ExperienceSource = { title: string; organization: string; bullets?: unknown; start_date?: string; end_date?: string; is_current?: boolean };

/** Reuse reviewed writing without inventing another set of achievements. */
export function linkedInFromProfile(profile: ProfileSource, rows: ExperienceSource[]): LinkedInContent {
    const content: LinkedInContent = {
        headline: (profile.headline || '').trim().slice(0, 220),
        about: (profile.about_text || '').trim().slice(0, 2600),
        experiences: rows.slice(0, 30).map((row) => ({
            title: row.title,
            organization: row.organization,
            description: Array.isArray(row.bullets) ? row.bullets.filter((line): line is string => typeof line === 'string').join('\n') : '',
            startDate: row.start_date || undefined,
            endDate: row.is_current ? 'Present' : row.end_date || undefined,
        })),
        skills: Array.isArray(profile.skills) ? profile.skills.filter((skill): skill is string => typeof skill === 'string').slice(0, 50) : [],
        education: [profile.high_school, profile.graduation_year ? `Graduation year: ${profile.graduation_year}` : ''].filter(Boolean).join('\n'),
        copyableText: '',
    };
    content.copyableText = formatLinkedInContent(content);
    return content;
}

export function formatLinkedInContent(content: LinkedInContent) {
    return [
        `HEADLINE\n${content.headline}`,
        `ABOUT\n${content.about}`,
        ...(content.education ? [`EDUCATION\n${content.education}`] : []),
        ...content.experiences.map((experience) => `EXPERIENCE\n${experience.title} at ${experience.organization}\n${[experience.startDate, experience.endDate].filter(Boolean).join(' – ')}\n${experience.description}`),
        `SKILLS\n${content.skills.join(', ')}`,
    ].join('\n\n');
}

export function parseLinkedInContent(raw: unknown): LinkedInContent | null {
    try {
        const value = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (!value || typeof value !== 'object') return null;
        if (typeof value.headline !== 'string' || value.headline.length > 500) return null;
        if (typeof value.about !== 'string' || value.about.length > 10000) return null;
        if (!Array.isArray(value.experiences) || value.experiences.length > 30 || !value.experiences.every((item: Record<string, unknown>) => item && typeof item.title === 'string' && typeof item.organization === 'string' && typeof item.description === 'string' && item.description.length <= 10000 && (item.startDate === undefined || typeof item.startDate === 'string') && (item.endDate === undefined || typeof item.endDate === 'string'))) return null;
        if (!Array.isArray(value.skills) || value.skills.length > 50 || !value.skills.every((item: unknown) => typeof item === 'string' && item.length <= 200)) return null;
        if (value.education !== undefined && (typeof value.education !== 'string' || value.education.length > 2000)) return null;
        const content: LinkedInContent = { headline: value.headline, about: value.about, experiences: value.experiences, skills: value.skills, education: value.education, copyableText: '' };
        content.copyableText = formatLinkedInContent(content);
        return content;
    } catch { return null; }
}
