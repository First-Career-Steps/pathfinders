import { leadershipCover, slideMedia } from '@/lib/education/classroom';
import { courseNavigation } from '@/lib/education/chrome';
import { slideAssets } from '@/lib/education/presentation';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileFor, isCourse, learnerCourse } from '@/lib/education/catalog';
import { changeSession, educationCookies, signInPage } from '@/lib/education/session';

type Context = {params: Promise<{course:string[]}>};

export async function GET(request: Request, {params}: Context) {
    const course = (await params).course.join('/');
    const url = new URL(request.url);
    if (course === 'signin') return signInPage(learnerCourse(url.searchParams.get('next') || url.searchParams.get('return_to')));
    if (!isCourse(course) || !course.startsWith('leadership')) return new Response('Course not found.', {status:404});
    const signed = Boolean(educationCookies(request));
    if (course === 'leadership/cpa/fieldbook' && !signed) {
        return Response.redirect(new URL('/learn/signin?next=/learn/leadership/cpa/fieldbook',url), 307);
    }
    const sample = url.searchParams.get('view') === 'sample';
    const source = await readFile(join(process.cwd(), 'education', fileFor(course, signed && !sample) + '.html'), 'utf8');
    let html = source.replace('<!-- course-navigation -->', () => courseNavigation(course, signed))
        .replace(/<!-- slide-media-(\d+) -->/g, (_, slide) => slideMedia(course, Number(slide)))
        .replace('<!-- lesson-cover -->', () => leadershipCover(course))
        .replace('</head>', slideAssets + '</head>');
    if (signed && sample && course.startsWith('leadership/cpa/')) {
        html = html.replace('href="#journal"', 'href="/learn/' + course + '#journal"')
            .replace('href="#resources"', 'href="/learn/' + course + '#resources"');
    }
    return new Response(html, {headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'private, no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin'}});
}

export async function POST(request: Request, {params}: Context) {
    const path = (await params).course.join('/');
    return path === 'signin' || path === 'signout' ? changeSession(request, path) : new Response(null, {status:405, headers:{Allow:'GET, HEAD'}});
}
