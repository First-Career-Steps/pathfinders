import { createHmac, timingSafeEqual } from 'node:crypto';
import type Stripe from 'stripe';
import { getStripe, getWebhookSecret } from './stripe';
import { createAdminClient } from './supabase';
import { WORKSHOP_KEY } from './workshop';

export const workshopLinkId = () => process.env.STRIPE_RESUME_WORKSHOP_PAYMENT_LINK ?? 'plink_1UfLqQ2KBKxfQZh7mtJDdRSJ';
const uuid = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;

export function enrollmentRef(id: string, secret = getWebhookSecret()) {
    const signature = createHmac('sha256', secret).update(WORKSHOP_KEY + '/' + id).digest('hex');
    return id + '_' + signature;
}

export function boundStudent(reference: string | null, secret = getWebhookSecret()) {
    const [id, hash, extra] = (reference || '').split('_');
    if (!uuid.test(id) || !/^[0-9a-f]{64}$/.test(hash || '') || extra !== undefined) return null;
    const expected = enrollmentRef(id, secret).split('_')[1];
    return timingSafeEqual(Buffer.from(hash), Buffer.from(expected)) ? id : null;
}

type OfferFields = Pick<Stripe.Checkout.Session, 'payment_link' | 'metadata' | 'mode' | 'currency' | 'amount_subtotal'>;
export function matchesOffer(session: OfferFields, linkId = workshopLinkId()) {
    return Boolean(linkId) && session.payment_link === linkId &&
        session.metadata?.fcs_workshop === WORKSHOP_KEY && session.mode === 'payment' &&
        session.currency === 'usd' && session.amount_subtotal === 499;
}

export async function offerState() {
    if (!workshopLinkId()) return 'soon';
    try { return (await getStripe().paymentLinks.retrieve(workshopLinkId())).active ? 'open' : 'closed'; }
    catch { return 'unavailable'; }
}

// Retrieve current Stripe state even for replayed events, including refunds.
type Viewer = { id: string; email?: string; email_confirmed_at?: string };
const purchaseServices = { stripe: getStripe, admin: createAdminClient, verifyRef: boundStudent };

export async function reconcilePurchase(sessionId: string, viewer?: Viewer, services = purchaseServices) {
    const stripe = services.stripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['payment_intent.latest_charge'] });
    if (!matchesOffer(session)) return 'invalid';
    const claimed = session.metadata?.fcs_claimed_user || '';
    const buyer = services.verifyRef(session.client_reference_id) || (uuid.test(claimed) ? claimed : null);
    // A bare Payment Link has no signed reference. Its verified payer can claim
    // the purchase on return using the matching confirmed account.
    const payerMatches = viewer?.email_confirmed_at && viewer.email && session.customer_details?.email &&
        viewer.email.toLowerCase() === session.customer_details.email.toLowerCase();
    const student = buyer || (payerMatches ? viewer?.id : undefined);
    if (!student || (viewer && viewer.id !== student)) return 'wrong-account';
    if (session.payment_status !== 'paid') return 'pending';
    const intent = session.payment_intent as Stripe.PaymentIntent | null;
    const charge = intent?.latest_charge as Stripe.Charge | null;
    if (!charge || typeof charge !== 'object') return 'pending';
    const auth = services.admin().auth.admin;
    const { data, error } = await auth.getUserById(student);
    if (error && error.status === 404) return 'missing-account';
    if (error) throw error;
    if (!data.user || data.user.app_metadata?.deletion_in_progress) return 'missing-account';
    const existing = data.user.app_metadata[WORKSHOP_KEY];
    if (charge.refunded || charge.disputed) {
        if (existing === session.id) {
            const result = await auth.updateUserById(student, { app_metadata: { [WORKSHOP_KEY]: null } });
            if (result.error) throw result.error;
        }
        return 'reversed';
    }
    if (!buyer) await stripe.checkout.sessions.update(session.id, {metadata: { fcs_claimed_user: student }});
    if (existing !== session.id) {
        const result = await auth.updateUserById(student, { app_metadata: { [WORKSHOP_KEY]: session.id } });
        if (result.error) throw result.error;
    }
    return 'ready';
}

export async function handleWorkshopEvent(event: Stripe.Event) {
    if (event.type.startsWith('checkout.session.')) {
        const session = event.data.object as Stripe.Checkout.Session;
        if (!workshopLinkId() || session.payment_link !== workshopLinkId()) return session.metadata?.fcs_workshop === WORKSHOP_KEY;
        if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
            await reconcilePurchase(session.id);
        }
        return true;
    }
    if (event.type === 'charge.refunded') {
        const charge = event.data.object as Stripe.Charge;
        if (charge.metadata?.fcs_workshop !== WORKSHOP_KEY || typeof charge.payment_intent !== 'string') return false;
        const sessions = await getStripe().checkout.sessions.list({ payment_intent: charge.payment_intent, limit: 1 });
        if (sessions.data[0]) await reconcilePurchase(sessions.data[0].id);
        return true;
    }
    return false;
}
