"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/layout";
import { Button, ProgressBar } from "@/components/ui";
import { useProfile } from "@/contexts/ProfileContext";
import { LiveResumePreview } from "@/components/LiveResumePreview";

export default function ReviewPage() {
  const router = useRouter();
  const { profile, setCurrentStep } = useProfile();
  const { user } = useAuth();
  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const checkSubscriptionStatus = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      // Use server-side API endpoint for more reliable subscription check
      const response = await fetch('/api/check-subscription');
      const data = await response.json();

      if (data.hasSubscription) {
        setHasActiveSubscription(true);
      } else {
        setHasActiveSubscription(false);
        // Log debug info if available
        if (data.debug) {
          console.log('Subscription debug info:', data.debug);
        }
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      setHasActiveSubscription(false);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkSubscriptionStatus();
  }, [checkSubscriptionStatus]);

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      const response = await fetch('/api/resumes/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save draft');
      }

      if (data.success) {
        // Direct to dashboard
        router.push('/dashboard/resumes');
        return;
      }

      throw new Error('Unexpected response');
    } catch (err) {
      console.error('Save draft error:', err);
      alert(err instanceof Error ? err.message : 'Failed to save draft. Please try again.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleCompleteAndPay = async () => {
    // Subscribed users: create resume via API and redirect to success (never show checkout)
    if (hasActiveSubscription) {
      setIsGenerating(true);
      try {
        const response = await fetch('/api/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create resume');
        }

        if (data.success) {
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('resume_created', 'true');
          }
          // Subscribed users go straight to dashboard – no checkout/success, no "Processing Payment"
          router.push('/dashboard/resumes?created=1');
          return;
        }

        if (data.url) {
          window.location.href = data.url;
          return;
        }
        throw new Error('Unexpected response');
      } catch (err) {
        console.error('Generate resume error:', err);
        alert(err instanceof Error ? err.message : 'Failed to create resume. Please try again.');
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    // Non-subscribed: go to checkout page (will create Stripe session)
    router.push('/checkout');
  };

  const handleEditSection = (step: number) => {
    setCurrentStep(step);
    router.push(`/builder/step-${step}`);
  };



  return (
    <div className="min-h-screen bg-gradient-to-b from-soft-sky/30 to-white flex flex-col">
      <Header showBack onBack={() => router.push("/builder/step-6")} minimal />

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 sticky top-[73px] z-40">
        <div className="max-w-7xl mx-auto lg:w-[80%] overflow-hidden">
          <ProgressBar
            currentStep={7}
            totalSteps={7}
            stepLabels={[
              "Basics",
              "Headline",
              "About",
              "Experience",
              "Skills",
              "Photo",
              "Review/Pay",
            ]}
          />
        </div>
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto lg:w-[80%] px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-16 h-16 bg-step-green rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-charcoal mb-2">
            Review Your Resume
          </h1>
          <p className="text-gray-600">
            {hasActiveSubscription
              ? "Everything looks good? Create your resume now — it's included in your subscription."
              : "Everything looks good? Create your resume. You'll complete a payment ($1.99/year) to unlock it."
            }
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Edit Sections */}
          <div className="flex-1 space-y-4">
            <h2 className="text-xl font-bold text-charcoal mb-4">Edit Sections</h2>

            <button
              onClick={() => handleEditSection(1)}
              className="w-full text-left p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-career-blue transition-all"
            >
              <h3 className="font-semibold text-charcoal mb-1">Student Basics</h3>
              <p className="text-sm text-gray-600">Name, school, interests</p>
            </button>

            <button
              onClick={() => handleEditSection(2)}
              className="w-full text-left p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-career-blue transition-all"
            >
              <h3 className="font-semibold text-charcoal mb-1">Headline</h3>
              <p className="text-sm text-gray-600">{profile.headline || "Add your headline"}</p>
            </button>

            <button
              onClick={() => handleEditSection(3)}
              className="w-full text-left p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-career-blue transition-all"
            >
              <h3 className="font-semibold text-charcoal mb-1">About Section</h3>
              <p className="text-sm text-gray-600 line-clamp-2">{profile.generatedAbout || "Add about section"}</p>
            </button>

            <button
              onClick={() => handleEditSection(4)}
              className="w-full text-left p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-career-blue transition-all"
            >
              <h3 className="font-semibold text-charcoal mb-1">Experiences</h3>
              <p className="text-sm text-gray-600">{profile.experiences?.length || 0} experiences added</p>
            </button>

            <button
              onClick={() => handleEditSection(5)}
              className="w-full text-left p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-career-blue transition-all"
            >
              <h3 className="font-semibold text-charcoal mb-1">Skills</h3>
              <p className="text-sm text-gray-600">{profile.skills?.length || 0} skills selected</p>
            </button>

            <button
              onClick={() => handleEditSection(6)}
              className="w-full text-left p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-career-blue transition-all"
            >
              <h3 className="font-semibold text-charcoal mb-1">Profile Photo</h3>
              <p className="text-sm text-gray-600">{profile.photoUrl ? "Photo added" : "No photo"}</p>
            </button>

            {/* Action Buttons */}
            <div className="pt-4 flex flex-col gap-3">
              {hasActiveSubscription ? (
                <>
                  <Button
                    onClick={() => handleCompleteAndPay()}
                    size="lg"
                    fullWidth
                    className="bg-step-green hover:bg-step-green/90"
                    disabled={isGenerating}
                  >
                    {isGenerating ? 'Creating resume...' : 'Create my resume'}
                  </Button>
                  <Button
                    onClick={handleSaveDraft}
                    size="lg"
                    variant="outline"
                    fullWidth
                    disabled={isGenerating || isSavingDraft}
                  >
                    {isSavingDraft ? 'Saving...' : 'Save as Draft'}
                  </Button>
                  <p className="text-xs text-center text-gray-500 mt-2">
                    No payment needed — included in your subscription
                  </p>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => handleCompleteAndPay()}
                    size="lg"
                    fullWidth
                    className="bg-step-green hover:bg-step-green/90"
                    disabled={isLoading || isSavingDraft}
                  >
                    {isLoading ? 'Checking...' : 'Create my resume'}
                  </Button>
                  <Button
                    onClick={handleSaveDraft}
                    size="lg"
                    variant="outline"
                    fullWidth
                    disabled={isLoading || isSavingDraft}
                  >
                    {isSavingDraft ? 'Saving...' : 'Save as Draft'}
                  </Button>
                  <p className="text-xs text-center text-gray-500 mt-2">
                    You&apos;ll go to payment ($1.99/year) to unlock this resume • Unlimited resumes for one year
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Right Column - Live Preview */}
          <div className="flex-1 lg:sticky lg:top-6 h-fit">
            <h2 className="text-xl font-bold text-charcoal mb-4">Preview</h2>
            <LiveResumePreview
              fullName={profile.fullName}
              email={user?.email}
              phone={profile.phone}
              location={profile.location}
              linkedin={profile.linkedin}
              headline={profile.headline}
              aboutText={profile.generatedAbout}
              highSchool={profile.highSchool}
              graduationYear={profile.graduationYear}
              skills={profile.skills}
              experiences={profile.experiences}
              certifications={profile.certifications}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
