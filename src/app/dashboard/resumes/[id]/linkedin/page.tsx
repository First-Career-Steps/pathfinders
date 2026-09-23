'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { LinkedInSetupGuide } from "@/components/LinkedInSetupGuide";
import type { LinkedInContent } from '@/types/linkedin';

export default function LinkedInContentPage() {
    const params = useParams();
    const router = useRouter();

    const [content, setContent] = useState<LinkedInContent | null>(null);
    const [loading, setLoading] = useState(true);
    const [copiedSection, setCopiedSection] = useState<string | null>(null);
    const resumeId = params.id as string;

    useEffect(() => {
        fetchLinkedInContent();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resumeId]);

    const fetchLinkedInContent = async () => {
        try {
            const response = await fetch(`/api/resumes/${resumeId}/linkedin`);
            if (!response.ok) {
                throw new Error('Failed to fetch LinkedIn content');
            }
            const data = await response.json();
            setContent(data.linkedInContent);
        } catch (error) {
            console.error('Error fetching LinkedIn content:', error);
            alert('Failed to load LinkedIn content');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = async (text: string, section: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedSection(section);
            setTimeout(() => setCopiedSection(null), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
            alert('Failed to copy to clipboard');
        }
    };

    if (loading) {
        return (
            <div className="p-8">
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-career-blue"></div>
                </div>
            </div>
        );
    }

    if (!content) {
        return (
            <div className="p-8">
                <div className="max-w-4xl mx-auto">
                    <button
                        onClick={() => router.back()}
                        className="mb-6 text-career-blue hover:text-career-blue-dark flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Resumes
                    </button>
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No LinkedIn Content</h3>
                        <p className="text-gray-600 mb-6">
                            This resume doesn&apos;t have LinkedIn content generated yet.
                        </p>
                        <button
                            onClick={() => router.push('/builder/review')}
                            className="px-6 py-3 bg-career-blue text-white font-semibold rounded-lg hover:bg-career-blue-dark transition-colors"
                        >
                            Generate LinkedIn Content
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <button
                    onClick={() => router.back()}
                    className="mb-6 text-career-blue hover:text-career-blue-dark flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Resumes
                </button>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-charcoal mb-2">Your LinkedIn Setup Guide</h1>
                    <p className="text-gray-600">
                        Copy and paste these sections directly into your LinkedIn profile
                    </p>
                </div>

                <LinkedInSetupGuide />

                {/* Headline Section */}
                <div className="mb-6 p-6 bg-white rounded-xl shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-charcoal">Headline</h3>
                        <button
                            onClick={() => copyToClipboard(content.headline, 'headline')}
                            className="px-4 py-2 text-sm bg-career-blue text-white rounded-lg hover:bg-career-blue-dark transition-colors"
                        >
                            {copiedSection === 'headline' ? '✓ Copied!' : 'Copy'}
                        </button>
                    </div>
                    <p className="text-charcoal-light">{content.headline}</p>
                </div>

                {/* About Section */}
                <div className="mb-6 p-6 bg-white rounded-xl shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-charcoal">About</h3>
                        <button
                            onClick={() => copyToClipboard(content.about, 'about')}
                            className="px-4 py-2 text-sm bg-career-blue text-white rounded-lg hover:bg-career-blue-dark transition-colors"
                        >
                            {copiedSection === 'about' ? '✓ Copied!' : 'Copy'}
                        </button>
                    </div>
                    <p className="text-charcoal-light whitespace-pre-wrap">{content.about}</p>
                </div>

                {content.education && (
                    <div className="mb-6 p-4 bg-soft-sky/20 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-charcoal">Education</h3>
                            <button onClick={() => copyToClipboard(content.education || '', 'education')} className="min-h-11 px-3 py-2 text-sm bg-career-blue text-white rounded-lg hover:bg-career-blue-dark">{copiedSection === 'education' ? 'Copied!' : 'Copy'}</button>
                        </div>
                        <p className="whitespace-pre-wrap text-charcoal-light">{content.education}</p>
                    </div>
                )}

                {/* Experiences Section */}
                {content.experiences && content.experiences.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-charcoal mb-4">Experience Descriptions</h3>
                        {content.experiences.map((exp, index) => (
                            <div key={index} className="mb-4 p-6 bg-white rounded-xl shadow-sm">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h4 className="font-semibold text-charcoal">{exp.title}</h4>
                                        <p className="text-sm text-gray-600">{exp.organization}</p>
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(exp.description, `exp-${index}`)}
                                        className="px-4 py-2 text-sm bg-career-blue text-white rounded-lg hover:bg-career-blue-dark transition-colors"
                                    >
                                        {copiedSection === `exp-${index}` ? '✓ Copied!' : 'Copy'}
                                    </button>
                                </div>
                                <p className="text-charcoal-light whitespace-pre-wrap text-sm">{exp.description}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Skills Section */}
                {content.skills && content.skills.length > 0 && (
                    <div className="mb-6 p-6 bg-white rounded-xl shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-charcoal">Skills</h3>
                            <button
                                onClick={() => copyToClipboard(content.skills.join(', '), 'skills')}
                                className="px-4 py-2 text-sm bg-career-blue text-white rounded-lg hover:bg-career-blue-dark transition-colors"
                            >
                                {copiedSection === 'skills' ? '✓ Copied!' : 'Copy'}
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {content.skills.map((skill, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-1 bg-career-blue/10 text-career-blue rounded-full text-sm"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Copy All Button */}
                <div className="flex gap-3">
                    <button
                        onClick={() => copyToClipboard(content.copyableText, 'all')}
                        className="flex-1 px-6 py-3 bg-career-blue text-white font-semibold rounded-lg hover:bg-career-blue-dark transition-colors"
                    >
                        {copiedSection === 'all' ? '✓ Copied All!' : 'Copy All Content'}
                    </button>
                </div>
            </div>
        </div>
    );
}
