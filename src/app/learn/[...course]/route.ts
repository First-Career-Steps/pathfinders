import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileFor, isCourse, learnerCourse } from '@/lib/education/catalog';
import { changeSession, educationCookies, signInPage } from '@/lib/education/session';

type Context = {params: Promise<{course:string[]}>};

export async function GET(request: Request, {params}: Context) {
    const course = (await params).course.join('/');
    const url = new URL(request.url);
    if (course === 'signin') return signInPage(learnerCourse(url.searchParams.get('next') || url.searchParams.get('return_to')));
    if (!isCourse(course)) return new Response('Course not found.', {status:404});
    const signed = Boolean(educationCookies(request));
    if (course === 'leadership/cpa/fieldbook' && !signed) {
        return Response.redirect(new URL('/learn/signin?next=/learn/leadership/cpa/fieldbook',url), 307);
    }
    const file = fileFor(course, signed);
    const source = await readFile(join(process.cwd(), 'education', file + '.html'), 'utf8');
    const account = signed ? '<form method="post" action="/learn/signout"><button class="academy-signout">Sign out of Leadership</button></form>' :
        '<a href="/learn/signin?next=/learn/' + course + '">Learner sign-in</a>';
    const html = source.replace('<!-- learner-session -->',account);
    return new Response(html, {headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'private, no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin'}});
}

export async function POST(request: Request, {params}: Context) {
    const path = (await params).course.join('/');
    return path === 'signin' || path === 'signout' ? changeSession(request, path) : new Response(null, {status:405, headers:{Allow:'GET, HEAD'}});
}
