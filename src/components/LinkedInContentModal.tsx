"use client";

import React, { useState } from 'react';
import { LinkedInSetupGuide } from "@/components/LinkedInSetupGuide";
import type { LinkedInContent } from '@/types/linkedin';
import Image from 'next/image';

interface LinkedInContentModalProps {
    isOpen: boolean;
    onClose: () => void;
    content: LinkedInContent | null;
    loading?: boolean;
    userName?: string;
    userPhoto?: string;
}

export default function LinkedInContentModal({
    isOpen,
    onClose,
    content,
    loading = false,
    userName,
    userPhoto,
}: LinkedInContentModalProps) {
    const [copiedSection, setCopiedSection] = useState<string | null>(null);

    if (!isOpen) return null;

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

    if (loading || !content) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl p-8 max-w-2xl w-full">
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-career-blue"></div>
                    </div>
                    <p className="text-center text-gray-600 mt-4">
                        Preparing your LinkedIn guide...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl p-6 md:p-8 max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl md:text-3xl font-bold text-charcoal">
                        Your LinkedIn Setup Guide
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Profile Info */}
                {(userName || userPhoto) && (
                    <div className="flex items-center gap-4 mb-6 p-4 bg-gradient-to-r from-[#0077B5]/10 to-[#00A0DC]/10 rounded-xl border border-[#0077B5]/20">
                        {userPhoto && (
                            <Image
                                src={userPhoto}
                                alt={userName || 'Profile'}
                                width={64}
                                height={64}
                                unoptimized
                                className="w-16 h-16 rounded-full object-cover border-2 border-[#0077B5]"
                            />
                        )}
                        <div>
                            {userName && (
                                <h3 className="text-lg font-semibold text-charcoal">{userName}</h3>
                            )}
                            <p className="text-sm text-gray-600">LinkedIn Profile Preview</p>
                        </div>
                    </div>
                )}

                <p className="text-gray-600 mb-6">
                    Copy and paste these sections directly into your LinkedIn profile
                </p>

                <LinkedInSetupGuide />

                {/* Headline Section */}
                <div className="mb-6 p-4 bg-soft-sky/20 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-charcoal">Headline</h3>
                        <button
                            onClick={() => copyToClipboard(content.headline, 'headline')}
                            className="px-3 py-1 text-sm bg-career-blue text-white rounded-lg hover:bg-career-blue-dark transition-colors"
                        >
                            {copiedSection === 'headline' ? '✓ Copied!' : 'Copy'}
                        </button>
                    </div>
                    <p className="text-charcoal-light">{content.headline}</p>
                </div>

                {/* About Section */}
                <div className="mb-6 p-4 bg-soft-sky/20 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-charcoal">About</h3>
                        <button
                            onClick={() => copyToClipboard(content.about, 'about')}
                            className="px-3 py-1 text-sm bg-career-blue text-white rounded-lg hover:bg-career-blue-dark transition-colors"
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
                        <h3 className="font-semibold text-charcoal mb-3">Experience Descriptions</h3>
                        {content.experiences.map((exp, index) => (
                            <div key={index} className="mb-4 p-4 bg-soft-sky/20 rounded-xl">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <h4 className="font-semibold text-charcoal">{exp.title}</h4>
                                        <p className="text-sm text-gray-600">{exp.organization}</p>
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(exp.description, `exp-${index}`)}
                                        className="px-3 py-1 text-sm bg-career-blue text-white rounded-lg hover:bg-career-blue-dark transition-colors"
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
                    <div className="mb-6 p-4 bg-soft-sky/20 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-charcoal">Skills</h3>
                            <button
                                onClick={() => copyToClipboard(content.skills.join(', '), 'skills')}
                                className="px-3 py-1 text-sm bg-career-blue text-white rounded-lg hover:bg-career-blue-dark transition-colors"
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

                {/* Action Button */}
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
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
