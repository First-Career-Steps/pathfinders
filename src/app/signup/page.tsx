'use client';

import { useState } from 'react';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { logger } from '@/lib/logger';

export default function SignUpPage() {

  const { signUp } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    linkedinLink: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Full name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // LinkedIn link validation (optional)
    if (formData.linkedinLink && !/^https?:\/\/(www\.)?linkedin\.com\/.+/.test(formData.linkedinLink)) {
      newErrors.linkedinLink = 'Please enter a valid LinkedIn profile URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');

    logger.info('Sign Up Form', 'Form submission started', {
      email: formData.email,
      hasLinkedin: !!formData.linkedinLink,
    });

    if (!validateForm()) {
      logger.warn('Sign Up Form', 'Validation failed', { errors });
      return;
    }

    setLoading(true);

    try {
      const { error, needsConfirmation: checkEmail } = await signUp(
        formData.email,
        formData.password,
        formData.fullName,
        formData.linkedinLink || undefined
      );

      if (error) {
        logger.error('Sign Up Form', error, { email: formData.email });
        setServerError(error);
        setLoading(false);
        return;
      }

      logger.info('Sign Up Form', 'Sign up successful', {
        email: formData.email,
        needsConfirmation: checkEmail,
      });

      if (checkEmail) {
        setNeedsConfirmation(true);
        setLoading(false);
        return;
      }

      // Redirect to builder (hard navigation so middleware sees auth cookies immediately)
      window.location.assign('/builder/step-1');
    } catch (error) {
      logger.error('Sign Up Form', error as Error, { email: formData.email });
      setServerError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }

    // Clear server error when user makes changes
    if (serverError) {
      setServerError('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gradient-hero py-12 px-4 flex items-center">
        <div className="max-w-md mx-auto w-full">
          <div className="bg-white rounded-2xl p-8 shadow-card">
            {needsConfirmation ? (
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-poppins font-bold text-charcoal mb-4">
                  Check Your Email
                </h1>
                <p className="text-gray-600 mb-8">
                  We&apos;ve sent a confirmation link to <span className="font-semibold text-charcoal">{formData.email}</span>.
                  Please click the link to verify your account and start building your resume.
                </p>
                <div className="space-y-4">
                  <Link
                    href="/login"
                    className="block w-full px-6 py-3 bg-career-blue text-white font-semibold rounded-xl hover:bg-career-blue-dark transition-all duration-200"
                  >
                    Go to Sign In
                  </Link>
                  <button
                    onClick={() => setNeedsConfirmation(false)}
                    className="text-career-blue font-semibold hover:underline text-sm"
                  >
                    Back to Sign Up
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-poppins font-bold text-charcoal mb-2 text-center">
                  Create Your Account
                </h1>
                <p className="text-gray-600 text-center mb-8">
                  Start building your professional resume
                </p>

                {serverError && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-red-600 text-sm">{serverError}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Full Name */}
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-semibold text-charcoal mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${errors.fullName
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-career-blue'
                        }`}
                      placeholder="John Doe"
                      disabled={loading}
                    />
                    {errors.fullName && (
                      <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-charcoal mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${errors.email
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-career-blue'
                        }`}
                      placeholder="john@example.com"
                      disabled={loading}
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-semibold text-charcoal mb-2">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${errors.password
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-career-blue'
                        }`}
                      placeholder="••••••••"
                      disabled={loading}
                    />
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Must be at least 8 characters with uppercase, lowercase, and number
                    </p>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-semibold text-charcoal mb-2">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${errors.confirmPassword
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-career-blue'
                        }`}
                      placeholder="••••••••"
                      disabled={loading}
                    />
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-6 py-3 bg-career-blue text-white font-semibold rounded-xl hover:bg-career-blue-dark transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link href="/login" className="text-career-blue font-semibold hover:underline">
                    Sign In
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
