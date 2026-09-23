import { CAMPAIGN_COOKIE, parseCampaign } from "@/lib/acquisition";
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createSubscriptionCheckoutSession, hasActiveSubscription } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_request: NextRequest) {
    try {
        const cookieStore = await cookies();

        // Create a Supabase client with cookies for server-side auth
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookieStore.set(name, value, options);
                        });
                    },
                },
            }
        );

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            console.error('Auth error:', authError);
            return NextResponse.json(
                { error: 'Unauthorized - Please log in' },
                { status: 401 }
            );
        }

        // Verify user has completed their profile
        const { data: profile, error: profileError } = await supabase
            .from('profile')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (profileError || !profile) {
            console.error('Profile error:', profileError);
            return NextResponse.json(
                { error: 'Profile not found - Please complete the builder first' },
                { status: 400 }
            );
        }

        // Verify profile is reasonably complete
        if (!profile.headline || !profile.about_text) {
            return NextResponse.json(
                { error: 'Please complete your profile before purchasing' },
                { status: 400 }
            );
        }

        // Check if user has an active subscription (use admin client so RLS does not block)
        const adminSupabaseForCheck = createAdminClient();
        const hasSubscription = await hasActiveSubscription(user.id, adminSupabaseForCheck);

        if (hasSubscription) {
            // User has active subscription - create resume directly without payment
            const adminSupabase = createAdminClient();

            // Fetch user's basic info
            const { data: userData } = await adminSupabase
                .from('users')
                .select('full_name, email')
                .eq('id', user.id)
                .single();

            // Generate unique shareable link
            const shareableLink = crypto.randomUUID();

            // Calculate next version number
            const { data: existingResumes } = await adminSupabase
                .from('resumes')
                .select('version')
                .eq('user_id', user.id)
                .order('version', { ascending: false })
                .limit(1);

            const nextVersion = existingResumes && existingResumes.length > 0
                ? (existingResumes[0].version || 0) + 1
                : 1;

            const userName = userData?.full_name || (userData?.email ? userData.email.split('@')[0].charAt(0).toUpperCase() + userData.email.split('@')[0].slice(1) : 'My');

            // Create resume record with status 'paid' (subscription active)
            const { data: resume, error: resumeError } = await adminSupabase
                .from('resumes')
                .insert({
                    user_id: user.id,
                    title: `${userName} Resume`,
                    status: 'paid',
                    shareable_link: shareableLink,
                    stripe_session_id: null, // No session for subscription-based creation
                    version: nextVersion,
                    linkedin_content: null,
                    pdf_url: null,
                })
                .select()
                .single();

            // Clean up any existing drafts now that a paid resume is created
            if (!resumeError) {
                await adminSupabase
                    .from('resumes')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('status', 'draft');
            }

            if (resumeError) {
                console.error('Failed to create resume:', resumeError);
                console.error('Resume error details:', {
                    code: resumeError.code,
                    message: resumeError.message,
                    details: resumeError.details,
                    hint: resumeError.hint,
                });
                return NextResponse.json(
                    { error: 'Failed to create resume', details: resumeError.message },
                    { status: 500 }
                );
            }

            console.log('Resume created successfully:', {
                resumeId: resume.id,
                userId: user.id,
                version: nextVersion,
                title: resume.title,
            });

            // Generate and upload PDF for subscription-created resume
            try {
                const { generateAndUploadResumePDF } = await import('@/lib/pdf/generator');
                const { pdfUrl, error: pdfError } = await generateAndUploadResumePDF(user.id);

                if (pdfError) {
                    console.error('PDF generation failed for subscription resume:', pdfError);
                } else if (pdfUrl) {
                    const { error: updateError } = await adminSupabase
                        .from('resumes')
                        .update({ pdf_url: pdfUrl })
                        .eq('id', resume.id);

                    if (updateError) {
                        console.error('Failed to update resume with PDF URL:', updateError);
                    } else {
                        console.log('PDF generated and uploaded for resume:', resume.id);
                    }
                }
            } catch (pdfGenError) {
                console.error('PDF generation error:', pdfGenError);
            }

            // Return success - resume created with active subscription
            return NextResponse.json({
                success: true,
                resumeId: resume.id,
                version: nextVersion,
                message: 'Resume created successfully with active subscription',
            });
        }

        // No active subscription - create subscription checkout session
        const result = await createSubscriptionCheckoutSession(user.id, user.email, parseCampaign(cookieStore.get(CAMPAIGN_COOKIE)?.value));

        if ('error' in result) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            );
        }

        if (!result.session) {
            return NextResponse.json(
                { error: 'Failed to create checkout session' },
                { status: 500 }
            );
        }

        // Return the checkout URL
        return NextResponse.json({
            url: result.session.url,
            sessionId: result.session.id,
        });

    } catch (error) {
        console.error('Checkout API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
