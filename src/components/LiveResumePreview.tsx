"use client";

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';

// Helper function to format date from YYYY-MM to "Month YYYY"
const formatDate = (dateString: string): string => {
    if (!dateString || dateString === "Present") return dateString;
    const [year, month] = dateString.split('-');
    if (!year || !month) return dateString;
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    const monthIndex = parseInt(month) - 1;
    if (monthIndex < 0 || monthIndex > 11) return dateString;
    return `${monthNames[monthIndex]} ${year}`;
};

export interface Experience {
    type: string;
    title: string;
    organization: string;
    description: string;
    startDate: string;
    endDate: string;
    location?: string;
    isCurrent?: boolean;
}

export interface Certification {
    name: string;
    issuer?: string;
    dateIssued?: string;
}

interface LiveResumePreviewProps {
    fullName?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    headline?: string;
    aboutText?: string;
    highSchool?: string;
    graduationYear?: string;
    skills?: string[];
    experiences?: Experience[];
    certifications?: Certification[];

    isPaid?: boolean;
    variant?: 'preview' | 'document';
}

export function LiveResumePreview({
    fullName,
    email,
    phone,
    location,
    linkedin,
    headline,
    aboutText,
    highSchool,
    graduationYear,
    skills,
    experiences,
    certifications,

    variant = 'preview',
}: LiveResumePreviewProps) {
    const router = useRouter();
    const pathname = usePathname();
    const isBuilder = pathname?.includes('/builder/');
    const editable = isBuilder && variant !== 'document';

    const handleEdit = (stepPath: string) => {
        if (editable) {
            router.push(stepPath);
        }
    };

    const renderEditButton = (stepPath: string) => {
        if (!editable) return null;
        return (
            <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEdit(stepPath); }}
                className="absolute top-2 right-2 md:top-2 md:-right-2 p-1.5 bg-white border border-gray-200 hover:bg-career-blue hover:text-white text-gray-500 rounded-md transition-all opacity-100 z-50 flex items-center gap-1.5 text-xs font-medium shadow-sm cursor-pointer"
                aria-label="Edit section"
                title="Edit section"
            >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span className="hidden sm:inline">Edit</span>
            </button>
        );
    };

    const containerClasses = variant === 'preview'
        ? "relative bg-white rounded-xl shadow-lg p-4 md:p-8 border-2 border-gray-200 max-w-3xl w-full overflow-hidden"
        : "relative bg-white p-4 md:p-8 w-full h-full overflow-hidden";

    return (
        <div className={containerClasses}>
            {/* Content */}
            <div className="relative z-10">
                {/* Header - Centered */}
                <div className={`text-center mb-4 pb-4 w-full relative ${editable ? 'group hover:bg-gray-50/50 rounded-lg p-2 -mx-2 transition-colors' : ''}`}>
                    {renderEditButton('/builder/step-1')}
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 uppercase tracking-wide mb-2 break-all sm:break-words">
                        {fullName || 'YOUR NAME'}
                    </h1>
                    {headline && (
                        <p className="text-sm font-semibold text-gray-700 mb-3 break-words">{headline}</p>
                    )}
                    <div className="text-xs text-gray-600 flex justify-center items-center gap-2 flex-wrap text-center">
                        {location && <span className="break-all sm:break-words">{location}</span>}
                        {location && (email || phone || linkedin) && <span>|</span>}
                        {email && <span className="break-all sm:break-words">{email}</span>}
                        {email && (phone || linkedin) && <span>|</span>}
                        {phone && <span className="break-all sm:break-words">{phone}</span>}
                        {phone && linkedin && <span>|</span>}
                        {linkedin && <span className="break-all sm:break-words">{linkedin}</span>}
                    </div>
                </div>

                {/* Professional Summary */}
                {aboutText && (
                    <div className={`mb-5 relative ${editable ? 'group hover:bg-gray-50/50 rounded-lg p-2 -mx-2 transition-colors' : ''}`}>
                        {renderEditButton('/builder/step-3')}
                        <h2 className="text-base font-bold uppercase tracking-wide text-gray-900 border-b-2 border-gray-900 pb-1 mb-3">
                            PROFESSIONAL SUMMARY
                        </h2>
                        <p className="text-xs text-gray-800 leading-relaxed">
                            {aboutText}
                        </p>
                    </div>
                )}

                {/* Work Experience */}
                {experiences && experiences.length > 0 && (
                    <div className={`mb-5 relative ${editable ? 'group hover:bg-gray-50/50 rounded-lg p-2 -mx-2 transition-colors' : ''}`}>
                        {renderEditButton('/builder/step-4')}
                        <h2 className="text-base font-bold uppercase tracking-wide text-gray-900 border-b-2 border-gray-900 pb-1 mb-3">
                            WORK EXPERIENCE
                        </h2>
                        <div className="space-y-4">
                            {experiences.map((exp, index) => (
                                <div key={index}>
                                    <div className="flex flex-col sm:flex-row justify-between items-start mb-1 gap-1 sm:gap-4">
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-sm font-bold text-gray-900 break-words">{exp.title}</h3>
                                            <p className="text-xs text-gray-700 break-words">
                                                {exp.organization}{exp.location ? `, ${exp.location}` : ''}
                                            </p>
                                        </div>
                                        <p className="text-xs text-gray-600 whitespace-nowrap sm:ml-4 flex-shrink-0">
                                            {formatDate(exp.startDate)} – {exp.isCurrent ? 'Present' : formatDate(exp.endDate)}
                                        </p>
                                    </div>
                                    {exp.description && (
                                        <div className="text-xs text-gray-800 mt-2">
                                            {exp.description.split('\n').map((line, i) => (
                                                line.trim() && (
                                                    <div key={i} className="flex gap-2 mb-1">
                                                        <span className="text-gray-600">•</span>
                                                        <span className="flex-1">{line.trim().replace(/^[•\-]\s*/, '')}</span>
                                                    </div>
                                                )
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Education */}
                {highSchool && (
                    <div className={`mb-5 relative ${editable ? 'group hover:bg-gray-50/50 rounded-lg p-2 -mx-2 transition-colors' : ''}`}>
                        {renderEditButton('/builder/step-1')}
                        <h2 className="text-base font-bold uppercase tracking-wide text-gray-900 border-b-2 border-gray-900 pb-1 mb-3">
                            EDUCATION
                        </h2>
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-1 sm:gap-4">
                            <div className="min-w-0 flex-1">
                                <p className="text-xs text-gray-700 break-words break-all sm:break-normal">{highSchool}</p>
                            </div>
                            {graduationYear && (
                                <p className="text-xs text-gray-600 whitespace-nowrap sm:ml-4 flex-shrink-0">
                                    Graduated: {graduationYear}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Certifications */}
                {certifications && certifications.length > 0 && (
                    <div className={`mb-5 relative ${editable ? 'group hover:bg-gray-50/50 rounded-lg p-2 -mx-2 transition-colors' : ''}`}>
                        {renderEditButton('/builder/step-4')}
                        <h2 className="text-base font-bold uppercase tracking-wide text-gray-900 border-b-2 border-gray-900 pb-1 mb-3">
                            CERTIFICATIONS
                        </h2>
                        <div className="space-y-2">
                            {certifications.map((cert, index) => (
                                <div key={index} className="flex flex-col sm:flex-row justify-between items-start gap-1 sm:gap-4">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold text-gray-900 break-words break-all sm:break-normal">{cert.name}</p>
                                        {cert.issuer && <p className="text-xs text-gray-700 break-words break-all sm:break-normal">{cert.issuer}</p>}
                                    </div>
                                    {cert.dateIssued && (
                                        <p className="text-xs text-gray-600 whitespace-nowrap sm:ml-4 flex-shrink-0">
                                            {cert.dateIssued}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Skills */}
                {skills && skills.length > 0 && (
                    <div className={`mb-5 relative ${editable ? 'group hover:bg-gray-50/50 rounded-lg p-2 -mx-2 transition-colors' : ''}`}>
                        {renderEditButton('/builder/step-5')}
                        <h2 className="text-base font-bold uppercase tracking-wide text-gray-900 border-b-2 border-gray-900 pb-1 mb-3">
                            SKILLS
                        </h2>
                        <div className="space-y-1">
                            {skills.map((skill, index) => (
                                <div key={index} className="flex gap-2 text-xs text-gray-800">
                                    <span className="text-gray-600">•</span>
                                    <span>{skill}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}



                {/* Empty State */}
                {!fullName && !headline && !aboutText && !skills?.length && !experiences?.length && !highSchool && !certifications?.length && (
                    <div className="text-center py-12 text-gray-400">
                        <p className="text-sm">Your resume preview will appear here</p>
                        <p className="text-xs mt-1">Start filling in your information →</p>
                    </div>
                )}
            </div>
        </div>
    );
}
