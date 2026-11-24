import aiDecks from './ai-decks.json';
import { courseNavigation } from './chrome';
import { aiCover, slideMedia, escapeText as escape } from './classroom';
import type { Course } from './catalog';

export const slideAssets = '<link rel="stylesheet" href="/learning-assets/slides.css"><script type="module" src="/learning-assets/slides.js"></script>';

const sequence = ['prompting','brainstorming','multiple-ais','building'] as const;

export function aiPresentation(course: Course): string | undefined {
    const slug = course.split('/')[1];
    if (!course.startsWith('ai/') || !Object.hasOwn(aiDecks,slug)) return;
    const lesson = aiDecks[slug as keyof typeof aiDecks];
    const slides = lesson.slides.map((slide, index) => {
        return `<section data-slide><h2>${escape(slide.title)}</h2><p>${escape(slide.body)}</p>
            <div class="slide-example"><strong>Worked example</strong>${escape(slide.example)}</div>${slideMedia(course,index+1)}</section>`;
    }).join('');
    const questions = lesson.questions.map((item,index) => `<fieldset><legend>${escape(item.question)}</legend>
        ${item.options.map((option,i) => `<label><input required type="radio" name="q${index}" value="${i}" data-right="${i===item.correct?'yes':'no'}" data-feedback="${escape(item.feedback[i])}"><span>${escape(option)}</span></label>`).join('')}
        <p data-answer-feedback></p></fieldset>`).join('');
    const next = slug === 'basics' ? sequence[0] : sequence[sequence.indexOf(slug as typeof sequence[number])+1];
    const nextLink = next ? `<a class="next-course" href="/learn/ai/${next}">Next class · ${escape(aiDecks[next].title)}</a>` : '';
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
        <title>${escape(lesson.title)} · First Career Steps</title><link rel="stylesheet" href="/learning-assets/ai.css"><link rel="stylesheet" href="/learning-assets/course-nav.css">${slideAssets}</head>
        <body class="learning-screen"><a class="skip" href="#presentation">Skip to lesson</a>${courseNavigation(course)}
        <main class="classroom-main" id="presentation">${aiCover(slug,lesson.title,lesson.outcome,lesson.slides.length,lesson.questions.length)}
        <fcs-slide-deck data-resume="ai-${slug}" aria-label="${escape(lesson.title)}">${slides}
        <section data-check><h2>Check what you learned</h2><form class="slide-quiz" data-quiz="${slug}">${questions}
        <button type="submit">Check my answers</button><p tabindex="-1" role="status" data-score></p>
        <p data-finished hidden>${nextLink}<a href="/learn/ai">All AI classes</a></p></form></section></fcs-slide-deck></div></div>
        <noscript>Read the slides in order. Enable JavaScript for slide controls and scored feedback.</noscript>
        <details class="lesson-resources"><summary>Class materials</summary><p><a href="/learn/${course}?view=workbook">Open the optional practice workbook</a> to apply the lesson or revisit saved notes.</p>
        <p><a download href="/learning-assets/decks/ai-${slug}.pptx">Download the PowerPoint slides</a></p></details>
        </main></body></html>`;
}
