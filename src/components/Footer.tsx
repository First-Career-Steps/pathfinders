
import Link from "next/link";
import Image from "next/image";

export default function Footer() {
    return (
        <footer className="bg-charcoal text-white py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <nav className="flex flex-wrap gap-6 text-sm" aria-label="Footer">
                    <Link href="/for-educators" className="hover:underline">First resume workshop</Link>
                    <Link href="/resume-builder" className="hover:underline">Resume builder</Link>
                </nav>
                <p className="mt-5 max-w-2xl text-xs leading-relaxed text-gray-400">To understand which links lead to purchases, we may keep campaign labels in a first-party cookie for up to 30 days and include them with your checkout record. These labels do not contain your resume text or contact details.</p>


                {/* Divider */}
                <div className="border-t border-gray-700 my-8" />

                {/* Logo and Copyright */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                    <Image
                        src="/logo.svg"
                        alt="FirstCareerSteps"
                        width={200}
                        height={45}
                        className="h-11 w-auto"
                    />
                    <p className="text-gray-400 text-sm text-center">
                        © {new Date().getFullYear()} FirstCareerSteps. Built for your first career steps.
                    </p>
                </div>
            </div>
        </footer>
    );
}
