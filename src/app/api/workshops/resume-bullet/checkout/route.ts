import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { getStripe } from '@/lib/stripe';
import { enrollmentRef, workshopLinkId } from '@/lib/workshop-commerce';
import { hasWorkshop, WORKSHOP, workshopLogin } from '@/lib/workshop';
import { sameOriginWrite } from '@/lib/student-privacy';

export async function POST(request: NextRequest) {
    if (!sameOriginWrite(request.headers.get('origin'),request.url)) {
        return new NextResponse('Open checkout from the workshop page.', { status: 403 });
    }
    const go = (path: string) => NextResponse.redirect(new URL(path, request.url), 303);
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return go(workshopLogin);
    if (hasWorkshop(user.app_metadata)) return go(WORKSHOP + '/learn');
    if (!workshopLinkId()) return go(WORKSHOP + '?enrollment=soon');
    try {
        const link = await getStripe().paymentLinks.retrieve(workshopLinkId());
        if (!link.active) return go(WORKSHOP + '?enrollment=closed');
        const url = new URL(link.url);
        url.searchParams.set('client_reference_id', enrollmentRef(user.id));
        if (user.email) url.searchParams.set('locked_prefilled_email', user.email);
        return NextResponse.redirect(url, { status: 303, headers: { 'Cache-Control':'no-store', 'Referrer-Policy':'no-referrer' } });
    } catch { return go(WORKSHOP + '?enrollment=unavailable'); }
}
