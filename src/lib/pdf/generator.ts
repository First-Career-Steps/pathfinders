import { privateAssetPath } from '@/lib/student-privacy';
import { pdf } from '@react-pdf/renderer';
import { createAdminClient } from '@/lib/supabase';
import { ProfessionalResumePDF } from './templates/professional';

export interface ResumeData {
    fullName: string;
    email: string;
    linkedinLink?: string;
    headline?: string;
    aboutText?: string;
    highSchool?: string;
    graduationYear?: string;
    skills?: string[];
    experiences?: Array<{
        type: string;
        title: string;
        organization: string;
        bullets: string[];
        start_date?: string;
        end_date?: string;
    }>;
    certifications?: Array<{
        name: string;
        issuer?: string;
        date_issued?: string;
    }>;
    phone?: string;
    location?: string;
}

/**
 * Fetch user data for resume generation
 */
export async function fetchUserResumeData(userId: string): Promise<ResumeData | null> {
    try {
        const supabase = createAdminClient();

        // Fetch user basic info
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('full_name, email, linkedin_link')
            .eq('id', userId)
            .single();

        if (userError) {
            console.error('Error fetching user:', userError);
            return null;
        }

        // Fetch profile
        const { data: profile, error: profileError } = await supabase
            .from('profile')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (profileError) {
            console.error('Error fetching profile:', profileError);
        }

        // Fetch experiences
        const { data: experiences, error: expError } = await supabase
            .from('experiences')
            .select('*')
            .eq('user_id', userId)
            .order('start_date', { ascending: false });

        if (expError) {
            console.error('Error fetching experiences:', expError);
        }

        // Fetch certifications
        const { data: certifications, error: certError } = await supabase
            .from('certifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (certError) {
            console.error('Error fetching certifications:', certError);
        }

        return {
            fullName: user.full_name || 'Your Name',
            email: user.email,
            phone: profile?.phone || undefined,
            location: profile?.location || undefined,
            linkedinLink: user.linkedin_link || undefined,
            headline: profile?.headline || undefined,
            aboutText: profile?.about_text || undefined,
            highSchool: profile?.high_school || undefined,
            graduationYear: profile?.graduation_year || undefined,
            skills: profile?.skills || [],
            experiences: experiences || [],
            certifications: certifications || [],
        };
    } catch (error) {
        console.error('Error fetching resume data:', error);
        return null;
    }
}

/**
 * Generate PDF blob from resume data
 */
export async function generateResumePDF(data: ResumeData): Promise<Blob> {
    const React = await import('react');
    const element = React.createElement(ProfessionalResumePDF, { data });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blob = await pdf(element as any).toBlob();
    return blob;
}

/**
 * Upload PDF to Supabase Storage
 */
export async function uploadPDFToStorage(
    userId: string,
    pdfBlob: Blob
): Promise<{ url: string | null; error: Error | null }> {
    try {
        const supabase = createAdminClient();
        const fileName = `${userId}/resume_${Date.now()}.pdf`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from('resumes')
            .upload(fileName, pdfBlob, {
                contentType: 'application/pdf',
                upsert: false,
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return { url: null, error: uploadError };
        }

        return { url: privateAssetPath('resumes', fileName), error: null };
    } catch (error) {
        console.error('Error uploading PDF:', error);
        return { url: null, error: error as Error };
    }
}

/**
 * Complete PDF generation workflow
 */
export async function generateAndUploadResumePDF(
    userId: string
): Promise<{ pdfUrl: string | null; error: Error | null }> {
    try {
        // 1. Fetch user data
        const resumeData = await fetchUserResumeData(userId);
        if (!resumeData) {
            return { pdfUrl: null, error: new Error('Failed to fetch user data') };
        }

        // 2. Generate PDF
        const pdfBlob = await generateResumePDF(resumeData);

        // 3. Upload to storage
        const { url, error } = await uploadPDFToStorage(userId, pdfBlob);

        if (error) {
            return { pdfUrl: null, error };
        }

        return { pdfUrl: url, error: null };
    } catch (error) {
        console.error('Error in PDF generation workflow:', error);
        return { pdfUrl: null, error: error as Error };
    }
}
