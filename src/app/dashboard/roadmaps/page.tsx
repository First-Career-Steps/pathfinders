'use client';

import { privateAssetUrl } from '@/lib/student-privacy';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createBrowserClient } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';
import type { CareerRoadmap } from '@/types/roadmap';

interface RoadmapRecord {
    id: string;
    career_name: string;
    roadmap_data: CareerRoadmap;
    infographic_url: string | null;
    milestone_roadmap_url: string | null;
    created_at: string;
    updated_at: string;
}

export default function RoadmapsPage() {
    const { user } = useAuth();
    const [roadmaps, setRoadmaps] = useState<RoadmapRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRoadmap, setSelectedRoadmap] = useState<RoadmapRecord | null>(null);

    useEffect(() => {
        fetchRoadmaps();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const fetchRoadmaps = async () => {
        if (!user) return;

        try {
            const supabase = createBrowserClient();
            const { data, error } = await supabase
                .from('career_roadmaps')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRoadmaps((data || []).map(row => ({ ...row, infographic_url: privateAssetUrl(row.infographic_url) || null, milestone_roadmap_url: privateAssetUrl(row.milestone_roadmap_url) || null })));
        } catch (error) {
            console.error('Error fetching roadmaps:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRoadmap = async (roadmapId: string) => {
        if (!confirm('Are you sure you want to delete this roadmap? This action cannot be undone.')) {
            return;
        }

        try {
            const supabase = createBrowserClient();
            const { error } = await supabase
                .from('career_roadmaps')
                .delete()
                .eq('id', roadmapId);

            if (error) throw error;

            // Refresh the list
            fetchRoadmaps();
            if (selectedRoadmap?.id === roadmapId) {
                setSelectedRoadmap(null);
            }
        } catch (error) {
            console.error('Error deleting roadmap:', error);
            alert('Failed to delete roadmap. Please try again.');
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

    if (selectedRoadmap) {
        return (
            <RoadmapDetailView
                roadmap={selectedRoadmap}
                onBack={() => setSelectedRoadmap(null)}
                onDelete={handleDeleteRoadmap}
            />
        );
    }

    return (
        <div className="p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-charcoal mb-2">My Career Roadmaps</h1>
                        <p className="text-gray-600">View and manage your personalized career roadmaps</p>
                    </div>
                    <Link
                        href="/career-roadmap"
                        className="px-6 py-3 bg-career-blue text-white font-semibold rounded-lg hover:bg-career-blue-dark transition-colors text-center w-full sm:w-auto"
                    >
                        + Create New Roadmap
                    </Link>
                </div>

                {/* Roadmaps List */}
                {roadmaps.length === 0 ? (
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
                                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                            />
                        </svg>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No roadmaps yet</h3>
                        <p className="text-gray-600 mb-6">
                            Create your first career roadmap to get started on your journey
                        </p>
                        <Link
                            href="/career-roadmap"
                            className="inline-block px-6 py-3 bg-career-blue text-white font-semibold rounded-lg hover:bg-career-blue-dark transition-colors"
                        >
                            Create Your First Roadmap
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {roadmaps.map((roadmap) => (
                            <div
                                key={roadmap.id}
                                className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow"
                            >
                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                    <div className="flex-1 w-full">
                                        <h3 className="text-xl font-bold text-charcoal mb-2 break-words">
                                            {roadmap.career_name}
                                        </h3>
                                        <p className="text-sm text-gray-600 mb-4">
                                            Created: {new Date(roadmap.created_at).toLocaleDateString()}
                                        </p>
                                        {roadmap.infographic_url && (
                                            <Image
                                                src={roadmap.infographic_url}
                                                alt={`${roadmap.career_name} Infographic`}
                                                width={400}
                                                height={225}
                                                unoptimized
                                                className="w-full max-w-md h-auto rounded-lg mb-4"
                                            />
                                        )}
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                                        <button
                                            onClick={() => setSelectedRoadmap(roadmap)}
                                            className="px-4 py-2 bg-career-blue text-white font-medium rounded-lg hover:bg-career-blue-dark transition-colors text-center"
                                        >
                                            View Details
                                        </button>
                                        <button
                                            onClick={() => handleDeleteRoadmap(roadmap.id)}
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
            </div>
        </div>
    );
}

function RoadmapDetailView({
    roadmap,
    onBack,
    onDelete,
}: {
    roadmap: RoadmapRecord;
    onBack: () => void;
    onDelete: (id: string) => void;
}) {
    const { roadmap_data: roadmapData, infographic_url, milestone_roadmap_url } = roadmap;
    const [viewImage, setViewImage] = useState<string | null>(null);

    const handleDownload = async (url: string, filename: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Download failed:', error);
            // Fallback to opening in new tab
            window.open(url, '_blank');
        }
    };

    return (
        <div className="p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={onBack}
                        className="mb-4 text-career-blue hover:text-career-blue-dark font-medium flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Roadmaps
                    </button>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-bold text-charcoal mb-2 break-words">
                                {roadmapData.careerName} Career Roadmap
                            </h1>
                            <p className="text-gray-600">
                                Created: {new Date(roadmap.created_at).toLocaleDateString()}
                            </p>
                        </div>
                        <button
                            onClick={() => onDelete(roadmap.id)}
                            className="px-4 py-2 border-2 border-red-500 text-red-500 font-medium rounded-lg hover:bg-red-50 transition-colors text-center w-full sm:w-auto"
                        >
                            Delete
                        </button>
                    </div>
                </div>

                {/* Images */}
                {(infographic_url || milestone_roadmap_url) && (
                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                        {infographic_url && (
                            <div className="bg-white rounded-2xl shadow-sm p-6">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 gap-4">
                                    <h2 className="text-2xl font-bold text-charcoal">
                                        Career Roadmap Infographic
                                    </h2>
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
                                        <button
                                            onClick={() => setViewImage(infographic_url)}
                                            className="px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
                                        >
                                            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            <span className="whitespace-nowrap">View</span>
                                        </button>
                                        <button
                                            onClick={() => handleDownload(infographic_url, `${roadmapData.careerName}-Infographic.png`)}
                                            className="px-4 py-2 bg-career-blue text-white font-medium rounded-lg hover:bg-career-blue-dark transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
                                        >
                                            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                            <span className="whitespace-nowrap">Download</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="relative group">
                                    <Image
                                        src={infographic_url}
                                        alt={`${roadmapData.careerName} Career Roadmap Infographic`}
                                        width={800}
                                        height={450}
                                        unoptimized
                                        className="w-full h-auto rounded-lg"
                                    />
                                </div>
                            </div>
                        )}
                        {milestone_roadmap_url && (
                            <div className="bg-white rounded-2xl shadow-sm p-6">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 gap-4">
                                    <h2 className="text-2xl font-bold text-charcoal">
                                        Milestone Roadmap
                                    </h2>
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
                                        <button
                                            onClick={() => setViewImage(milestone_roadmap_url)}
                                            className="px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
                                        >
                                            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            <span className="whitespace-nowrap">View</span>
                                        </button>
                                        <button
                                            onClick={() => handleDownload(milestone_roadmap_url, `${roadmapData.careerName}-Milestone-Roadmap.png`)}
                                            className="px-4 py-2 bg-career-blue text-white font-medium rounded-lg hover:bg-career-blue-dark transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
                                        >
                                            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                            <span className="whitespace-nowrap">Download</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="relative group">
                                    <Image
                                        src={milestone_roadmap_url}
                                        alt={`${roadmapData.careerName} Milestone Roadmap`}
                                        width={800}
                                        height={450}
                                        unoptimized
                                        className="w-full h-auto rounded-lg"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Content */}
                <div className="bg-white rounded-2xl shadow-sm p-8">
                    <div className="prose max-w-none">
                        {/* Key Skills */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-charcoal mb-4">Key Skills to Learn</h2>
                            <ul className="list-disc list-inside space-y-2">
                                {roadmapData.keySkills.map((skill, index) => (
                                    <li key={index} className="text-gray-700">{skill}</li>
                                ))}
                            </ul>
                        </section>

                        {/* Tools */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-charcoal mb-4">Tools & Software to Master</h2>
                            <ul className="list-disc list-inside space-y-2">
                                {roadmapData.tools.map((tool, index) => (
                                    <li key={index} className="text-gray-700">{tool}</li>
                                ))}
                            </ul>
                        </section>

                        {/* Courses */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-charcoal mb-4">Recommended Free Courses</h2>
                            <div className="space-y-4">
                                {roadmapData.courses.map((course, index) => (
                                    <div key={index} className="border-l-4 border-career-blue pl-4 py-2">
                                        <h3 className="font-semibold text-lg text-charcoal mb-1">
                                            {index + 1}. {course.name}
                                        </h3>
                                        <a
                                            href={course.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-career-blue hover:text-career-blue-dark underline mb-2 block"
                                        >
                                            {course.link}
                                        </a>
                                        <p className="text-gray-700">{course.reason}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Steps */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-charcoal mb-4">Step-by-Step Plan</h2>
                            <div className="space-y-6">
                                {roadmapData.steps.map((step) => (
                                    <div key={step.step} className="border rounded-lg p-6">
                                        <div className="flex items-start gap-4">
                                            <div className="flex-shrink-0 w-12 h-12 bg-career-blue text-white rounded-full flex items-center justify-center font-bold text-lg">
                                                {step.step}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-xl font-semibold text-charcoal mb-2">
                                                    {step.title}
                                                </h3>
                                                <p className="text-gray-700 mb-2">{step.description}</p>
                                                {step.hashtags && step.hashtags.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mt-3">
                                                        {step.hashtags.map((tag, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                                                            >
                                                                #{tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Timeline */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-charcoal mb-4">Estimated Timeline</h2>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-lg text-gray-700">{roadmapData.timeline}</p>
                            </div>
                        </section>

                        {/* Starter Projects */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-charcoal mb-4">Starter Projects</h2>
                            <ul className="list-disc list-inside space-y-2">
                                {roadmapData.starterProjects.map((project, index) => (
                                    <li key={index} className="text-gray-700">{project}</li>
                                ))}
                            </ul>
                        </section>

                        {/* Communities */}
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-charcoal mb-4">Communities & Hashtags</h2>
                            <ul className="list-disc list-inside space-y-2 mb-4">
                                {roadmapData.communities.map((community, index) => (
                                    <li key={index} className="text-gray-700">{community}</li>
                                ))}
                            </ul>
                            {roadmapData.hashtags && roadmapData.hashtags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {roadmapData.hashtags.map((tag, idx) => (
                                        <span
                                            key={idx}
                                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                                        >
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/career-roadmap"
                        className="px-6 py-3 bg-career-blue text-white font-semibold rounded-lg hover:bg-career-blue-dark transition-colors text-center w-full sm:w-auto"
                    >
                        Create Another Roadmap
                    </Link>
                    <button
                        onClick={onBack}
                        className="px-6 py-3 border-2 border-career-blue text-career-blue font-semibold rounded-lg hover:bg-soft-sky transition-colors text-center w-full sm:w-auto"
                    >
                        Back to All Roadmaps
                    </button>
                </div>
            </div>

            {/* Image View Modal */}
            {viewImage && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
                    onClick={() => setViewImage(null)}
                >
                    <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center">
                        <button
                            onClick={() => setViewImage(null)}
                            className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 hover:bg-gray-200 transition-colors shadow-lg"
                            aria-label="Close"
                        >
                            <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <Image
                            src={viewImage}
                            alt="Roadmap view"
                            width={1200}
                            height={800}
                            unoptimized
                            className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
