"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { BuilderLayout } from "@/components/layout";
import { Button, Card } from "@/components/ui";
import { useProfile } from "@/contexts/ProfileContext";
import { requestResumeAI, requireAILines } from "@/lib/resume-ai-client";
import { LiveResumePreview } from "@/components/LiveResumePreview";

export default function Step2Page() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, updateProfile, setCurrentStep } = useProfile();

  const [headline, setHeadline] = useState(profile.headline || "");
  const [generatedHeadlines, setGeneratedHeadlines] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setCurrentStep(2);
  }, [setCurrentStep]);

  // Load profile data when component mounts or profile changes
  useEffect(() => {
    if (profile.headline) {
      setHeadline(profile.headline);
    }
  }, [profile.headline]);

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    setError("");

    try {
      const data = await requestResumeAI('/api/ai/enhance-headline', {
        interests: profile.interests,
        school: profile.highSchool,
        graduationYear: profile.graduationYear,
        currentHeadline: headline.trim() || undefined,
      });
      setGeneratedHeadlines(requireAILines(data.suggestions));
    } catch (error) {
      console.error('AI Generation Error:', error);
      setError(error instanceof Error ? error.message : 'AI writing is temporarily unavailable. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const selectHeadline = (selected: string) => {
    setHeadline(selected);
    setError("");
  };

  const validateForm = () => {
    if (!headline.trim()) {
      setError("Please enter a headline");
      return false;
    }
    if (headline.length > 120) {
      setError("Headline must be 120 characters or less");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateForm()) return;

    updateProfile({ headline });
    setCurrentStep(3);
    router.push("/builder/step-3");
  };

  const handleBack = () => {
    setCurrentStep(1);
    router.push("/builder/step-1");
  };

  return (
    <BuilderLayout
      currentStep={2}
      title="Create Your Headline"
      subtitle="Make a great first impression"
      onBack={handleBack}
    >
      {/* Two Column Layout */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column - Form */}
        <div className="flex-1 space-y-6">
          {/* Instructions */}
          <Card shadow="none" className="bg-soft-sky border border-career-blue/20" padding="md">
            <div className="flex gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <p className="text-sm text-charcoal font-medium mb-1">
                  Tips for a great headline:
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Keep it short and memorable (under 120 characters)</li>
                  <li>• Include your current status (student, year)</li>
                  <li>• Mention your key interest or goal</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Manual Input */}
          <Card shadow="sm" padding="lg">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Your Headline <span className="text-red-500">*</span>
              </label>
              <textarea
                value={headline}
                onChange={(e) => {
                  setHeadline(e.target.value);
                  setError("");
                }}
                placeholder="e.g., Aspiring Software Developer | Class of 2026"
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-career-blue focus:outline-none resize-none"
                maxLength={120}
              />
              <div className="flex justify-between text-xs">
                <span role="alert" className="text-red-500">{error}</span>
                <span className={headline.length > 120 ? "text-red-500" : "text-gray-500"}>
                  {headline.length}/120 characters
                </span>
              </div>
            </div>

            {/* AI Generate Button - Below Input */}
            <div className="mt-4">
              <Button
                onClick={handleGenerateAI}
                loading={isGenerating}
                fullWidth
                variant="secondary"
                leftIcon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                }
              >
                {isGenerating ? "Generating..." : "✨ Generate AI Headlines"}
              </Button>
            </div>
          </Card>

          {/* Generated Headlines */}
          {generatedHeadlines.length > 0 && (
            <Card shadow="sm" padding="lg">
              <div className="space-y-3">
                <p className="text-sm font-medium text-charcoal">
                  Click to select a headline:
                </p>
                {generatedHeadlines.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => selectHeadline(option)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${headline === option
                      ? "border-career-blue bg-soft-sky"
                      : "border-gray-200 hover:border-career-blue/50 bg-white"
                      }`}
                  >
                    <p className="text-charcoal">{option}</p>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleBack} className="flex-1">
              Back
            </Button>
            <Button onClick={handleNext} className="flex-1" disabled={!headline.trim()}>
              Continue
            </Button>
          </div>
        </div>

        {/* Right Column - Live Preview */}
        <div className="flex-1 lg:sticky lg:top-6 h-fit">
          <h3 className="text-lg font-bold text-charcoal mb-4">Live Preview</h3>
          <LiveResumePreview
            fullName={profile.fullName}
            email={user?.email}
            phone={profile.phone}
            location={profile.location}
            linkedin={profile.linkedin}
            headline={headline}
            aboutText={profile.generatedAbout}
            highSchool={profile.highSchool}
            graduationYear={profile.graduationYear}
            experiences={profile.experiences}
            certifications={profile.certifications}
          />
        </div>
      </div>
    </BuilderLayout>
  );
}
