import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase';
import { getStripe } from '@/lib/stripe';
import { runAccountDeletion, type DeletionAsset } from '@/lib/account-deletion';
import { recentSignIn, sameOriginWrite } from '@/lib/student-privacy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
const headers = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' };

export async function DELETE(request: NextRequest) {
  if (!sameOriginWrite(request.headers.get('origin'), request.url)) {
    return NextResponse.json({ error: 'Open account settings on this website to delete your account.' }, { status: 403, headers });
  }
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return NextResponse.json({ error: 'A confirmation is required.' }, { status: 415, headers });
  }
  let body: { confirmation?: unknown };
  try {
    const text = await request.text();
    if (text.length > 256) throw new Error('Oversized confirmation');
    body = JSON.parse(text);
    if (!body || typeof body !== 'object') throw new Error('Invalid confirmation');
  } catch {
    return NextResponse.json({ error: 'A valid confirmation is required.' }, { status: 400, headers });
  }
  if (body.confirmation !== 'DELETE') {
    return NextResponse.json({ error: 'Type DELETE to confirm.' }, { status: 400, headers });
  }

  let stage = 'authentication';
  try {
    const sessionClient = await createServerClient();
    const { data: { user }, error: authError } = await sessionClient.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Please sign in first.' }, { status: 401, headers });
    }
    if (!recentSignIn(user.last_sign_in_at)) {
      return NextResponse.json({ code: 'REAUTH_REQUIRED', error: 'For your security, sign out and sign back in, then return to Settings to delete your account.' }, { status: 409, headers });
    }
    // Never take a target user, customer ID, or file path from the browser.
    const admin = createAdminClient();
    const stripe = getStripe();
    const { data: subscriptions, error: subscriptionError } = await admin
      .from('subscriptions').select('stripe_subscription_id, stripe_customer_id').eq('user_id', user.id);
    if (subscriptionError) throw new Error('Unable to verify subscriptions');
    const subscriptionIds = new Set<string>((subscriptions || []).map(row => row.stripe_subscription_id));
    const customerIds = new Set<string>((subscriptions || []).map(row => row.stripe_customer_id));

    // Find incomplete/open checkouts too; they may not yet have a subscriptions row.
    // An email match alone NEVER authorizes a cancellation.
    if (user.email) {
      for await (const customer of stripe.customers.list({ email: user.email, limit: 100 })) {
        if (customer.metadata.userId === user.id) customerIds.add(customer.id);
      }
    }

    await runAccountDeletion({
      restrictAccount: async () => {
        stage = 'restrict';
        const { error } = await admin.auth.admin.updateUserById(user.id, {
          app_metadata: { ...user.app_metadata, deletion_in_progress: true },
        });
        if (error) throw new Error('Unable to restrict account');
      },
      cancelBilling: async () => {
        stage = 'billing';
        // Use Stripe as the source of truth and handle every page, not only an active row.
        for (const customerId of customerIds) {
          for await (const checkout of stripe.checkout.sessions.list({ customer: customerId, status: 'open', limit: 100 })) {
            if (checkout.client_reference_id === user.id || checkout.metadata?.userId === user.id) {
              await stripe.checkout.sessions.expire(checkout.id);
            }
          }
          for await (const subscription of stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 100 })) {
            if (subscription.metadata.userId === user.id || subscriptionIds.has(subscription.id)) {
              subscriptionIds.add(subscription.id);
            }
          }
        }
        for (const subscriptionId of subscriptionIds) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          if (!['canceled', 'incomplete_expired'].includes(subscription.status)) {
            await stripe.subscriptions.cancel(subscription.id, { invoice_now: false, prorate: false });
          }
        }
      },
      listAssets: async () => {
        stage = 'files';
        const { data, error } = await admin.rpc('fcs_account_storage', { target_user: user.id });
        if (error) throw new Error('Unable to list account files');
        return (data || []) as DeletionAsset[];
      },
      removeAssets: async (bucket, names) => {
        const { error } = await admin.storage.from(bucket).remove(names);
        if (error) throw new Error('Unable to remove account files');
      },
      purgeLinkedLogs: async () => {
        stage = 'logs';
        const { error } = await admin.rpc('fcs_purge_account_logs', { target_user: user.id });
        if (error) throw new Error('Unable to remove linked diagnostics');
      },
      deleteIdentity: async () => {
        stage = 'identity';
        // Hard deletion cascades through the verified user/profile/resume tables.
        // The database privacy policy also rejects still-unexpired JWTs for deleted users.
        const { error } = await admin.auth.admin.deleteUser(user.id, false);
        if (error) throw new Error('Unable to delete identity');
      },
    });
    // Clear SSR auth cookies after the identity has gone. A missing server session is expected.
    await sessionClient.auth.signOut({ scope: 'local' }).catch(() => undefined);
    return NextResponse.json({ deleted: true }, { headers });
  } catch {
    // Do not log credentials, resume data, email, or raw payment-provider errors.
    console.error('[account-deletion]', { stage });
    return NextResponse.json({
      error: 'Deletion did not finish. Some cleanup or subscription cancellation may already be complete, and your account may be restricted. Sign in again if asked, then retry. For help, contact brenenmorsecorp@gmail.com.',
    }, { status: 503, headers });
  }
}
