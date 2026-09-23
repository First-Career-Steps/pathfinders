import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function ResumeBuilderPage() {
    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            {/* Main Content */}
            <main className="flex-1 bg-gradient-hero py-12 sm:py-20 px-4">
                <div className="max-w-6xl mx-auto">
                    {/* Hero Section */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl sm:text-5xl font-poppins font-bold text-charcoal mb-6">
                            Resume Builder
                        </h1>
                        <p className="text-lg text-charcoal-light max-w-2xl mx-auto mb-8">
                            Create a professional resume that stands out. Our AI-powered builder guides you through each step to craft the perfect resume in minutes.
                        </p>
                        <Link
                            href="/builder/step-1"
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-career-blue text-white font-semibold text-lg rounded-xl hover:bg-career-blue-dark transition-all duration-200 active:scale-[0.98] shadow-lg shadow-career-blue/25"
                        >
                            Start Building Resume
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                                />
                            </svg>
                        </Link>
                    </div>

                    {/* Steps Section */}
                    <div className="mb-12">
                        <h2 className="text-2xl sm:text-3xl font-poppins font-bold text-charcoal text-center mb-8">
                            Build Your Resume in 6 Simple Steps
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                {
                                    step: "1",
                                    title: "Your Story",
                                    description: "Tell us about yourself, your school, and interests",
                                    icon: "📝",
                                },
                                {
                                    step: "2",
                                    title: "AI Headlines",
                                    description: "Generate compelling professional headlines",
                                    icon: "✨",
                                },
                                {
                                    step: "3",
                                    title: "About Section",
                                    description: "Create an authentic bio that represents you",
                                    icon: "💬",
                                },
                                {
                                    step: "4",
                                    title: "Experience",
                                    description: "Transform activities into professional experiences",
                                    icon: "🎯",
                                },
                                {
                                    step: "5",
                                    title: "Skills",
                                    description: "Highlight your strongest abilities",
                                    icon: "💪",
                                },
                                {
                                    step: "6",
                                    title: "Review & Download",
                                    description: "Review your resume, then download a PDF for $1.99/year",
                                    icon: "📄",
                                },
                            ].map((feature, index) => (
                                <div
                                    key={index}
                                    className="bg-white rounded-2xl p-6 shadow-card hover:shadow-soft transition-shadow group"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="text-3xl">{feature.icon}</div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-semibold text-career-blue bg-soft-sky px-2 py-0.5 rounded-full">
                                                    Step {feature.step}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-poppins font-semibold text-charcoal mb-1">
                                                {feature.title}
                                            </h3>
                                            <p className="text-gray-600 text-sm">{feature.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CTA Section */}
                    <div className="bg-white rounded-2xl p-8 shadow-card text-center">
                        <h2 className="text-2xl font-poppins font-semibold text-charcoal mb-4">
                            Ready to Get Started?
                        </h2>
                        <p className="text-gray-600 mb-6 max-w-xl mx-auto">
                            Join thousands of students building their professional future. It only takes 10 minutes to create your resume.
                        </p>
                        <Link
                            href="/builder/step-1"
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-career-blue text-white font-semibold text-lg rounded-xl hover:bg-career-blue-dark transition-all duration-200 active:scale-[0.98] shadow-lg shadow-career-blue/25"
                        >
                            Start Building Now
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                                />
                            </svg>
                        </Link>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
