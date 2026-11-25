import type { Course } from './catalog';

export const products = [
    { href: '/classes', title: 'Student classes' },
    { href: '/learn', title: 'Courses & assessments' },
    { href: '/resume-builder', title: 'Resume Builder' },
];

type Trail = [label: string, href?: string];

export function courseCrumbs(trail: Trail[]) {
    return '<nav class="fcs-crumbs" aria-label="Breadcrumb"><ol>' + trail.map(([label, href]) =>
        href ? '<li><a href="' + href + '">' + label + '</a></li>' :
            '<li aria-current="page">' + label + '</li>').join('') + '</ol></nav>';
}

type Screen = Course | 'signin' | 'restaurant-player';

const names: Record<Screen,string> = {
    ai:'AI', 'ai/basics':'AI basics', 'ai/prompts':'Prompt library', 'ai/prompting':'Prompting',
    'ai/brainstorming':'Brainstorming', 'ai/multiple-ais':'Multiple AI tools', 'ai/building':'Building with AI',
    leadership:'Leadership', 'leadership/cpa':'Accounting courses', 'leadership/restaurant':'Restaurant Leadership',
    'leadership/team-training':'Lead the Shift', 'leadership/cpa/fieldbook':'Fieldbook',
    'leadership/cpa/leading-the-close':'Leading the Financial Close',
    'leadership/cpa/coaching-accounting-teams':'Coaching Accounting Teams',
    'leadership/cpa/changing-finance-operations':'Changing Finance Operations',
    signin:'Learner sign-in', 'restaurant-player':'Manager courses',
};

export function courseNavigation(screen: Screen, signed = false) {
    const ai = screen === 'ai' || screen.startsWith('ai/');
    const topic = ai ? 'ai' : 'leadership';
    const trail: Trail[] = [['Courses', '/learn']];
    if (screen !== topic) trail.push([names[topic], '/learn/' + topic]);
    if (screen.startsWith('leadership/cpa/')) trail.push(['Accounting', '/learn/leadership/cpa']);
    trail.push([names[screen]]);
    const links: Trail[] = [];
    if (ai && screen !== 'ai/prompts') links.push(['Prompt library','/learn/ai/prompts']);
    if (screen === 'leadership/cpa' && signed) links.push(['My certificates','/learn/leadership/cpa/fieldbook#certificates']);
    if (screen.startsWith('leadership/cpa/') && signed) links.push(['Field notes','#journal'],['Resources','#resources']);
    if (screen === 'leadership/team-training') links.push(['Free sample','/learn/leadership/restaurant#case'],['Enrollment','#enroll']);
    if (screen === 'restaurant-player') links.push(['Shift board','/learn/leadership/restaurant'],['My practice record','#record']);
    const account = !ai && screen !== 'signin'
        ? signed ? '<form method="post" action="/learn/signout"><button class="fcs-account">Sign out of Leadership</button></form>'
            : '<a class="fcs-account" href="/learn/signin?next=/learn/' + screen + '">Learner sign-in</a>'
        : '<a class="fcs-account" href="/dashboard">My dashboard</a>';
    const actions = links.map(([title,href]) => '<a href="' + href + '">' + title + '</a>').join('');
    return '<header class="fcs-top"><div class="fcs-top-inner"><a class="fcs-logo" href="/"><img src="/logo.svg" width="120" height="52" alt="First Career Steps home"></a>' +
        '<nav class="fcs-products" aria-label="Products">' + products.map(({title,href}) => '<a href="' + href + '">' + title.replace('&','&amp;') + '</a>').join('') +
        '</nav><div class="fcs-account-area">' + account + '</div></div></header><div class="fcs-context"><div class="fcs-context-inner">' +
        courseCrumbs(trail) + (actions ? '<nav class="fcs-course-actions" aria-label="Course tools">' + actions + '</nav>' : '') + '</div></div>';
}

export function themeRestaurantPlayer(document: string) {
    return document
        .replace('</head>', '<link rel="stylesheet" href="/learning-assets/course-nav.css"><link rel="stylesheet" href="/learning-assets/slides.css"><script type="module" src="/learning-assets/slides.js"></script><script type="module" src="/learning-assets/restaurant-decks.js"></script></head>')
        .replace('<body>', '<body class="learning-screen" data-player="restaurant">')
        .replace(/<header>[\s\S]*?<\/header>/, () => courseNavigation('restaurant-player',true));
}
