"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { BuilderLayout } from "@/components/layout";
import { Button, TextArea, Card } from "@/components/ui";
import { useProfile } from "@/contexts/ProfileContext";
import { requestResumeAI, requireAIText } from "@/lib/resume-ai-client";
import { LiveResumePreview } from "@/components/LiveResumePreview";

export default function Step3Page() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, updateProfile, setCurrentStep } = useProfile();

  const [formData, setFormData] = useState({
    aboutMe: profile.aboutMe || "",
    proudestAccomplishment: profile.proudestAccomplishment || "",
    futureGoals: profile.futureGoals || "",
  });

  const [generatedAbout, setGeneratedAbout] = useState(profile.generatedAbout || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setCurrentStep(3);
  }, [setCurrentStep]);

  // Load profile data when component mounts or profile changes
  useEffect(() => {
    setFormData({
      aboutMe: profile.aboutMe || "",
      proudestAccomplishment: profile.proudestAccomplishment || "",
      futureGoals: profile.futureGoals || "",
    });
    if (profile.generatedAbout) {
      setGeneratedAbout(profile.generatedAbout);
    }
  }, [profile.aboutMe, profile.proudestAccomplishment, profile.futureGoals, profile.generatedAbout]);

  const handleGenerateAI = async () => {
    // Validate inputs
    const newErrors: Record<string, string> = {};
    if (!formData.aboutMe.trim()) newErrors.aboutMe = "Required";
    if (!formData.proudestAccomplishment.trim()) newErrors.proudestAccomplishment = "Required";
    if (!formData.futureGoals.trim()) newErrors.futureGoals = "Required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsGenerating(true);
    setErrors({});

    try {
      const data = await requestResumeAI('/api/ai/enhance-about', {
        aboutMe: formData.aboutMe,
        accomplishment: formData.proudestAccomplishment,
        goals: formData.futureGoals,
      });
      setGeneratedAbout(requireAIText(data.enhancedText));
    } catch (error) {
      console.error('AI Error:', error);
      setErrors({ generated: error instanceof Error ? error.message : 'AI writing is temporarily unavailable. Please try again.' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNext = () => {
    if (!generatedAbout.trim()) {
      setErrors({ generated: "Please generate or write your About section" });
      return;
    }

    updateProfile({
      aboutMe: formData.aboutMe,
      proudestAccomplishment: formData.proudestAccomplishment,
      futureGoals: formData.futureGoals,
      generatedAbout,
    });

    setCurrentStep(4);
    router.push("/builder/step-4");
  };

  const handleBack = () => {
    setCurrentStep(2);
    router.push("/builder/step-2");
  };

  return (
    <BuilderLayout
      currentStep={3}
      title="Tell Your Story"
      subtitle="Create your professional About section"
      onBack={handleBack}
    >
      {/* Two Column Layout */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column - Form */}
        <div className="flex-1 space-y-6">
          {/* AI Questions */}
          <Card shadow="sm" padding="lg">
            <div className="space-y-4">
              <TextArea
                label="Tell us about yourself (2-3 sentences)"
                placeholder="e.g., I'm a junior at Lincoln High who loves building things..."
                value={formData.aboutMe}
                onChange={(e) => setFormData({ ...formData, aboutMe: e.target.value })}
                error={errors.aboutMe}
                maxLength={500}
                showCount
              />

              <TextArea
                label="What's your proudest accomplishment?"
                placeholder="e.g., Leading my school's robotics team..."
                value={formData.proudestAccomplishment}
                onChange={(e) => setFormData({ ...formData, proudestAccomplishment: e.target.value })}
                error={errors.proudestAccomplishment}
                maxLength={300}
                showCount
              />

              <TextArea
                label="What are your future goals?"
                placeholder="e.g., I want to study computer science..."
                value={formData.futureGoals}
                onChange={(e) => setFormData({ ...formData, futureGoals: e.target.value })}
                error={errors.futureGoals}
                maxLength={300}
                showCount
              />

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
                {isGenerating ? "Generating..." : "✨ Generate About Section"}
              </Button>
            </div>
          </Card>

          {/* Generated/Manual Input */}
          <Card shadow="sm" padding="lg">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Your About Section <span className="text-red-500">*</span>
              </label>
              <textarea
                value={generatedAbout}
                onChange={(e) => {
                  setGeneratedAbout(e.target.value);
                  setErrors({});
                }}
                placeholder="Write about yourself, your accomplishments, and your goals..."
                rows={8}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-career-blue focus:outline-none resize-none"
                maxLength={2000}
              />
              {errors.generated && (
                <p role="alert" className="text-xs text-red-500">{errors.generated}</p>
              )}
            </div>
          </Card>

          {/* Navigation */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleBack} className="flex-1">
              Back
            </Button>
            <Button onClick={handleNext} className="flex-1" disabled={!generatedAbout.trim()}>
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
            headline={profile.headline}
            aboutText={generatedAbout}
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
