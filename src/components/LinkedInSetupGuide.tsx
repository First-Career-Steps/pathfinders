'use client';

import { useState } from 'react';

export function LinkedInSetupGuide() {
  const [done, setDone] = useState<string[]>([]);
  const steps = [
    { id: 'account', title: 'Create your own LinkedIn account', detail: 'Open LinkedIn in another tab and sign up, or sign in if you already have an account. Keep this page open so your prepared text is easy to find.' },
    { id: 'intro', title: 'Add your headline and education', detail: 'Open your LinkedIn profile. Use the edit button in the introduction to paste your headline. Add your school and your actual graduation date in Education.' },
    { id: 'about', title: 'Tell your story', detail: 'Add or edit the About section, then paste the About text below. Read it once to make sure it sounds like you and every statement is accurate.' },
    { id: 'experience', title: 'Add the experience you already have', detail: 'Put paid roles in Experience, volunteering in Volunteer experience, and class or personal projects in Projects. Copy the relevant descriptions below; use your real dates.' },
    { id: 'skills', title: 'Finish and review', detail: 'Add the skills you can explain with an example. A photo is optional. Review what is public, check your contact details, and save your profile.' },
  ];
  return (
    <section className="mb-6 rounded-2xl border border-career-blue/20 bg-soft-sky/30 p-5" aria-labelledby="linkedin-setup-heading">
      <h2 id="linkedin-setup-heading" className="text-xl font-semibold text-charcoal">Set up LinkedIn, one step at a time</h2>
      <p className="mt-2 text-sm leading-relaxed text-charcoal-light">Your resume has already done much of the writing. Use the copy buttons below as you follow this checklist. You choose what to publish on LinkedIn.</p>
      <a href="https://www.linkedin.com/" target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-career-blue px-4 py-2 font-semibold text-white hover:bg-career-blue-dark">Open LinkedIn in a new tab</a>
      <p className="mt-3 text-xs text-charcoal-light">LinkedIn generally requires you to be at least 16; local requirements may be higher. You can use your resume without a LinkedIn account.</p>
      <p className="mt-4 text-sm font-semibold text-charcoal" aria-live="polite">{done.length} of {steps.length} steps checked</p>
      <ol className="mt-3 space-y-3">
        {steps.map((step) => (
          <li key={step.id} className="rounded-xl bg-white p-3">
            <label className="flex min-h-11 cursor-pointer items-start gap-3">
              <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-career-blue" checked={done.includes(step.id)} onChange={(event) => {
                const checked = event.target.checked;
                setDone((current) => checked ? [...current, step.id] : current.filter((id) => id !== step.id));
              }} />
              <span><span className="block font-semibold text-charcoal">{step.title}</span><span className="mt-1 block text-sm leading-relaxed text-charcoal-light">{step.detail}</span></span>
            </label>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs text-charcoal-light">The checklist lasts while this page is open. FirstCareerSteps does not create your LinkedIn account or post to it automatically.</p>
    </section>
  );
}
