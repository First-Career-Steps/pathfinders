'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { classDestination } from '@/lib/classes/catalog';
import { WORKSHOP, workshopSignup } from '@/lib/workshop';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { logger } from '@/lib/logger';

function LoginContent() {

  const searchParams = useSearchParams();
  const returnClass = classDestination(searchParams.get('redirect'));
  const { signIn, resetPasswordForEmail } = useAuth();

  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation only needed in login mode
    if (mode === 'login' && !formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    try {
      const { error } = await signIn(formData.email, formData.password);

      if (error) {
        logger.error('Login Form', error, { email: formData.email });
        setServerError(error);
        setLoading(false);
        return;
      }

      logger.info('Login Form', 'Login successful', {
        email: formData.email,
      });

      const redirectTo = searchParams.get('redirect') || '/dashboard';
      const target = new URL(redirectTo, window.location.origin);
      window.location.assign(target.origin === window.location.origin ? target.href : '/dashboard');
    } catch (error) {
      logger.error('Login Form', error as Error, { email: formData.email });
      setServerError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    try {
      const { error } = await resetPasswordForEmail(formData.email);

      if (error) {
        logger.error('Forgot Password', error, { email: formData.email });
        setServerError(error);
        setLoading(false);
        return;
      }

      logger.info('Forgot Password', 'Reset email sent', {
        email: formData.email,
      });

      setSuccessMessage('Password reset link has been sent to your email.');
      setLoading(false);
    } catch (error) {
      logger.error('Forgot Password', error as Error, { email: formData.email });
      setServerError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    setSuccessMessage('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    if (mode === 'login') {
      await handleLogin();
    } else {
      await handleForgotPassword();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }

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
            {successMessage ? (
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-poppins font-bold text-charcoal mb-4">
                  Check Your Email
                </h1>
                <p className="text-gray-600 mb-8 font-medium">
                  We&apos;ve sent a password reset link to:
                  <br />
                  <span className="text-charcoal font-bold">{formData.email}</span>
                </p>
                <p className="text-gray-600 mb-8 text-sm">
                  Please click the link in your email to reset your password. If you don&apos;t see it, check your spam folder.
                </p>
                <button
                  onClick={() => {
                    setMode('login');
                    setSuccessMessage('');
                    setFormData(prev => ({ ...prev, password: '' }));
                    setErrors({});
                    setServerError('');
                  }}
                  className="w-full px-6 py-3 bg-career-blue text-white font-semibold rounded-xl hover:bg-career-blue-dark transition-all duration-200"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-poppins font-bold text-charcoal mb-2 text-center">
                  {mode === 'login' ? 'Welcome Back' : 'Reset Password'}
                </h1>
                <p className="text-gray-600 text-center mb-8">
                  {mode === 'login'
                    ? 'Sign in to continue building your resume'
                    : 'Enter your email to receive a reset link'}
                </p>

                {serverError && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-red-600 text-sm">{serverError}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-charcoal mb-2">
                      Email
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
                      autoComplete="email"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>

                  {/* Password - only show in login mode */}
                  {mode === 'login' && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label htmlFor="password" className="block text-sm font-semibold text-charcoal">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setMode('forgot');
                            setErrors({});
                            setServerError('');
                          }}
                          className="text-xs text-career-blue hover:underline font-medium"
                        >
                          Forgot password?
                        </button>
                      </div>
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
                        autoComplete="current-password"
                      />
                      {errors.password && (
                        <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                      )}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-6 py-3 bg-career-blue text-white font-semibold rounded-xl hover:bg-career-blue-dark transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                  >
                    {loading
                      ? (mode === 'login' ? 'Signing In...' : 'Sending...')
                      : (mode === 'login' ? 'Sign In' : 'Send Reset Link')}
                  </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-600">
                  {mode === 'forgot' ? (
                    <button
                      onClick={() => {
                        setMode('login');
                        setErrors({});
                        setServerError('');
                      }}
                      className="text-career-blue font-semibold hover:underline"
                    >
                      Back to Sign In
                    </button>
                  ) : (
                    <>
                      Don&apos;t have an account?{' '}
                      <Link href={returnClass ? '/signup?redirect='+encodeURIComponent(returnClass) : searchParams.get('redirect')?.startsWith(WORKSHOP) ? workshopSignup : '/signup'} className="text-career-blue font-semibold hover:underline">
                        Create Account
                      </Link>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-career-blue"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
