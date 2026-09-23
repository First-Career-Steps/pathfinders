"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { BuilderLayout } from "@/components/layout";
import { Button, Chip, Card } from "@/components/ui";
import { useProfile } from "@/contexts/ProfileContext";
import { LiveResumePreview } from "@/components/LiveResumePreview";

const SKILLS_BY_CATEGORY = {
  "Communication & Interpersonal": [
    "Communication",
    "Teamwork",
    "Leadership",
    "Public Speaking",
    "Active Listening",
    "Conflict Resolution",
    "Negotiation",
    "Networking",
  ],
  "Technical & Digital": [
    "Microsoft Office",
    "Google Workspace",
    "Social Media",
    "Data Entry",
    "Basic Coding",
    "Video Editing",
    "Graphic Design",
    "Research",
  ],
  "Problem Solving & Thinking": [
    "Problem Solving",
    "Critical Thinking",
    "Creativity",
    "Analytical Skills",
    "Decision Making",
    "Attention to Detail",
    "Strategic Planning",
    "Innovation",
  ],
  "Organization & Management": [
    "Time Management",
    "Organization",
    "Project Management",
    "Multitasking",
    "Planning",
    "Prioritization",
    "Event Planning",
    "Resource Management",
  ],
  "Personal Qualities": [
    "Adaptability",
    "Work Ethic",
    "Initiative",
    "Reliability",
    "Positive Attitude",
    "Self-Motivation",
    "Resilience",
    "Cultural Awareness",
  ],
  "Customer & Service": [
    "Customer Service",
    "Sales",
    "Hospitality",
    "Patient Care",
    "Tutoring",
    "Mentoring",
    "Coaching",
    "Community Service",
  ],
};

export default function Step5Page() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, updateProfile, setCurrentStep } = useProfile();

  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    profile.skills || []
  );
  const [error, setError] = useState("");

  useEffect(() => {
    setCurrentStep(5);
  }, [setCurrentStep]);

  // Load profile data when component mounts or profile changes
  useEffect(() => {
    if (profile.skills && profile.skills.length > 0) {
      setSelectedSkills(profile.skills);
    }
  }, [profile.skills]);

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else if (selectedSkills.length < 10) {
      setSelectedSkills([...selectedSkills, skill]);
      setError("");
    }
  };

  const handleNext = () => {
    if (selectedSkills.length < 3) {
      setError("Please select at least 3 skills");
      return;
    }

    updateProfile({ skills: selectedSkills });
    setCurrentStep(6);
    router.push("/builder/review");
  };

  const handleBack = () => {
    setCurrentStep(4);
    router.push("/builder/step-4");
  };

  return (
    <BuilderLayout
      currentStep={5}
      title="Highlight your skills"
      subtitle="Select skills that represent your strengths (3-10)"
      onBack={handleBack}
    >
      {/* Two Column Layout */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column - Form */}
        <div className="flex-1 space-y-6">
          {/* Selected Skills Summary */}
          {selectedSkills.length > 0 && (
            <Card
              shadow="none"
              className="bg-step-green/10 border border-step-green/30"
              padding="md"
            >
              <p className="text-sm font-medium text-step-green mb-2">
                Selected Skills ({selectedSkills.length}/10)
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedSkills.map((skill) => (
                  <Chip
                    key={skill}
                    label={skill}
                    selected
                    removable
                    onRemove={() => toggleSkill(skill)}
                    size="sm"
                  />
                ))}
              </div>
            </Card>
          )}

          {/* Skills by Category */}
          <div className="space-y-5">
            {Object.entries(SKILLS_BY_CATEGORY).map(([category, skills]) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-charcoal mb-3">
                  {category}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <Chip
                      key={skill}
                      label={skill}
                      selected={selectedSkills.includes(skill)}
                      onClick={() => toggleSkill(skill)}
                      disabled={
                        !selectedSkills.includes(skill) &&
                        selectedSkills.length >= 10
                      }
                      size="sm"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          {/* Info Box */}
          <Card
            shadow="none"
            className="bg-soft-sky border border-career-blue/20"
            padding="md"
          >
            <div className="flex gap-3">
              <span className="text-xl">💡</span>
              <div>
                <p className="text-sm text-charcoal">
                  <strong>Tip:</strong> Choose skills you can demonstrate with
                  examples from your experiences. Employers value authentic
                  self-assessment!
                </p>
              </div>
            </div>
          </Card>

          {/* Navigation */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={handleBack} className="flex-1">
              Back
            </Button>
            <Button onClick={handleNext} className="flex-1">
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
            aboutText={profile.generatedAbout}
            highSchool={profile.highSchool}
            graduationYear={profile.graduationYear}
            skills={selectedSkills}
            experiences={profile.experiences}
            certifications={profile.certifications}
          />
        </div>
      </div>
    </BuilderLayout>
  );
}
