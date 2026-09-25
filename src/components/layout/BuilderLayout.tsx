"use client";

import AIPrivacyNotice from '@/components/AIPrivacyNotice';
import React from "react";
import { Header } from "./Header";
import { ProgressBar } from "@/components/ui";

interface BuilderLayoutProps {
  children: React.ReactNode;
  currentStep: number;
  totalSteps?: number;
  stepLabels?: string[];
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  showProgress?: boolean;
}

export function BuilderLayout({
  children,
  currentStep,
  totalSteps = 6,
  stepLabels = [
    "Basics",
    "Headline",
    "About",
    "Experience",
    "Skills",
    "Review/Pay",
  ],
  title,
  subtitle,
  onBack,
  showProgress = true,
}: BuilderLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-soft-sky/30 to-white flex flex-col">
      <Header showBack={currentStep > 1} onBack={onBack} minimal />

      {/* Progress Bar */}
      {showProgress && (
        <div className="bg-white border-b border-gray-100 px-4 py-3 sticky top-[73px] z-40">
          <div className="max-w-7xl mx-auto lg:w-[80%] overflow-hidden">
            <ProgressBar
              currentStep={currentStep}
              totalSteps={totalSteps}
              stepLabels={stepLabels}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 px-4 py-6 w-full max-w-7xl mx-auto lg:w-[80%]">
        {/* Title Section */}
        {(title || subtitle) && (
          <div className="mb-6 text-center animate-fade-in">
            {title && (
              <h1 className="text-2xl font-poppins font-bold text-charcoal mb-2">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-gray-600 font-inter">{subtitle}</p>
            )}
          </div>
        )}

        {/* Step Content */}
        <div className="animate-slide-up"><AIPrivacyNotice />
          {children}</div>
      </main>

      {/* Safe area padding for mobile */}
      <div className="safe-bottom" />
    </div>
  );
}

