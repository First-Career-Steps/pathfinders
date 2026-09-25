'use client';

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createBrowserClient } from '@/lib/supabase';
import { authLogger } from '@/lib/logger';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signUp: (email: string, password: string, fullName: string, linkedinLink?: string) => Promise<{ error: string | null; needsConfirmation?: boolean }>;
    signIn: (email: string, password: string) => Promise<{ error: string | null }>;
    signOut: () => Promise<void>;
    resetPasswordForEmail: (email: string) => Promise<{ error: string | null }>;
    updatePassword: (password: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    // Memoize Supabase client to prevent recreating on every render
    const supabase = useMemo(() => createBrowserClient(), []);

    useEffect(() => {
        // Get initial session
        const initializeAuth = async () => {
            try {
                authLogger.info('Initializing auth session');

                const {
                    data: { session: initialSession },
                    error,
                } = await supabase.auth.getSession();

                if (error) {
                    authLogger.error(error, { context: 'getSession' });
                } else {
                    setSession(initialSession);
                    setUser(initialSession?.user ?? null);

                    if (initialSession?.user) {
                        authLogger.info('User session found', {
                            userId: initialSession.user.id,
                            email: initialSession.user.email,
                        });
                    }
                }
            } catch (error) {
                authLogger.error(error as Error, { context: 'initializeAuth' });
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event: string, currentSession: Session | null) => {
            authLogger.info(`Auth state changed: ${event}`, {
                userId: currentSession?.user?.id,
                email: currentSession?.user?.email,
            });

            setSession(currentSession);
            setUser(currentSession?.user ?? null);
            setLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [supabase.auth]);

    const signUp = async (
        email: string,
        password: string,
        fullName: string,
        linkedinLink?: string
    ): Promise<{ error: string | null; needsConfirmation?: boolean }> => {
        try {
            authLogger.info('Sign up attempt', { email, hasLinkedin: !!linkedinLink });

            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        linkedin_link: linkedinLink || null,
                        privacy_version: '2026-09-24',
                        terms_version: '2026-09-24',
                        terms_accepted_at: new Date().toISOString(),
                    },
                    emailRedirectTo: `${window.location.origin}/builder/step-1`,
                },
            });

            if (error) {
                authLogger.error(error, { context: 'signUp', email });

                if (error.message.includes('User already registered') || (error.status === 400 && error.message.includes('already been registered'))) {
                    return { error: 'An account with this email already exists.' };
                }

                return { error: error.message };
            }

            const needsConfirmation = !data.session;


            if (data.user) {
                authLogger.info('Sign up successful', {
                    userId: data.user.id,
                    email: data.user.email,
                });

                // Update user record (trigger auto-creates it, we just update with form data)
                const { error: userError } = await supabase
                    .from('users')
                    .update({
                        email: data.user.email!,
                        full_name: fullName,
                        linkedin_link: linkedinLink || null,
                    })
                    .eq('id', data.user.id);

                // If update fails (record doesn't exist), try insert
                if (userError) {
                    authLogger.warn('Update failed, trying insert', { context: 'createUserRecord', userId: data.user.id, error: userError });
                    const { error: insertError } = await supabase.from('users').insert({
                        id: data.user.id,
                        email: data.user.email!,
                        full_name: fullName,
                        linkedin_link: linkedinLink || null,
                    });
                    if (insertError) {
                        authLogger.error(insertError, { context: 'createUserRecord', userId: data.user.id });
                    }
                }

                // Update or insert profile record
                const { data: existingProfile } = await supabase
                    .from('profile')
                    .select('id')
                    .eq('user_id', data.user.id)
                    .single();

                if (existingProfile) {
                    // Profile exists, no need to do anything
                    authLogger.info('Profile already exists', { context: 'createProfile', userId: data.user.id });
                } else {
                    // Profile doesn't exist, create it
                    const { error: profileError } = await supabase.from('profile').insert({
                        user_id: data.user.id,
                    });
                    if (profileError) {
                        authLogger.error(profileError, { context: 'createProfile', userId: data.user.id });
                    }
                }

                // Send welcome email via API route to avoid bundling server-side code in the browser
                /* Temporarily disabled due to DNS issues
                try {
                    await fetch('/api/auth/send-welcome-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email: data.user.email,
                            fullName: fullName,
                        }),
                    });
                } catch (emailError) {
                    // Log error but don't fail the signup process
                    authLogger.error(emailError as Error, { context: 'sendWelcomeEmail', userId: data.user.id });
                }
                */
            }


            return { error: null, needsConfirmation };
        } catch (error) {
            authLogger.error(error as Error, { context: 'signUp', email });
            return { error: 'An unexpected error occurred. Please try again.' };
        }
    };

    const signIn = async (
        email: string,
        password: string
    ): Promise<{ error: string | null }> => {
        try {
            authLogger.info('Sign in attempt', { email });

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                authLogger.error(error, { context: 'signIn', email });

                if (error.message.includes('Invalid login credentials')) {
                    return { error: 'Invalid email or password.' };
                }

                return { error: error.message };
            }

            if (data.user) {
                authLogger.info('Sign in successful', {
                    userId: data.user.id,
                    email: data.user.email,
                });
            }

            return { error: null };
        } catch (error) {
            authLogger.error(error as Error, { context: 'signIn', email });
            return { error: 'An unexpected error occurred. Please try again.' };
        }
    };

    const signOut = async () => {
        try {
            authLogger.info('Sign out attempt', { userId: user?.id });

            const { error } = await supabase.auth.signOut();

            if (error) {
                authLogger.error(error, { context: 'signOut', userId: user?.id });
                throw error;
            }

            // Explicitly clear user and session state immediately
            setUser(null);
            setSession(null);
            setLoading(false);

            authLogger.info('Sign out successful', { userId: user?.id });
        } catch (error) {
            authLogger.error(error as Error, { context: 'signOut', userId: user?.id });
            // Still clear state even if there's an error
            setUser(null);
            setSession(null);
            setLoading(false);
            throw error;
        }
    };

    const resetPasswordForEmail = async (email: string): Promise<{ error: string | null }> => {
        try {
            authLogger.info('Reset password request', { email });
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (error) {
                authLogger.error(error, { context: 'resetPassword', email });
                return { error: error.message };
            }
            return { error: null };
        } catch (error) {
            authLogger.error(error as Error, { context: 'resetPassword', email });
            return { error: 'An unexpected error occurred.' };
        }
    };

    const updatePassword = async (password: string): Promise<{ error: string | null }> => {
        try {
            authLogger.info('Update password request');
            const { error } = await supabase.auth.updateUser({ password });
            if (error) {
                authLogger.error(error, { context: 'updatePassword' });
                return { error: error.message };
            }
            return { error: null };
        } catch (error) {
            authLogger.error(error as Error, { context: 'updatePassword' });
            return { error: 'An unexpected error occurred.' };
        }
    };

    const value = {
        user,
        session,
        loading,
        signUp,
        signIn,
        signOut,
        resetPasswordForEmail,
        updatePassword,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
}
