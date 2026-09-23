export interface LinkedInExperience {
    title: string;
    organization: string;
    description: string;
    startDate?: string;
    endDate?: string;
}

export interface LinkedInContent {
    headline: string;
    about: string;
    experiences: LinkedInExperience[];
    skills: string[];
    copyableText: string;
    education?: string;
}

export interface GenerateLinkedInProfileRequest {
    headline: string;
    aboutText: string;
    experiences: Array<{
        title: string;
        organization: string;
        description?: string;
        start_date?: string;
        end_date?: string;
    }>;
    skills: string[];
}
