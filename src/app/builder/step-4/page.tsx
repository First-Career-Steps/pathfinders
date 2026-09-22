"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { BuilderLayout } from "@/components/layout";
import { Button, Input, TextArea, Select, Card } from "@/components/ui";
import { useProfile, Experience } from "@/contexts/ProfileContext";
import { requestResumeAI, requireAILines } from "@/lib/resume-ai-client";
import { LiveResumePreview } from "@/components/LiveResumePreview";

const EXPERIENCE_TYPES = [
  { value: "fulltime", label: "Full-time" },
  { value: "parttime", label: "Part-time" },
  { value: "remote", label: "Remote" },
  { value: "freelance", label: "Freelance" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "Onsite" },
  { value: "other", label: "Other" },
];

// Helper function to format date from YYYY-MM to "Month YYYY"
const formatDate = (dateString: string): string => {
  if (!dateString || dateString === "Present") return dateString;
  const [year, month] = dateString.split('-');
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  const monthIndex = parseInt(month) - 1;
  return `${monthNames[monthIndex]} ${year}`;
};

export default function Step4Page() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, updateProfile, setCurrentStep } = useProfile();

  const [experiences, setExperiences] = useState<Experience[]>(profile.experiences || []);
  const [certifications, setCertifications] = useState(profile.certifications || []);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);

  const [certForm, setCertForm] = useState({
    name: '',
    issuer: '',
    dateIssued: ''
  });

  // Sync state with profile when it loads
  useEffect(() => {
    if (profile.experiences) setExperiences(profile.experiences);
    if (profile.certifications) setCertifications(profile.certifications);
  }, [profile.experiences, profile.certifications]);

  const [formData, setFormData] = useState({
    type: "extracurricular" as Experience["type"],
    title: "",
    organization: "",
    description: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setCurrentStep(4);
  }, [setCurrentStep]);

  // Load profile data into form when component mounts or profile changes
  useEffect(() => {
    if (profile.experiences && profile.experiences.length > 0) {
      setExperiences(profile.experiences);
    }
  }, [profile.experiences]);

  const resetForm = () => {
    setFormData({
      type: "extracurricular",
      title: "",
      organization: "",
      description: "",
      startDate: "",
      endDate: "",
      isCurrent: false,
    });
    setErrors({});
    setShowForm(false);
    setEditingId(null);
  };

  const handleEnhanceAI = async () => {
    if (!formData.title.trim() || !formData.organization.trim() || !formData.description.trim()) {
      setErrors({ description: "Please enter your role, organization, and experience description first" });
      return;
    }

    setIsEnhancing(true);
    setErrors({});
    try {
      const data = await requestResumeAI('/api/ai/enhance-experience', {
        title: formData.title,
        organization: formData.organization,
        description: formData.description,
        type: formData.type,
      });
      const bullets = requireAILines(data.bullets);
      setFormData(current => ({ ...current, description: bullets.join('\n') }));
    } catch (error) {
      console.error('AI Error:', error);
      setErrors({ description: error instanceof Error ? error.message : 'AI writing is temporarily unavailable. Please try again.' });
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSaveExperience = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = "Required";
    if (!formData.organization.trim()) newErrors.organization = "Required";
    if (!formData.description.trim()) newErrors.description = "Required";
    if (!formData.startDate) newErrors.startDate = "Required";
    if (!formData.isCurrent && !formData.endDate) newErrors.endDate = "Required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const newExperience: Experience = {
      id: editingId || Date.now().toString(),
      type: formData.type,
      title: formData.title,
      organization: formData.organization,
      description: formData.description,
      startDate: formData.startDate,
      endDate: formData.isCurrent ? "Present" : formData.endDate,
      isCurrent: formData.isCurrent,
    };

    if (editingId) {
      setExperiences(experiences.map((exp) => (exp.id === editingId ? newExperience : exp)));
    } else {
      setExperiences([...experiences, newExperience]);
    }

    resetForm();
  };

  const handleEdit = (exp: Experience) => {
    setFormData({
      type: exp.type,
      title: exp.title,
      organization: exp.organization,
      description: exp.description,
      startDate: exp.startDate,
      endDate: exp.isCurrent ? "" : exp.endDate,
      isCurrent: exp.isCurrent,
    });
    setEditingId(exp.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setExperiences(experiences.filter((exp) => exp.id !== id));
  };

  const handleAddCert = () => {
    if (!certForm.name.trim()) return;
    const newCert = { id: Date.now().toString(), ...certForm };
    setCertifications([...certifications, newCert]);
    setCertForm({ name: '', issuer: '', dateIssued: '' });
  };

  const handleDeleteCert = (id: string) => {
    setCertifications(certifications.filter(c => c.id !== id));
  };

  const handleNext = async () => {
    if (experiences.length === 0) {
      setErrors({ general: "Please add at least one experience" });
      return;
    }

    await updateProfile({ experiences, certifications });
    setCurrentStep(5);
    router.push("/builder/step-5");
  };

  const handleBack = () => {
    setCurrentStep(3);
    router.push("/builder/step-3");
  };

  const getTypeLabel = (type: string) => {
    const found = EXPERIENCE_TYPES.find((t) => t.value === type);
    return found?.label || type;
  };

  return (
    <BuilderLayout
      currentStep={4}
      title="Add Your Experiences"
      subtitle="Jobs, clubs, volunteer work, projects"
      onBack={handleBack}
    >
      {/* Two Column Layout */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column - Form */}
        <div className="flex-1 space-y-6">
          {/* Experience List */}
          {experiences.length > 0 && !showForm && (
            <div className="space-y-3">
              {experiences.map((exp) => (
                <Card key={exp.id} shadow="sm" padding="md">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1">
                      <span className="inline-block px-2 py-1 bg-soft-sky text-career-blue text-xs font-medium rounded-full mb-2">
                        {getTypeLabel(exp.type)}
                      </span>
                      <h3 className="font-semibold text-charcoal">{exp.title}</h3>
                      <p className="text-sm text-gray-600">{exp.organization}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(exp.startDate)} — {exp.isCurrent ? 'Present' : formatDate(exp.endDate)}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleEdit(exp)}
                        className="text-sm text-career-blue hover:underline font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(exp.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Add Button */}
          {!showForm && (
            <Button variant="outline" fullWidth onClick={() => setShowForm(true)}>
              + Add Experience
            </Button>
          )}

          {errors.general && <p className="text-sm text-red-500 text-center">{errors.general}</p>}

          {/* Experience Form */}
          {showForm && (
            <Card shadow="sm" padding="lg" className="border-2 border-career-blue">
              <div className="space-y-4">
                <Select
                  label="Type"
                  options={EXPERIENCE_TYPES}
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as Experience["type"] })}
                />

                <Input
                  label="Title / Role *"
                  placeholder="e.g., Team Captain"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  error={errors.title}
                  maxLength={100}
                />

                <Input
                  label="Organization *"
                  placeholder="e.g., Lincoln High School"
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  error={errors.organization}
                  maxLength={100}
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Start Date *"
                    type="month"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    error={errors.startDate}
                  />
                  <div>
                    <Input
                      label="End Date"
                      type="month"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      error={errors.endDate}
                      disabled={formData.isCurrent}
                    />
                    <label className="flex items-center gap-2 mt-2 text-sm">
                      <input
                        type="checkbox"
                        checked={formData.isCurrent}
                        onChange={(e) => setFormData({ ...formData, isCurrent: e.target.checked, endDate: "" })}
                        className="w-4 h-4"
                      />
                      Current
                    </label>
                  </div>
                </div>

                <TextArea
                  label="Description *"
                  placeholder="Describe what you did..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  error={errors.description}
                  className="min-h-[120px]"
                  maxLength={1000}
                  showCount
                />

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleEnhanceAI}
                  loading={isEnhancing}
                >
                  {isEnhancing ? "Enhancing..." : "✨ Make it Professional (AI)"}
                </Button>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={resetForm} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleSaveExperience} className="flex-1">
                    {editingId ? "Update" : "Add"}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Certifications Section */}
          {!showForm && (
            <Card shadow="sm" padding="lg" className="mt-6">
              <h3 className="text-lg font-semibold text-charcoal mb-4">
                Certifications (Optional)
              </h3>

              <div className="space-y-4">
                <Input
                  label="Certification Name"
                  placeholder="e.g., First Aid Certified"
                  value={certForm.name}
                  onChange={(e) => setCertForm({ ...certForm, name: e.target.value })}
                  maxLength={100}
                />
                <Input
                  label="Issuer (Optional)"
                  placeholder="e.g., Red Cross"
                  value={certForm.issuer}
                  onChange={(e) => setCertForm({ ...certForm, issuer: e.target.value })}
                  maxLength={100}
                />
                <Input
                  label="Date Issued (Optional)"
                  placeholder="e.g., 2024"
                  value={certForm.dateIssued}
                  onChange={(e) => setCertForm({ ...certForm, dateIssued: e.target.value })}
                  maxLength={50}
                />
                <Button onClick={handleAddCert} variant="outline" size="sm">
                  + Add Certification
                </Button>
              </div>

              {certifications.length > 0 && (
                <div className="mt-4 space-y-2">
                  {certifications.map(cert => (
                    <div key={cert.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-charcoal">{cert.name}</p>
                        {cert.issuer && <p className="text-sm text-gray-600">{cert.issuer}</p>}
                        {cert.dateIssued && <p className="text-xs text-gray-500">{cert.dateIssued}</p>}
                      </div>
                      <button
                        onClick={() => handleDeleteCert(cert.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Navigation */}
          {!showForm && (
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleBack} className="flex-1">
                Back
              </Button>
              <Button onClick={handleNext} className="flex-1">
                Continue
              </Button>
            </div>
          )}
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
            experiences={experiences}
            certifications={certifications}
          />
        </div>
      </div>
    </BuilderLayout>
  );
}
