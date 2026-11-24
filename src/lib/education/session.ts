import { courseNavigation, themeRestaurantPlayer } from './chrome';
import { learnerCourse, type Course } from './catalog';

const academy = 'https://www.littleblackbookleadership.com';
const cookieNames = ['__Host-lbb-access', '__Host-lbb-refresh'];
const privateHeaders = {
    'Cache-Control': 'private, no-store',
    Vary: 'Cookie',
    'Referrer-Policy': 'same-origin',
    'X-Content-Type-Options': 'nosniff',
};

export function educationCookies(request: Request) {
    return (request.headers.get('cookie') || '').split(';')
        .map(item => item.trim())
        .filter(item => cookieNames.includes(item.split('=', 1)[0]) && /^[\w-]+=[\w.~-]+$/.test(item))
        .join('; ');
}

function responseHeaders(upstream?: Response) {
    const headers = new Headers(privateHeaders);
    if (upstream) {
        for (const value of upstream.headers.getSetCookie()) {
            if (cookieNames.includes(value.split('=', 1)[0]) && !/;\s*domain=/i.test(value)) headers.append('Set-Cookie', value);
        }
    }
    return headers;
}

function sameOrigin(request: Request) {
    const origin = request.headers.get('origin');
    return origin === new URL(request.url).origin;
}

export function signInPage(course: Course, message = '', status = 200) {
    const headers = responseHeaders();
    headers.set('Content-Type', 'text/html; charset=utf-8');
    headers.set('X-Robots-Tag', 'noindex');
    headers.set('Content-Security-Policy', "default-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'");
    return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Leadership learner sign-in · First Career Steps</title><link rel="stylesheet" href="/learning-assets/style.css"><link rel="stylesheet" href="/learning-assets/course-nav.css"></head><body class="learning-screen" data-player="fieldbook">${courseNavigation('signin')}<main class="focus"><section class="box"><h1>Leadership learner sign-in</h1><p>Use your Little Black Book Leadership course email and password. First Career Steps uses that course account to open your saved work, assessments and certificates.</p>${message ? '<p role="alert">' + message + '</p>' : ''}<form method="post" action="/learn/signin"><input type="hidden" name="next" value="/learn/${course}"><label class="label">Course email<input name="email" type="email" autocomplete="username" class="write" maxlength="254" required></label><label class="label">Course password<input name="password" type="password" autocomplete="current-password" class="write" maxlength="256" required></label><p><button class="primary">Sign in to Leadership</button></p></form><p>For course access or a password reset, contact your course organizer.</p><a href="/learn/leadership#practice">Try a public practice case</a></section></main></body></html>`, { status, headers });
}

async function readBody(request: Request, limit: number) {
    const reader = request.body?.getReader();
    let size = 0;
    const chunks: Uint8Array[] = [];
    if (reader) {
        while (true) {
            const {done, value} = await reader.read();
            if (done) break;
            size += value.length;
            if (size > limit) { await reader.cancel(); return null; }
            chunks.push(value);
        }
    }
    return Buffer.concat(chunks).toString('utf8');
}

function redirect(path: string, upstream?: Response) {
    const headers = responseHeaders(upstream);
    headers.set('Location', path);
    return new Response(null, {status: 303, headers});
}

export async function changeSession(request: Request, action: 'signin' | 'signout') {
    if (!sameOrigin(request)) return new Response('Use the course sign-in page.', {status: 403, headers: privateHeaders});
    const headers = new Headers({Origin: academy, 'Content-Type':'application/x-www-form-urlencoded'});
    let course: Course = 'leadership';
    let body = '';
    if (action === 'signin') {
        if (!request.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded')) return new Response(null, {status:415});
        const input = await readBody(request, 4096);
        if (input === null) return new Response(null, {status:413});
        const form = new URLSearchParams(input);
        course = learnerCourse(form.get('next'));
        body = new URLSearchParams({email:form.get('email') || '', password:form.get('password') || '', next:'/leadership'}).toString();
    } else {
        headers.set('cookie', educationCookies(request));
    }
    try {
        const upstream = await fetch(academy + '/' + action, {method:'POST', headers, body, redirect:'manual', cache:'no-store', signal:AbortSignal.timeout(20000)});
        if (upstream.status === 303 && upstream.headers.getSetCookie().some(value => value.startsWith(cookieNames[0]+'='))) {
            return redirect('/learn/' + course, upstream);
        }
        if (action === 'signout') return new Response('Sign-out could not finish. Please try again.', {status:503, headers:privateHeaders});
        if (upstream.status === 429) return signInPage(course, 'Too many sign-in attempts. Please wait and try again.', 429);
        if ([400,401,403].includes(upstream.status)) return signInPage(course, 'Check your course email, password and invitation, then try again.', upstream.status);
    } catch { /* Keep authentication details out of error responses. */ }
    return signInPage(course, 'Course sign-in is temporarily unavailable. Please try again.', 503);
}

const courseActions = /^(?:cpa\/(?:leading-the-close|coaching-accounting-teams|changing-finance-operations)\/)?(?:state|outline|lessons|questions|records|certificates|reference|lesson|exam|evaluation|timing(?:\/save)?|book|handbook\.pdf|checkout(?:\/confirm)?)$/;
const shiftActions = /^restaurant\/(?:state|join|checkout|play|decide|resolve|finish|certificate|book|courses|handbook\.pdf)$/;

export async function learnerApi(request: Request, action: string) {
    const fail = (error:string, status:number) => Response.json({error}, {status, headers:privateHeaders});
    if (!(courseActions.test(action) || shiftActions.test(action) || action === 'credential')) return fail('Unknown course resource.', 404);
    if (request.method === 'POST' && !sameOrigin(request)) return fail('Submit work from First Career Steps.', 403);
    const session = educationCookies(request);
    if (!session) return fail('Sign in to Leadership to continue.', 401);
    const headers = new Headers({cookie:session});
    let body: string | undefined;
    if (request.method === 'POST') {
        if (!request.headers.get('content-type')?.startsWith('application/json')) return fail('Expected a JSON request.', 415);
        const input = await readBody(request, 32768);
        if (input === null) return fail('Request too large.', 413);
        body = input;
        headers.set('Content-Type','application/json');
        headers.set('Origin', academy);
    }
    try {
        const upstream = await fetch(academy + '/api/' + action + new URL(request.url).search, {method:request.method, headers, body, redirect:'manual', cache:'no-store', signal:AbortSignal.timeout(20000)});
        if (upstream.status >= 300 && upstream.status < 400) return fail('The learning service could not open this resource.', 502);
        const output = responseHeaders(upstream);
        for (const key of ['content-type','content-disposition']) {
            const value = upstream.headers.get(key);
            if (value) output.set(key, value);
        }
        output.set('X-Robots-Tag','noindex, noarchive');
        if (request.method === 'HEAD') return new Response(null, {status:upstream.status, headers:output});
        // Only the paid course player is a document. Its service checks entitlement before returning HTML.
        if (action === 'restaurant/courses' && upstream.ok && upstream.headers.get('content-type')?.startsWith('text/html')) {
            const html = themeRestaurantPlayer(await upstream.text());
            return new Response(html, {headers:output});
        }
        if (action.endsWith('checkout') && upstream.ok) {
            const result = await upstream.json();
            if (result.url === '/restaurant') result.url = '/learn/leadership/restaurant';
            if (result.url === '/') result.url = '/learn/leadership';
            return Response.json(result, {headers:output});
        }
        return new Response(upstream.body, {status:upstream.status, headers:output});
    } catch {
        return fail('The Leadership learning service is temporarily unavailable. Please try again.', 503);
    }
}
