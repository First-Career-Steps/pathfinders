import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase-server';
import { reconcilePurchase } from '@/lib/workshop-commerce';
import { hasWorkshop, WORKSHOP } from '@/lib/workshop';

export const dynamic = 'force-dynamic';
export const metadata = { robots:{index:false,follow:false}, referrer:'no-referrer' as const };
export default async function CheckoutReturn({searchParams}:{searchParams:Promise<{session_id?:string}>}) {
    const {session_id: id} = await searchParams;
    const {data:{user}} = await (await createServerClient()).auth.getUser();
    if (!id || !/^cs_(live|test)_[A-Za-z0-9]{12,180}$/.test(id)) redirect(WORKSHOP);
    const path = WORKSHOP+'/return?session_id='+encodeURIComponent(id);
    if (!user) redirect('/login?redirect='+encodeURIComponent(path));
    let status: string;
    try { status = await reconcilePurchase(id,user); } catch { status='unavailable'; }
    if (status==='ready' || (status==='pending' && hasWorkshop(user.app_metadata))) redirect(WORKSHOP+'/learn');
    const message = status==='wrong-account' ? 'Open this page while signed in to the account you used for enrollment.' :
        status==='pending' ? 'Stripe is still confirming your payment. You can return here or open the workshop from your dashboard once it clears.' :
        status==='unavailable' ? 'Your purchase could not be checked just now. Try again without paying a second time.' : 'This checkout does not provide access to the workshop.';
    return <main className="max-w-xl mx-auto p-8"><h1 className="text-3xl">Workshop enrollment</h1><p className="my-5">{message}</p>
        <a href={path} className="btn-primary inline-block">Check again</a> <Link href={WORKSHOP} className="underline">Workshop overview</Link></main>;
}
