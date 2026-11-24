import { courseNavigation } from '@/lib/education/chrome';
import { aiPresentation, slideAssets } from '@/lib/education/presentation';
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
    let html = url.searchParams.get('view') === 'workbook' ? undefined : aiPresentation(course);
    if (!html) {
        const source = await readFile(join(process.cwd(), 'education', fileFor(course, signed && url.searchParams.get('view') !== 'sample') + '.html'), 'utf8');
        html = source.replace('<!-- course-navigation -->', () => courseNavigation(course, signed))
            .replace('</head>', slideAssets + '</head>');
        if (signed && url.searchParams.get('view') === 'sample' && course.startsWith('leadership/cpa/')) {
            html = html.replace('href="#journal"', 'href="/learn/' + course + '#journal"')
                .replace('href="#resources"', 'href="/learn/' + course + '#resources"');
        }
        if (course.startsWith('ai/') && url.searchParams.get('view') === 'workbook') {
            html = html.replace('</header>', '</header><p class="slide-wrapper slide-extra"><a href="/learn/' + course + '">Return to the slide lesson</a></p>');
        }
    }
    return new Response(html, {headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'private, no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin'}});
}

export async function POST(request: Request, {params}: Context) {
    const path = (await params).course.join('/');
    return path === 'signin' || path === 'signout' ? changeSession(request, path) : new Response(null, {status:405, headers:{Allow:'GET, HEAD'}});
}
