'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { createBrowserClient } from '@/lib/supabase';

export default function AccountDeletionPanel() {
  const { signOut } = useAuth();
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [reauthenticate, setReauthenticate] = useState(false);
  async function removeAccount() {
    if (busy || confirmation !== 'DELETE') return;
    setBusy(true); setError(''); setReauthenticate(false);
    try {
      const response = await fetch('/api/account', {
        method: 'DELETE', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation }),
      });
      const result = await response.json();
      if (!response.ok || result.deleted !== true) {
        setReauthenticate(result.code === 'REAUTH_REQUIRED' || response.status === 401);
        throw new Error(result.error || 'Deletion did not finish. Please retry.');
      }
      // Clear only this application's transient flags. Never claim success before the API does.
      try {
        for (const key of ['payment_completed', 'resume_created', 'currentResumeId']) sessionStorage.removeItem(key);
      } catch { /* A browser storage restriction must not hide successful deletion. */ }
      await createBrowserClient().auth.signOut({ scope: 'local' }).catch(() => undefined);
      await signOut().catch(() => undefined);
      window.location.replace('/?account=deleted');
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Deletion did not finish. Please retry.');
      setBusy(false);
    }
  }
  return (
    <section className="rounded-2xl border-2 border-red-200 bg-red-50 p-6 sm:p-8" aria-labelledby="delete-account-heading">
      <h2 id="delete-account-heading" className="text-xl font-bold text-red-800">Delete your account</h2>
      <p className="mt-3 text-sm leading-relaxed text-red-900">This permanently removes your account, saved profile, resumes, photos, generated content and career roadmaps. It cancels future FirstCareerSteps subscription renewals. Download anything you need first. Deletion cannot be undone.</p>
      <p className="mt-3 text-sm text-red-900">Past payments are not automatically refunded. Required payment records, security logs and backups may remain as explained in our <Link href="/privacy" className="underline">Privacy Policy</Link>.</p>
      <label htmlFor="delete-confirmation" className="mt-5 block text-sm font-semibold text-red-900">Type DELETE to confirm</label>
      <input id="delete-confirmation" value={confirmation} onChange={event => setConfirmation(event.target.value)} autoComplete="off" spellCheck={false} disabled={busy} className="mt-2 w-full max-w-sm rounded-lg border border-red-300 bg-white px-3 py-2 text-gray-900" />
      {error && <p role="alert" className="mt-4 text-sm text-red-800">{error}</p>}
      {reauthenticate && <button type="button" onClick={async () => { await signOut().catch(() => undefined); window.location.assign('/login?redirect=/dashboard/settings'); }} className="mt-3 block font-semibold text-career-blue underline">Sign out and sign in again</button>}
      <button type="button" onClick={removeAccount} disabled={busy || confirmation !== 'DELETE'} className="mt-5 rounded-lg bg-red-700 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{busy ? 'Deleting account…' : 'Permanently delete account'}</button>
    </section>
  );
}
