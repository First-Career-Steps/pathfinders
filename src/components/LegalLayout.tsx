import type { ReactNode } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function LegalLayout({ title, children }: { title: string; children: ReactNode }) {
  return <div className="min-h-screen bg-white"><Header /><main className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
    <nav aria-label="Legal pages" className="mb-6 flex gap-5 text-sm text-career-blue"><Link href="/privacy" className="underline">Privacy Policy</Link><Link href="/terms" className="underline">Terms of Service</Link></nav>
    <h1 className="font-poppins text-4xl font-bold text-charcoal">{title}</h1>
    <p className="mt-3 text-sm text-gray-600">Effective September 24, 2026 · Pathfinders Ventures LLC · Columbus, Ohio</p>
    <div className="mt-8 space-y-7 text-base leading-relaxed text-gray-700 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-charcoal [&_p+p]:mt-3 [&_a]:text-career-blue [&_a]:underline">{children}</div>
  </main><Footer /></div>;
}
