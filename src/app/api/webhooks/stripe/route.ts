import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { verifyWebhookSignature } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase';
import { logger, paymentLogger } from '@/lib/logger';
import crypto from 'crypto';
import { handleWorkshopEvent } from '@/lib/workshop-commerce';
// NOTE: sendEmail and email templates are imported dynamically where needed
// to avoid crashing the entire webhook module if Resend initialization fails.

// Helper function to create resume for subscription
async function createResumeForSubscription(
    supabase: ReturnType<typeof createAdminClient>,
    userId: string,
    subscriptionId: string
) {
    try {
        // Fetch user's basic info (required for FK and title)
        const { data: user, error: userFetchError } = await supabase
            .from('users')
            .select('full_name, email')
            .eq('id', userId)
            .maybeSingle();

        if (userFetchError) {
            paymentLogger.error('Error fetching user for resume creation', {
                error: userFetchError,
                userId,
                subscriptionId,
            });
            return { success: false, error: userFetchError };
        }

        const userName = user?.full_name || user?.email?.split('@')[0] || 'My';

        // Generate unique shareable link
        const shareableLink = crypto.randomUUID();

        // Calculate next version number
        const { data: existingResumes } = await supabase
            .from('resumes')
            .select('version')
            .eq('user_id', userId)
            .order('version', { ascending: false })
            .limit(1);

        const nextVersion = existingResumes && existingResumes.length > 0
            ? (existingResumes[0].version || 0) + 1
            : 1;

        // Create resume record
        const { data: resume, error: resumeError } = await supabase
            .from('resumes')
            .insert({
                user_id: userId,
                title: `${userName} Resume`,
                status: 'paid',
                shareable_link: shareableLink,
                stripe_session_id: null,
                version: nextVersion,
                linkedin_content: null,
                pdf_url: null,
            })
            .select()
            .single();

        // Clean up any existing drafts now that a paid resume is created
        if (!resumeError) {
            await supabase
                .from('resumes')
                .delete()
                .eq('user_id', userId)
                .eq('status', 'draft');
        }

        if (resumeError) {
            paymentLogger.error('Failed to create resume for subscription', {
                error: resumeError,
                code: resumeError.code,
                message: resumeError.message,
                details: resumeError.details,
                hint: resumeError.hint,
                userId,
                subscriptionId,
            });
            return { success: false, error: resumeError };
        }

        paymentLogger.info('Resume created for subscription', {
            userId,
            resumeId: resume.id,
            subscriptionId,
        });

        // Trigger PDF generation
        try {
            const { generateAndUploadResumePDF } = await import('@/lib/pdf/generator');
            const { pdfUrl, error: pdfError } = await generateAndUploadResumePDF(userId);

            if (pdfError) {
                paymentLogger.error('PDF generation failed', {
                    error: pdfError,
                    userId,
                    resumeId: resume.id,
                });
            } else if (pdfUrl) {
                await supabase
                    .from('resumes')
                    .update({ pdf_url: pdfUrl })
                    .eq('id', resume.id);

                paymentLogger.info('PDF generated and uploaded successfully', {
                    userId,
                    resumeId: resume.id,
                    pdfUrl,
                });
            }
        } catch (pdfGenError) {
            paymentLogger.error('PDF generation error', {
                error: pdfGenError,
                resumeId: resume.id,
            });
        }

        return { success: true, resumeId: resume.id };
    } catch (error) {
        paymentLogger.error('Error in createResumeForSubscription', {
            error: error as Error,
            userId,
            subscriptionId,
        });
        return { success: false, error };
    }
}

// Helper function to ensure user exists in public.users
async function ensureUserExists(
    supabase: ReturnType<typeof createAdminClient>,
    userId: string,
    email: string,
    name?: string | null
) {
    const emailPrefix = email.split('@')[0];
    const fallbackName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);

    const { error } = await supabase
        .from('users')
        .upsert(
            {
                id: userId,
                email: email,
                full_name: name || fallbackName,
            },
            { onConflict: 'id' }
        );

    if (error) {
        paymentLogger.error('Failed to ensure user in public.users', {
            error,
            userId,
            email,
            providedName: name,
            fallbackName,
        });
        throw error;
    }
}

export async function POST(request: NextRequest) {
    try {
        // Get the raw body
        const body = await request.text();
        const headersList = await headers();
        const signature = headersList.get('stripe-signature');

        if (!signature) {
            paymentLogger.error('Missing Stripe signature header');
            return NextResponse.json(
                { error: 'Missing signature' },
                { status: 400 }
            );
        }

        // Verify webhook signature
        const event = verifyWebhookSignature(body, signature);

        if (!event) {
            paymentLogger.error('Invalid webhook signature', {
                hasSignature: !!signature,
                hasBody: !!body,
                bodyLength: body?.length,
                webhookSecretSet: !!process.env.STRIPE_WEBHOOK_SECRET,
            });
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 400 }
            );
        }

        paymentLogger.info('Webhook received', {
            type: event.type,
            id: event.id,
        });

        if (await handleWorkshopEvent(event)) return NextResponse.json({ received: true });

        // Handle the event
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;

                paymentLogger.info('Checkout session completed', {
                    sessionId: session.id,
                    customerId: session.customer,
                    mode: session.mode,
                    subscriptionId: session.subscription,
                });

                // Extract userId: metadata first, then client_reference_id (fallback)
                const userId = session.metadata?.userId || session.client_reference_id;

                if (!userId) {
                    paymentLogger.error('Missing userId in session metadata and client_reference_id', {
                        sessionId: session.id,
                    });
                    break;
                }

                try {
                    const supabase = createAdminClient();

                    // If this is a subscription checkout, create subscription record immediately
                    // This ensures subscription is created even if customer.subscription.created doesn't fire
                    if (session.mode === 'subscription' && session.subscription) {
                        paymentLogger.info('Subscription checkout completed, creating subscription record', {
                            sessionId: session.id,
                            subscriptionId: session.subscription,
                            userId,
                        });

                        try {
                            const stripe = (await import('@/lib/stripe')).getStripe();
                            const subscriptionObj = await stripe.subscriptions.retrieve(session.subscription as string);

                            const subData = subscriptionObj as unknown as Stripe.Subscription & {
                                current_period_start: number;
                                current_period_end: number;
                                cancel_at_period_end: boolean | null;
                            };

                            const customerId = typeof subData.customer === 'string'
                                ? subData.customer
                                : subData.customer.id;

                            // Ensure user exists in public.users (FK for subscriptions/resumes) – new signups may only be in auth.users
                            const customer = await stripe.customers.retrieve(customerId);
                            if (!customer.deleted && 'email' in customer && customer.email) {
                                await ensureUserExists(supabase, userId, customer.email, (customer as Stripe.Customer).name);
                            }

                            // Create subscription record
                            const { error: subError } = await supabase
                                .from('subscriptions')
                                .upsert({
                                    user_id: userId,
                                    stripe_subscription_id: subData.id,
                                    stripe_customer_id: customerId,
                                    status: subData.status,
                                    current_period_start: new Date(subData.current_period_start * 1000).toISOString(),
                                    current_period_end: new Date(subData.current_period_end * 1000).toISOString(),
                                    cancel_at_period_end: subData.cancel_at_period_end || false,
                                    updated_at: new Date().toISOString(),
                                }, {
                                    // subscriptions table enforces ONE row per user (user_id UNIQUE)
                                    // Upsert by user_id so we always persist subscription status for the user.
                                    onConflict: 'user_id',
                                });

                            if (subError) {
                                paymentLogger.error('Failed to create subscription record in checkout.session.completed', {
                                    error: subError,
                                    userId,
                                    subscriptionId: subscriptionObj.id,
                                });
                                // Critical: if we can't persist subscription, fail the webhook so Stripe retries.
                                throw subError;
                            } else {
                                paymentLogger.info('Subscription record created successfully in checkout.session.completed', {
                                    userId,
                                    subscriptionId: subscriptionObj.id,
                                    status: subscriptionObj.status,
                                });
                            }

                            // Create first resume when subscription is active or trialing (new paid user)
                            const statusOk = subscriptionObj.status === 'active' || subscriptionObj.status === 'trialing';
                            if (statusOk) {
                                const { data: existingResume } = await supabase
                                    .from('resumes')
                                    .select('id')
                                    .eq('user_id', userId)
                                    .order('created_at', { ascending: false })
                                    .limit(1);

                                if (!existingResume || existingResume.length === 0) {
                                    const result = await createResumeForSubscription(supabase, userId, subscriptionObj.id);
                                    if (!result.success) {
                                        paymentLogger.error('createResumeForSubscription failed in checkout.session.completed', {
                                            userId,
                                            subscriptionId: subscriptionObj.id,
                                            error: result.error,
                                        });
                                        throw result.error ?? new Error('Resume creation failed');
                                    }
                                } else {
                                    paymentLogger.info('Resume already exists, skipping creation', {
                                        userId,
                                        resumeId: existingResume[0].id,
                                    });
                                }
                            } else {
                                paymentLogger.info('Subscription status not active/trialing yet, will try fallback', {
                                    userId,
                                    status: subscriptionObj.status,
                                });
                            }

                            // Fallback: if we still have no resume for this user (e.g. status was incomplete), create one
                            const { data: resumeCheck } = await supabase
                                .from('resumes')
                                .select('id')
                                .eq('user_id', userId)
                                .limit(1);
                            if (!resumeCheck || resumeCheck.length === 0) {
                                paymentLogger.info('Fallback: creating first resume for user after subscription checkout', {
                                    userId,
                                    subscriptionId: session.subscription,
                                });
                                const fallbackResult = await createResumeForSubscription(
                                    supabase,
                                    userId,
                                    typeof session.subscription === 'string' ? session.subscription : session.subscription?.id ?? ''
                                );
                                if (!fallbackResult.success) {
                                    paymentLogger.error('Fallback createResumeForSubscription failed', {
                                        userId,
                                        error: fallbackResult.error,
                                    });
                                    throw fallbackResult.error ?? new Error('Resume creation failed');
                                }
                            }
                        } catch (subError) {
                            paymentLogger.error('Error processing subscription checkout', {
                                error: subError,
                                userId,
                                sessionId: session.id,
                            });
                            // IMPORTANT: do not swallow subscription persistence errors.
                            // If we return 200 here, Stripe will not retry and the user ends up "paid" but unsubscribed in DB.
                            throw subError;
                        }
                        break;
                    }

                    // Legacy one-time payment handling (for backward compatibility)
                    // Verify profile exists (but don't need to use the data)
                    const { error: profileError } = await supabase
                        .from('profile')
                        .select('id')
                        .eq('user_id', userId)
                        .single();

                    if (profileError) {
                        paymentLogger.error('Failed to fetch user profile', {
                            error: profileError,
                            userId,
                            sessionId: session.id,
                        });
                        break;
                    }

                    // Fetch user's basic info
                    const { data: user, error: userError } = await supabase
                        .from('users')
                        .select('full_name, email')
                        .eq('id', userId)
                        .maybeSingle();

                    if (userError) {
                        paymentLogger.error('Failed to fetch user info in legacy block', {
                            error: userError,
                            userId,
                            sessionId: session.id,
                        });
                    }

                    const legacyUserName = user?.full_name || user?.email?.split('@')[0] || 'My';

                    // Generate unique shareable link
                    const shareableLink = crypto.randomUUID();

                    // Calculate next version number (restarts from 1 if all resumes deleted)
                    const { data: existingResumes } = await supabase
                        .from('resumes')
                        .select('version')
                        .eq('user_id', userId)
                        .order('version', { ascending: false })
                        .limit(1);

                    const nextVersion = existingResumes && existingResumes.length > 0
                        ? (existingResumes[0].version || 0) + 1
                        : 1;

                    // Create resume record with status 'paid'
                    const { data: resume, error: resumeError } = await supabase
                        .from('resumes')
                        .insert({
                            user_id: userId,
                            title: `${legacyUserName} Resume`,
                            status: 'paid',
                            shareable_link: shareableLink,
                            stripe_session_id: session.id,
                            version: nextVersion,
                            linkedin_content: null, // Will be generated later
                            pdf_url: null, // Will be generated later
                        })
                        .select()
                        .single();

                    // Clean up any existing drafts now that a paid resume is created
                    if (!resumeError) {
                        await supabase
                            .from('resumes')
                            .delete()
                            .eq('user_id', userId)
                            .eq('status', 'draft');
                    }

                    if (resumeError) {
                        paymentLogger.error('Failed to create resume record', {
                            error: resumeError,
                            userId,
                            sessionId: session.id,
                        });
                    } else {
                        paymentLogger.info('Resume record created successfully', {
                            userId,
                            resumeId: resume.id,
                            sessionId: session.id,
                            shareableLink,
                        });

                        // Trigger PDF generation
                        paymentLogger.info('Starting PDF generation', {
                            userId,
                            resumeId: resume.id,
                        });

                        try {
                            // Import PDF generator dynamically to avoid edge runtime issues
                            const { generateAndUploadResumePDF } = await import('@/lib/pdf/generator');

                            const { pdfUrl, error: pdfError } = await generateAndUploadResumePDF(userId);

                            if (pdfError) {
                                paymentLogger.error('PDF generation failed', {
                                    error: pdfError,
                                    userId,
                                    resumeId: resume.id,
                                });
                            } else if (pdfUrl) {
                                // Update resume with PDF URL
                                const { error: updateError } = await supabase
                                    .from('resumes')
                                    .update({ pdf_url: pdfUrl })
                                    .eq('id', resume.id);

                                if (updateError) {
                                    paymentLogger.error('Failed to update resume with PDF URL', {
                                        error: updateError,
                                        resumeId: resume.id,
                                    });
                                } else {
                                    paymentLogger.info('PDF generated and uploaded successfully', {
                                        userId,
                                        resumeId: resume.id,
                                        pdfUrl,
                                    });
                                }
                            }
                        } catch (pdfGenError) {
                            paymentLogger.error('PDF generation error', {
                                error: pdfGenError,
                                userId,
                                resumeId: resume.id,
                            });
                        }
                    }

                } catch (error) {
                    paymentLogger.error('Error processing payment', {
                        error: error as Error,
                        userId,
                        sessionId: session.id,
                    });
                }

                break;
            }

            case 'customer.subscription.created':
            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;

                paymentLogger.info('Subscription event', {
                    eventType: event.type,
                    subscriptionId: subscription.id,
                    customerId: subscription.customer,
                    status: subscription.status,
                });

                try {
                    const supabase = createAdminClient();
                    const stripe = (await import('@/lib/stripe')).getStripe();

                    // subscription.customer can be string (id) or expanded Customer object – retrieve needs string id
                    const customerIdStr = typeof subscription.customer === 'string'
                        ? subscription.customer
                        : (subscription.customer as Stripe.Customer).id;

                    const customerRaw = await stripe.customers.retrieve(customerIdStr);
                    const customer = customerRaw.deleted ? null : (customerRaw as Stripe.Customer);

                    if (!customer) {
                        paymentLogger.error('Customer not found or deleted', {
                            customerId: customerIdStr,
                        });
                        break;
                    }

                    // userId: metadata first, then fallback to checkout session (Stripe may not always set customer metadata)
                    let userId: string | null =
                        (customer.metadata && typeof customer.metadata.userId === 'string' ? customer.metadata.userId : null)
                        || (subscription.metadata && typeof subscription.metadata.userId === 'string' ? subscription.metadata.userId : null);

                    if (!userId) {
                        try {
                            const sessions = await stripe.checkout.sessions.list({
                                subscription: subscription.id,
                                limit: 1,
                            });
                            const session = sessions.data[0];
                            userId = (session?.metadata?.userId as string) || (session?.client_reference_id as string) || null;
                        } catch (listErr) {
                            paymentLogger.error('Failed to list checkout sessions for userId fallback', {
                                error: listErr as Error,
                                subscriptionId: subscription.id,
                            });
                        }
                    }

                    if (!userId) {
                        paymentLogger.error('Missing userId in customer or subscription metadata and checkout session', {
                            subscriptionId: subscription.id,
                            customerId: customerIdStr,
                        });
                        break;
                    }

                    // Ensure user exists in public.users (FK for subscriptions/resumes) – required before subscription upsert
                    const customerEmail = typeof customer.email === 'string' ? customer.email : null;
                    if (customerEmail) {
                        await ensureUserExists(supabase, userId, customerEmail, customer.name);
                    }

                    // Fetch full subscription so we always have current_period_* (event object can be minimal)
                    const fullSub = await stripe.subscriptions.retrieve(subscription.id);
                    const subData = fullSub as Stripe.Subscription & {
                        current_period_start?: number;
                        current_period_end?: number;
                        cancel_at_period_end?: boolean | null;
                    };

                    const rawStart = subData.current_period_start;
                    const rawEnd = subData.current_period_end;
                    const periodStart =
                        rawStart != null && (typeof rawStart === 'number' || typeof rawStart === 'string')
                            ? new Date(typeof rawStart === 'number' ? rawStart * 1000 : parseInt(rawStart, 10) * 1000).toISOString()
                            : new Date().toISOString();
                    const periodEnd =
                        rawEnd != null && (typeof rawEnd === 'number' || typeof rawEnd === 'string')
                            ? new Date(typeof rawEnd === 'number' ? rawEnd * 1000 : parseInt(String(rawEnd), 10) * 1000).toISOString()
                            : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

                    const { error: subError } = await supabase
                        .from('subscriptions')
                        .upsert({
                            user_id: userId,
                            stripe_subscription_id: subData.id,
                            stripe_customer_id: customerIdStr,
                            status: subData.status,
                            current_period_start: periodStart,
                            current_period_end: periodEnd,
                            cancel_at_period_end: subData.cancel_at_period_end ?? false,
                            updated_at: new Date().toISOString(),
                        }, {
                            onConflict: 'user_id',
                        });

                    if (subError) {
                        paymentLogger.error('Failed to upsert subscription', {
                            error: subError,
                            userId,
                            subscriptionId: subscription.id,
                        });
                        throw subError;
                    }

                    paymentLogger.info('Subscription record updated successfully', {
                        userId,
                        subscriptionId: subscription.id,
                        status: subscription.status,
                    });

                    // If subscription is newly created and active/trialing, create first resume
                    if (event.type === 'customer.subscription.created' && (fullSub.status === 'active' || fullSub.status === 'trialing')) {
                        // Ensure user exists in public.users before resume creation (we may have skipped upsert if customerEmail was missing)
                        const { data: existingUser } = await supabase
                            .from('users')
                            .select('id')
                            .eq('id', userId)
                            .single();
                        if (!existingUser) {
                            const emailToUse = customerEmail || (await (async () => {
                                try {
                                    const sessions = await stripe.checkout.sessions.list({ subscription: subscription.id, limit: 1 });
                                    const sess = sessions.data[0] as { customer_email?: string } | undefined;
                                    return sess?.customer_email ?? null;
                                } catch {
                                    return null;
                                }
                            })());
                            if (emailToUse) {
                                await ensureUserExists(supabase, userId, emailToUse, customer?.name);
                            }
                        }

                        const { data: existingResume } = await supabase
                            .from('resumes')
                            .select('id')
                            .eq('user_id', userId)
                            .order('created_at', { ascending: false })
                            .limit(1);

                        if (!existingResume || existingResume.length === 0) {
                            const result = await createResumeForSubscription(supabase, userId, subscription.id);
                            if (!result.success) {
                                paymentLogger.error('createResumeForSubscription failed in subscription event', {
                                    userId,
                                    subscriptionId: subscription.id,
                                    error: result.error,
                                });
                                throw result.error ?? new Error('Resume creation failed');
                            }
                        } else {
                            paymentLogger.info('Resume already exists from checkout.session.completed', {
                                userId,
                                resumeId: existingResume[0].id,
                                subscriptionId: subscription.id,
                            });
                        }
                    }
                } catch (error) {
                    const err = error as Error & { code?: string; details?: string };
                    paymentLogger.error('Error processing subscription', {
                        message: err.message,
                        stack: err.stack,
                        code: err.code,
                        details: err.details,
                        subscriptionId: subscription.id,
                    });
                    throw error;
                }

                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;

                paymentLogger.info('Subscription deleted', {
                    subscriptionId: subscription.id,
                    customerId: subscription.customer,
                });

                try {
                    const supabase = createAdminClient();

                    // Update subscription status to canceled
                    const { error: updateError } = await supabase
                        .from('subscriptions')
                        .update({
                            status: 'canceled',
                            updated_at: new Date().toISOString(),
                        })
                        .eq('stripe_subscription_id', subscription.id);

                    if (updateError) {
                        paymentLogger.error('Failed to update subscription status', {
                            error: updateError,
                            subscriptionId: subscription.id,
                        });
                    } else {
                        paymentLogger.info('Subscription marked as canceled', {
                            subscriptionId: subscription.id,
                        });
                    }
                } catch (error) {
                    paymentLogger.error('Error processing subscription deletion', {
                        error: error as Error,
                        subscriptionId: subscription.id,
                    });
                }

                break;
            }

            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as Stripe.Invoice;
                // Type assertion for invoice properties that may not be in type definition
                const invoiceData = invoice as Stripe.Invoice & {
                    subscription?: string | Stripe.Subscription | null;
                    customer?: string | Stripe.Customer | null;
                };

                // Invoice.subscription can be a string ID or a Subscription object
                // Use type guards to safely access properties
                const subscriptionId = invoiceData.subscription
                    ? (typeof invoiceData.subscription === 'string'
                        ? invoiceData.subscription
                        : (invoiceData.subscription as Stripe.Subscription)?.id)
                    : null;
                const customerId = invoiceData.customer
                    ? (typeof invoiceData.customer === 'string'
                        ? invoiceData.customer
                        : (invoiceData.customer as Stripe.Customer)?.id)
                    : null;

                paymentLogger.info('Invoice payment succeeded', {
                    invoiceId: invoice.id,
                    subscriptionId: subscriptionId,
                    customerId: customerId,
                });

                // Subscription renewals are handled automatically by Stripe
                // We just log this for tracking purposes
                if (subscriptionId) {
                    paymentLogger.info('Subscription renewal payment succeeded', {
                        invoiceId: invoice.id,
                        subscriptionId: subscriptionId,
                    });
                }

                if (invoice.amount_paid > 0 && invoice.customer_email) {
                    try {
                        /* Temporarily disabled due to DNS issues
                        const amount = new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: invoice.currency,
                        }).format(invoice.amount_paid / 100);

                        await sendEmail({
                            to: invoice.customer_email,
                            subject: 'Payment Successful - First Career Steps',
                            html: PaymentSuccessEmailTemplate(invoice.customer_name || 'Valued Customer', amount),
                        });
                        paymentLogger.info('Payment success email sent', { email: invoice.customer_email, invoiceId: invoice.id });
                        */
                    } catch (emailError) {
                        paymentLogger.error(emailError as Error, { context: 'sendPaymentSuccessEmail', invoiceId: invoice.id });
                    }
                }

                break;
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object as Stripe.Invoice;

                paymentLogger.info('Invoice payment failed', {
                    invoiceId: invoice.id,
                    customer: invoice.customer,
                    email: invoice.customer_email
                });

                if (invoice.customer_email) {
                    try {
                        /* Temporarily disabled due to DNS issues
                        const { sendEmail } = await import('@/lib/email');
                        const { PaymentFailedEmailTemplate } = await import('@/components/emails/templates');
                                                await sendEmail({
                                                    to: invoice.customer_email,
                                                    subject: 'Payment Failed - First Career Steps',
                                                    html: PaymentFailedEmailTemplate(invoice.customer_name || 'Valued Customer'),
                                                });
                                                paymentLogger.info('Payment failed email sent', { email: invoice.customer_email, invoiceId: invoice.id });
                        */
                    } catch (emailError) {
                        paymentLogger.error(emailError as Error, { context: 'sendPaymentFailedEmail', invoiceId: invoice.id });
                    }
                }
                break;
            }

            case 'checkout.session.expired': {
                const session = event.data.object as Stripe.Checkout.Session;

                paymentLogger.info('Checkout session expired', {
                    sessionId: session.id,
                });

                // Optionally update resume status to expired
                break;
            }

            default:
                logger.info('Webhook', `Unhandled event type: ${event.type}`, {
                    eventId: event.id,
                });
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        const err = error as Error & { code?: string; details?: string };
        logger.error('Webhook Handler', err, {
            message: err.message,
            stack: err.stack,
            code: err.code,
            details: err.details,
        });
        return NextResponse.json(
            { error: 'Webhook handler failed', message: err.message },
            { status: 500 }
        );
    }
}

// Configure route for webhook handling
// Note: In App Router, we handle raw body in the route itself
export const runtime = 'nodejs';
