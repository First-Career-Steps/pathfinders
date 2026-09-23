/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Campaign } from "@/lib/acquisition";
import Stripe from 'stripe';
import { loadStripe, Stripe as StripeClient } from '@stripe/stripe-js';

// Environment variable validation
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Logger utility for Stripe operations
export const stripeLogger = {
    error: (operation: string, error: any, context?: any) => {
        console.error(`[Stripe Error] ${operation}:`, {
            error: error.message || error,
            type: error.type,
            code: error.code,
            statusCode: error.statusCode,
            context,
            timestamp: new Date().toISOString(),
        });
    },
    info: (operation: string, message: string, data?: any) => {
        console.log(`[Stripe Info] ${operation}:`, {
            message,
            data,
            timestamp: new Date().toISOString(),
        });
    },
    warn: (operation: string, message: string, data?: any) => {
        console.warn(`[Stripe Warning] ${operation}:`, {
            message,
            data,
            timestamp: new Date().toISOString(),
        });
    },
};

// Server-side Stripe instance
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
    if (!stripeSecretKey) {
        const error = new Error('STRIPE_SECRET_KEY is not defined');
        stripeLogger.error('Stripe Initialization', error);
        throw error;
    }

    if (!stripeInstance) {
        try {
            stripeInstance = new Stripe(stripeSecretKey, {
                apiVersion: '2025-12-15.clover',
                typescript: true,
            });
            stripeLogger.info('Stripe Initialization', 'Stripe instance created successfully');
        } catch (error) {
            stripeLogger.error('Stripe Initialization', error);
            throw error;
        }
    }

    return stripeInstance;
}

// Client-side Stripe instance
let stripePromise: Promise<StripeClient | null> | null = null;

export function getStripeClient(): Promise<StripeClient | null> {
    if (!stripePublishableKey) {
        const error = new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not defined');
        stripeLogger.error('Stripe Client Initialization', error);
        throw error;
    }

    if (!stripePromise) {
        try {
            stripePromise = loadStripe(stripePublishableKey);
            stripeLogger.info('Stripe Client Initialization', 'Stripe client promise created');
        } catch (error) {
            stripeLogger.error('Stripe Client Initialization', error);
            throw error;
        }
    }

    return stripePromise;
}

// Get webhook secret
export function getWebhookSecret(): string {
    if (!stripeWebhookSecret) {
        const error = new Error('STRIPE_WEBHOOK_SECRET is not defined');
        stripeLogger.error('Webhook Secret', error);
        throw error;
    }
    return stripeWebhookSecret;
}

// Helper function to handle Stripe errors consistently
export function handleStripeError(operation: string, error: any, context?: any) {
    stripeLogger.error(operation, error, context);

    // Return user-friendly error messages based on Stripe error types
    if (error.type === 'StripeCardError') {
        return { error: 'Your card was declined. Please try a different payment method.' };
    }

    if (error.type === 'StripeInvalidRequestError') {
        return { error: 'Invalid payment request. Please try again.' };
    }

    if (error.type === 'StripeAPIError') {
        return { error: 'Payment service is temporarily unavailable. Please try again later.' };
    }

    if (error.type === 'StripeConnectionError') {
        return { error: 'Network error. Please check your connection and try again.' };
    }

    if (error.type === 'StripeAuthenticationError') {
        return { error: 'Payment authentication failed. Please contact support.' };
    }

    if (error.type === 'StripeRateLimitError') {
        return { error: 'Too many requests. Please wait a moment and try again.' };
    }

    // Generic error message
    return { error: 'Payment processing failed. Please try again later.' };
}

// Stripe configuration constants
export const STRIPE_CONFIG = {
    PRODUCT_NAME: 'Resume Builder Annual Subscription',
    AMOUNT: 199, // $1.99 in cents
    CURRENCY: 'usd',
    SUCCESS_URL: '/checkout/success',
    CANCEL_URL: '/checkout/cancel',
    INTERVAL: 'year' as const, // Annual subscription
};

// Helper function to create subscription checkout session
export async function createSubscriptionCheckoutSession(userId: string, customerEmail?: string, campaign: Campaign = {}) {
    try {
        const stripe = getStripe();

        stripeLogger.info('Create Subscription Checkout Session', 'Creating subscription session', {
            userId,
        });

        // Create or retrieve customer
        let customerId: string | undefined;
        if (customerEmail) {
            const customers = await stripe.customers.list({
                email: customerEmail,
                limit: 1,
            });

            if (customers.data.length > 0) {
                customerId = customers.data[0].id;
                // Update existing customer metadata to ensure userId is set
                await stripe.customers.update(customerId, {
                    metadata: {
                        userId,
                    },
                });
            } else {
                const customer = await stripe.customers.create({
                    email: customerEmail,
                    metadata: {
                        userId,
                    },
                });
                customerId = customer.id;
            }
        }

        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            customer: customerId,
            client_reference_id: userId,
            payment_method_types: ['card'],
            allow_promotion_codes: true,
            line_items: [
                {
                    price_data: {
                        currency: STRIPE_CONFIG.CURRENCY,
                        product_data: {
                            name: STRIPE_CONFIG.PRODUCT_NAME,
                            description: 'Unlimited resume creation for one year',
                        },
                        unit_amount: STRIPE_CONFIG.AMOUNT,
                        recurring: {
                            interval: STRIPE_CONFIG.INTERVAL,
                        },
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                ...campaign,
                userId,
            },
            subscription_data: {
                metadata: {
                    ...campaign,
                    userId,
                },
            },
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}${STRIPE_CONFIG.SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}${STRIPE_CONFIG.CANCEL_URL}`,
        });

        stripeLogger.info('Create Subscription Checkout Session', 'Session created successfully', {
            sessionId: session.id,
            userId,
            customerId,
        });

        return { session };
    } catch (error) {
        return handleStripeError('Create Subscription Checkout Session', error, { userId });
    }
}

// Legacy function for backward compatibility (now creates subscription)
export async function createCheckoutSession(userId: string, _resumeId: string) {
    return createSubscriptionCheckoutSession(userId);
}

// Helper function to verify webhook signature
export function verifyWebhookSignature(payload: string | Buffer, signature: string): Stripe.Event | null {
    try {
        const stripe = getStripe();
        const webhookSecret = getWebhookSecret();

        // Convert payload to Buffer if it's a string
        const payloadBuffer = typeof payload === 'string' ? Buffer.from(payload) : payload;

        const event = stripe.webhooks.constructEvent(payloadBuffer, signature, webhookSecret);

        stripeLogger.info('Webhook Verification', 'Signature verified successfully', {
            eventType: event.type,
            eventId: event.id,
        });

        return event;
    } catch (error: any) {
        stripeLogger.error('Webhook Verification', error, {
            signature: signature?.substring(0, 20) + '...',
            errorMessage: error.message,
            errorType: error.type,
        });
        return null;
    }
}

// Helper function to check if user has active subscription (active or trialing)
export async function hasActiveSubscription(userId: string, supabaseClient: any): Promise<boolean> {
    try {
        const { data: subscription, error } = await supabaseClient
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .in('status', ['active', 'trialing'])
            .order('current_period_end', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error || !subscription) {
            return false;
        }

        // Check if subscription is still within current period
        const now = new Date();
        const periodEnd = new Date(subscription.current_period_end);

        return periodEnd > now && !subscription.cancel_at_period_end;
    } catch (error) {
        stripeLogger.error('Check Active Subscription', error, { userId });
        return false;
    }
}
