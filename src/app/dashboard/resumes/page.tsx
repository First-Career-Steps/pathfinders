'use client';

import { privateAssetUrl } from '@/lib/student-privacy';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createBrowserClient } from '@/lib/supabase';
import Link from 'next/link';
import LinkedInContentModal from '@/components/LinkedInContentModal';
import type { LinkedInContent } from '@/types/linkedin';
import { useProfile } from '@/contexts/ProfileContext';

interface Resume {
    id: string;
    title: string;
    status: 'paid' | 'draft';
    pdf_url: string | null;
    shareable_link: string | null;
    linkedin_content: string | null;
    created_at: string;
    updated_at: string;
    version: number;
}

const FETCH_DEBOUNCE_MS = 1500;

export default function ResumesPage() {
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const { profile } = useProfile();
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreatedBanner, setShowCreatedBanner] = useState(false);
    const [showLinkedInModal, setShowLinkedInModal] = useState(false);
    const [linkedInContent, setLinkedInContent] = useState<LinkedInContent | null>(null);
    const [generatingLinkedIn, setGeneratingLinkedIn] = useState(false);

    const lastFetchRef = useRef<{ userId: string; at: number } | null>(null);
    const hasFetchedOnceRef = useRef(false);

    const fetchResumes = useCallback(async (showLoadingSpinner = true) => {
        if (!user) return;

        const now = Date.now();
        const last = lastFetchRef.current;
        if (last?.userId === user.id && now - last.at < FETCH_DEBOUNCE_MS) {
            return;
        }
        lastFetchRef.current = { userId: user.id, at: now };

        if (showLoadingSpinner && !hasFetchedOnceRef.current) {
            setLoading(true);
        }

        try {
            const supabase = createBrowserClient();
            const { data, error } = await supabase
                .from('resumes')
                .select('*')
                .eq('user_id', user.id)
                .in('status', ['paid', 'draft'])
                .order('created_at', { ascending: false });

            if (error) throw error;
            hasFetchedOnceRef.current = true;
            setResumes((data || []).map(row => ({ ...row, pdf_url: privateAssetUrl(row.pdf_url) || null })));
        } catch (error) {
            console.error('Error fetching resumes:', error);
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    // Show "Resume created!" banner when coming from subscription generate (created=1)
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (searchParams.get('created') === '1') {
            setShowCreatedBanner(true);
            window.history.replaceState({}, '', '/dashboard/resumes');
        }
    }, [searchParams]);

    // Fetch once per user id; optional delayed refresh when coming from checkout
    useEffect(() => {
        if (!user?.id) {
            setLoading(false);
            return;
        }
        hasFetchedOnceRef.current = false;
        fetchResumes(true);

        const paymentCompleted = sessionStorage.getItem('payment_completed');
        const resumeCreated = sessionStorage.getItem('resume_created');

        if (paymentCompleted === 'true' || resumeCreated === 'true') {
            sessionStorage.removeItem('payment_completed');
            sessionStorage.removeItem('resume_created');
            const t = setTimeout(() => fetchResumes(false), 2000);
            return () => clearTimeout(t);
        }
    }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    // Refresh when tab becomes visible again (e.g. return from checkout in another tab)
    useEffect(() => {
        if (!user?.id) return;

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                lastFetchRef.current = null;
                fetchResumes(false);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [user?.id, fetchResumes]);

    // Removed PDF generation polling since it is now done on-the-fly client-side

    const handleDeleteResume = async (resumeId: string) => {
        if (!confirm('Are you sure you want to delete this resume? This action cannot be undone.')) {
            return;
        }

        try {
            const supabase = createBrowserClient();
            const { error } = await supabase
                .from('resumes')
                .delete()
                .eq('id', resumeId);

            if (error) throw error;

            // Refresh the list without full-page loading
            fetchResumes(false);
        } catch (error) {
            console.error('Error deleting resume:', error);
            alert('Failed to delete resume. Please try again.');
        }
    };

    const handleGenerateLinkedIn = async (resumeId: string) => {

        setLinkedInContent(null);
        setGeneratingLinkedIn(true);
        setShowLinkedInModal(true);

        try {
            const response = await fetch('/api/ai/generate-linkedin-profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ resumeId }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || 'Failed to generate LinkedIn content');
            }

            const data = await response.json();
            setLinkedInContent(data);
            setResumes(current => current.map(resume => resume.id === resumeId ? { ...resume, linkedin_content: JSON.stringify(data) } : resume));
        } catch (error) {
            console.error('Error generating LinkedIn content:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to generate LinkedIn content. Please try again.';
            alert(errorMessage);
            setShowLinkedInModal(false);
        } finally {
            setGeneratingLinkedIn(false);
        }
    };

    // We now show both 'paid' and 'draft' statuses
    if (loading) {
        return (
            <div className="p-8">
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-career-blue"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="max-w-6xl mx-auto">
                {/* Success banner when resume just created (subscription flow) */}
                {showCreatedBanner && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between">
                        <p className="text-green-800 font-medium">Resume created! It&apos;s ready below.</p>
                        <button
                            type="button"
                            onClick={() => setShowCreatedBanner(false)}
                            className="text-green-600 hover:text-green-800 p-1"
                            aria-label="Dismiss"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-charcoal mb-2">My Resumes</h1>
                        <p className="text-gray-600">Your saved resumes are private. Download a copy when you are ready to share it, or prepare your LinkedIn guide.</p>
                    </div>
                    <Link
                        href="/builder/step-1"
                        className="px-6 py-3 bg-career-blue text-white font-semibold rounded-lg hover:bg-career-blue-dark transition-colors text-center w-full sm:w-auto"
                    >
                        + Create New Resume
                    </Link>
                </div>

                {/* Resumes List */}
                {resumes.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <svg
                            className="w-16 h-16 text-gray-300 mx-auto mb-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No resumes yet</h3>
                        <p className="text-gray-600 mb-6">
                            Create your first professional resume to get started
                        </p>
                        <Link
                            href="/builder/step-1"
                            className="inline-block px-6 py-3 bg-career-blue text-white font-semibold rounded-lg hover:bg-career-blue-dark transition-colors"
                        >
                            Create Your First Resume
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {resumes.map((resume) => (
                            <div
                                key={resume.id}
                                className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow"
                            >
                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                    <div className="flex-1 w-full">
                                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                                            <h3 className="text-xl font-bold text-charcoal break-words">{resume.title}</h3>
                                            {resume.status === 'draft' ? (
                                                <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 whitespace-nowrap">
                                                    Draft
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700 whitespace-nowrap">
                                                    Ready to Download
                                                </span>
                                            )}
                                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700 whitespace-nowrap">
                                                v{resume.version || 1}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            Created: {new Date(resume.created_at).toLocaleDateString()}
                                        </p>
                                        {resume.updated_at !== resume.created_at && (
                                            <p className="text-sm text-gray-600">
                                                Updated: {new Date(resume.updated_at).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                                        {resume.status === 'draft' ? (
                                            <Link
                                                href="/builder/review"
                                                className="px-4 py-2 bg-career-blue text-white font-medium rounded-lg hover:bg-career-blue-dark transition-colors text-center"
                                            >
                                                Continue Editing
                                            </Link>
                                        ) : (
                                            <>
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            window.open(`/resume/${resume.id}?download=true`, '_blank', 'noopener,noreferrer');
                                                        }}
                                                        className="px-4 py-2 bg-career-blue text-white font-medium rounded-lg hover:bg-career-blue-dark transition-colors text-center"
                                                    >
                                                        Download PDF
                                                    </button>
                                                    <Link href={`/resume/${resume.id}`} target="_blank" rel="noopener noreferrer" className="px-4 py-2 border-2 border-career-blue text-career-blue font-medium rounded-lg text-center">Private preview</Link>
                                                </>
                                                {resume.linkedin_content ? (
                                                    <Link
                                                        href={`/dashboard/resumes/${resume.id}/linkedin`}
                                                        className="px-4 py-2 bg-[#0077B5] text-white font-medium rounded-lg hover:bg-[#006399] transition-colors flex justify-center items-center gap-2"
                                                    >
                                                        <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                                        </svg>
                                                        <span className="whitespace-nowrap">Open LinkedIn Guide</span>
                                                    </Link>
                                                ) : (
                                                    <button
                                                        onClick={() => handleGenerateLinkedIn(resume.id)}
                                                        className="px-4 py-2 bg-[#0077B5] text-white font-medium rounded-lg hover:bg-[#006399] transition-colors flex justify-center items-center gap-2"
                                                    >
                                                        <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                                        </svg>
                                                        <span className="whitespace-nowrap">Prepare LinkedIn Guide</span>
                                                    </button>
                                                )}
                                            </>
                                        )}
                                        <button
                                            onClick={() => handleDeleteResume(resume.id)}
                                            className="px-4 py-2 border-2 border-red-500 text-red-500 font-medium rounded-lg hover:bg-red-50 transition-colors text-center"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* LinkedIn Content Modal */}
                <LinkedInContentModal
                    isOpen={showLinkedInModal}
                    onClose={() => setShowLinkedInModal(false)}
                    content={linkedInContent}
                    loading={generatingLinkedIn}
                    userName={profile?.fullName || undefined}
                    userPhoto={profile?.photoUrl || undefined}
                />
            </div>
        </div>
    );
}
