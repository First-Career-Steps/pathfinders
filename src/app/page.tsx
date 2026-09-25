"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import VideoModal from "@/components/VideoModal";

export default function HomePage() {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <VideoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        videoId="J0_67p8GHIs"
      />

      {/* Hero Section */}
      <section className="relative flex-1 bg-gradient-hero overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-career-blue/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-step-green/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-optimism-orange/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20 lg:py-28">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Hero Content */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full mb-6 animate-fade-in">
                <span className="w-2 h-2 bg-step-green rounded-full animate-pulse" />
                <span className="text-sm font-medium text-charcoal">
                  Built for students · Made in Columbus, Ohio
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-poppins font-bold text-charcoal leading-tight mb-6 animate-slide-up">
                Take your{" "}
                <span className="text-gradient">first career steps</span>
                <br />
                with confidence.
              </h1>

              <p className="text-lg sm:text-xl text-charcoal-light max-w-xl mx-auto lg:mx-0 mb-8 animate-slide-up">
                Turn school, volunteering and everyday experience into a resume. Then get step-by-step help setting up LinkedIn.
              </p>

              <p className="mb-5 text-center lg:text-left text-sm font-semibold text-charcoal">Preview your resume free. PDF downloads are $1.99/year, billed annually.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-slide-up">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-career-blue text-white font-semibold text-lg rounded-xl hover:bg-career-blue-dark transition-all duration-200 active:scale-[0.98] shadow-lg shadow-career-blue/25"
                >
                  Build My Resume
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
                <button
                  onClick={() => setIsVideoModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-charcoal font-semibold text-lg rounded-xl hover:bg-gray-50 transition-all duration-200 border-2 border-gray-200"
                >
                  <svg
                    className="w-5 h-5 text-career-blue"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  See How It Works
                </button>
              </div>
            </div>


            {/* Hero Illustration */}
            <div className="flex-1 relative animate-scale-in">
              <div className="relative w-full max-w-md mx-auto">
                {/* Hero Image */}
                <div className="bg-white rounded-[3rem] p-3 shadow-2xl shadow-charcoal/10 border border-gray-100">
                  <div className="rounded-[2.5rem] overflow-hidden">
                    <Image
                      src="/hero section image/hero-image.svg"
                      alt="Professional Profile Preview"
                      width={400}
                      height={711}
                      className="w-full h-auto"
                      priority
                    />
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 bg-white rounded-2xl p-3 shadow-lg animate-bounce">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 bg-step-green rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </span>
                    <span className="text-sm font-medium text-charcoal">
                      Resume Complete!
                    </span>
                  </div>
                </div>

                <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl p-3 shadow-lg">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 bg-career-blue rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                    </span>
                    <span className="text-sm font-medium text-charcoal">
                      AI-Powered
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="bg-white border-t border-gray-100 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                ),
                title: "Built for Students",
                description:
                  "Designed specifically for high school and college students with no prior experience needed.",
                color: "career-blue",
              },
              {
                icon: (
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                ),
                title: "You're in Control",
                description:
                  "Our AI suggests the words. You review and edit everything before you download or share it.",
                color: "step-green",
              },
              {
                icon: (
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                ),
                title: "One Guided Process",
                description:
                  "Our AI-powered tools help you create a professional profile quickly and easily.",
                color: "optimism-orange",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="flex flex-col items-center text-center p-6 rounded-2xl hover:bg-soft-sky/30 transition-colors"
              >
                <div
                  className={`w-16 h-16 rounded-2xl bg-${item.color}/10 flex items-center justify-center mb-4 text-${item.color}`}
                  style={{
                    backgroundColor:
                      item.color === "career-blue"
                        ? "rgba(30, 136, 229, 0.1)"
                        : item.color === "step-green"
                          ? "rgba(67, 160, 71, 0.1)"
                          : "rgba(251, 140, 0, 0.1)",
                    color:
                      item.color === "career-blue"
                        ? "#1E88E5"
                        : item.color === "step-green"
                          ? "#43A047"
                          : "#FB8C00",
                  }}
                >
                  {item.icon}
                </div>
                <h3 className="text-lg font-poppins font-semibold text-charcoal mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gradient-to-b from-white to-soft-sky/30 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-poppins font-bold text-charcoal mb-4">
              Everything you need to stand out
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our step-by-step builder guides you through creating a complete
              professional presence.
            </p>
          </div>

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
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-brand py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-poppins font-bold text-white mb-4">
            Ready to take your first step?
          </h2>
          <p className="text-lg text-white/90 mb-8 max-w-xl mx-auto">
            Start building your first resume and professional profile today. It takes
            about 10 minutes.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-career-blue font-semibold text-lg rounded-xl hover:bg-soft-sky transition-all duration-200 active:scale-[0.98] shadow-lg"
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
      </section>

      {/* Footer */}
      <footer className="bg-charcoal text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Footer Navigation */}
          <nav aria-label="Legal" className="flex flex-wrap justify-center gap-6 text-sm">
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
            <Link href="/terms" className="hover:underline">Terms of Service</Link>
          </nav>
          {/* Internal navigation removed as requested */}

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
              © {new Date().getFullYear()} Pathfinders Ventures LLC.
              FirstCareerSteps is made in Columbus, Ohio.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
