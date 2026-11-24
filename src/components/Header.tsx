'use client';

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
// Updated navigation - removed LinkedIn Builder, renamed to Builder

export default function Header() {
    const { user, loading, signOut } = useAuth();
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        try {
            setIsLoggingOut(true);
            await signOut();
            router.push('/');
            router.refresh();
        } catch (error) {
            console.error('Error signing out:', error);
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <header className="w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
                <div className="flex items-center justify-between">
                    <Link href="/">
                        <Image
                            src="/logo.svg"
                            alt="FirstCareerSteps"
                            width={240}
                            height={55}
                            className="h-9 sm:h-10 md:h-14 w-auto"
                        />
                    </Link>



                    <div className="hidden lg:block"><nav aria-label="Products" className="flex gap-5 text-sm font-semibold text-career-blue-dark"><Link href="/learn">Courses &amp; assessments</Link><Link href="/resume-builder">Resume Builder</Link></nav></div>
                    <div className="flex items-center gap-3 md:gap-4">
                        {loading ? (
                            // Show loading state
                            <div className="flex items-center gap-3 md:gap-4">
                                <div className="w-14 md:w-20 h-6 md:h-8 bg-gray-200 animate-pulse rounded"></div>
                                <div className="w-20 md:w-24 h-8 md:h-10 bg-gray-200 animate-pulse rounded-lg md:rounded-xl"></div>
                            </div>
                        ) : user ? (
                            // Show Dashboard and Logout when user is logged in
                            <>
                                <Link
                                    href="/dashboard"
                                    className="text-xs md:text-sm font-semibold text-charcoal hover:text-career-blue transition-colors uppercase tracking-tight md:tracking-wide whitespace-nowrap"
                                >
                                    Dashboard
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    disabled={isLoggingOut}
                                    className="px-3 py-2 md:px-5 md:py-2.5 text-xs md:text-base bg-career-blue text-white font-medium rounded-lg md:rounded-xl hover:bg-career-blue-dark transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                >
                                    {isLoggingOut ? 'Logging out...' : 'Logout'}
                                </button>
                            </>
                        ) : (
                            // Show Sign In and Get Started when user is not logged in
                            <>
                                <Link
                                    href="/login"
                                    className="text-xs md:text-sm font-semibold text-charcoal hover:text-career-blue transition-colors uppercase tracking-tight md:tracking-wide whitespace-nowrap"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    href="/signup"
                                    className="px-3 py-2 md:px-5 md:py-2.5 text-xs md:text-base bg-career-blue text-white font-medium rounded-lg md:rounded-xl hover:bg-career-blue-dark transition-all duration-200 active:scale-[0.98] whitespace-nowrap"
                                >
                                    Get Started
                                </Link>
                            </>
                        )}


                    </div>
                </div>
                <div className="lg:hidden pt-2"><nav aria-label="Products" className="flex gap-5 text-sm font-semibold text-career-blue-dark"><Link href="/learn">Courses &amp; assessments</Link><Link href="/resume-builder">Resume Builder</Link></nav></div>
            </div>
        </header>
    );
}
