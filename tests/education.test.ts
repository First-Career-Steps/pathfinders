import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { courseNavigation, themeRestaurantPlayer } from '../src/lib/education/chrome';
import { courseFiles, fileFor, learnerCourse } from '../src/lib/education/catalog';
import { changeSession, educationCookies, learnerApi } from '../src/lib/education/session';

test('public course documents and their scripts, styles and route links resolve', () => {
    const routes = new Set([...Object.keys(courseFiles).map(course=>'/learn/'+course), '/learn', '/', '/resume-builder','/learn/signin','/dashboard']);
    for (const course of Object.keys(courseFiles) as (keyof typeof courseFiles)[]) {
        for (const signed of [true,false]) {
            const template = readFileSync('education/'+fileFor(course,signed)+'.html','utf8');
            assert.match(template,/class="learning-screen"/);
            assert.match(template,/<!-- course-navigation -->/);
            const html = template.replace('<!-- course-navigation -->', () => courseNavigation(course, signed));
            assert.match(html,/aria-label="Breadcrumb"/);
            for (const [,path] of html.matchAll(/(?:src|href)="(\/[^"#?]*)/g)) {
                assert.ok(routes.has(path) || existsSync('public'+path), course+' links to '+path);
            }
            if (course.includes('/cpa') && !signed && !course.endsWith('fieldbook')) assert.match(html,/No CPE Offered/);
        }
    }
});
test('only the leadership session is sent to the established course service', () => {
    const req = new Request('https://www.firstcareersteps.com/learn', {headers:{cookie:'resume-app=personal; __Host-lbb-refresh=my-token; __Host-lbb-access=abc.def; campaign=123'}});
    assert.equal(educationCookies(req),'__Host-lbb-refresh=my-token; __Host-lbb-access=abc.def');
    assert.equal(learnerCourse('https://example.com'), 'leadership');
    assert.equal(learnerCourse('/learn/leadership/cpa/leading-the-close'), 'leadership/cpa/leading-the-close');
});
test('private course resources require a learner session and only accept same-origin writes', async () => {
    const url='https://www.firstcareersteps.com/api/education/restaurant/state';
    assert.equal((await learnerApi(new Request(url),'restaurant/state')).status,401);
    assert.equal((await learnerApi(new Request(url),'stripe/webhook')).status,404);
    assert.equal((await learnerApi(new Request(url),'cpa/unknown/lessons')).status,404);
    const post=new Request(url,{method:'POST',headers:{origin:'https://example.org',cookie:'__Host-lbb-access=test'}});
    assert.equal((await learnerApi(post,'exam')).status,403);
    assert.equal((await changeSession(post,'signin')).status,403);
});
test('enrolled API calls keep the learner identity, refresh both course cookies, and preserve access decisions',async t=>{
    const url='https://www.firstcareersteps.com/api/education/restaurant/decide';
    const headers=new Headers({'content-type':'application/json'});
    headers.append('Set-Cookie','__Host-lbb-access=renewed; Path=/; Secure; HttpOnly');
    headers.append('Set-Cookie','__Host-lbb-refresh=r2; Path=/; Secure; HttpOnly');
    t.mock.method(globalThis,'fetch', async (target:string,init:RequestInit)=>{
        assert.equal(target,'https://www.littleblackbookleadership.com/api/restaurant/decide');
        const sent=new Headers(init.headers);
        assert.equal(sent.get('origin'),'https://www.littleblackbookleadership.com');
        assert.equal(sent.get('cookie'),'__Host-lbb-access=abc');
        assert.equal(sent.get('authorization'),null);
        return new Response('{"error":"Enrollment required"}',{status:403,headers});
    });
    const response=await learnerApi(new Request(url,{method:'POST',headers:{origin:new URL(url).origin,'content-type':'application/json',cookie:'__Host-lbb-access=abc; sb-resume=private',authorization:'Bearer other'}, body:'{}'}),'restaurant/decide');
    assert.equal(response.status,403);
    assert.equal(response.headers.getSetCookie().length,2);
    assert.equal(response.headers.get('cache-control'),'private, no-store');
});

test('the entitled restaurant document keeps its controls and receives the shared course navigation', () => {
    const source = '<html><head><style>body{margin:0}</style></head><body><header><div>Old title</div></header><main id="main"></main><script>const index = 0;</script></body></html>';
    const page = themeRestaurantPlayer(source);
    assert.match(page, /course-nav\.css/);
    assert.match(page, /class="learning-screen" data-player="restaurant"/);
    assert.match(page, /href="#record"/);
    assert.match(page, /action="\/learn\/signout"/);
    assert.ok(page.includes('<main id="main"></main><script>const index = 0;</script>'));
    assert.doesNotMatch(page, /Old title/);
});

test('each AI class teaches first, then presents a complete scoreable quiz', async () => {
    const { aiPresentation } = await import('../src/lib/education/presentation');
    const lessons = (await import('../src/lib/education/ai-decks.json')).default;
    for (const [slug,lesson] of Object.entries(lessons)) {
        const route = ('ai/'+slug) as keyof typeof courseFiles;
        const html = aiPresentation(route)!;
        const [teaching,assessment] = html.split('<section data-check>');
        assert.equal(teaching.match(/<section data-slide>/g)?.length,lesson.slides.length);
        assert.doesNotMatch(teaching, /<fieldset|type="radio"/);
        assert.equal(assessment.match(/<fieldset>/g)?.length,lesson.questions.length);
        assert.equal(assessment.match(/data-right="yes"/g)?.length,lesson.questions.length);
        assert.ok(assessment.includes('/learn/'+route+'?view=workbook'));
        for (const question of lesson.questions) {
            assert.ok(question.correct >= 0 && question.correct < question.options.length);
            assert.equal(question.feedback.length,question.options.length);
        }
    }
});

test('each leadership sample puts its scenario interaction in the final panel', () => {
    for (const file of ['restaurant','cpa-leading-the-close','cpa-coaching-accounting-teams','cpa-changing-finance-operations']) {
        const html = readFileSync('education/'+file+'.html','utf8');
        const [teaching,assessment] = html.split('<section data-check>');
        assert.equal(teaching.match(/<section data-slide>/g)?.length,2);
        assert.doesNotMatch(teaching, /<fieldset|type="radio"/);
        const [questions,after] = assessment.split('</fcs-slide-deck>');
        assert.ok(questions.includes('<fieldset'));
        assert.doesNotMatch(after, /<fieldset|<textarea/);
    }
});
