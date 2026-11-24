import aiDecks from './ai-decks.json';
import { courseNavigation } from './chrome';
import type { Course } from './catalog';

export const slideAssets = '<link rel="stylesheet" href="/learning-assets/slides.css"><script type="module" src="/learning-assets/slides.js"></script>';
const escape = (value:string) => value.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));

export function aiPresentation(course: Course): string | undefined {
    const slug = course.split('/')[1];
    if (!course.startsWith('ai/') || !Object.hasOwn(aiDecks,slug)) return;
    const lesson = aiDecks[slug as keyof typeof aiDecks];
    const slides = lesson.slides.map(slide => `<section data-slide><h2>${escape(slide.title)}</h2>
        <p>${escape(slide.body)}</p><div class="slide-example"><strong>Worked example</strong>${escape(slide.example)}</div></section>`).join('');
    const questions = lesson.questions.map((item,index) => `<fieldset><legend>${index+1}. ${escape(item.question)}</legend>
        ${item.options.map((option,i) => `<label><input required type="radio" name="q${index}" value="${i}" data-right="${i===item.correct?'yes':'no'}" data-feedback="${escape(item.feedback[i])}"><span>${escape(option)}</span></label>`).join('')}
        <p data-answer-feedback></p></fieldset>`).join('');
    const workbook = '/learn/'+course+'?view=workbook';
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
        <title>${escape(lesson.title)} · First Career Steps</title><link rel="stylesheet" href="/learning-assets/ai.css"><link rel="stylesheet" href="/learning-assets/course-nav.css">${slideAssets}</head>
        <body class="learning-screen"><a class="skip" href="#presentation">Skip to lesson</a>${courseNavigation(course)}
        <main class="slide-wrapper" id="presentation"><p class="slide-course-meta">AI · ${lesson.slides.length} slides · ${lesson.questions.length} questions</p>
        <h1>${escape(lesson.title)}</h1><p>${escape(lesson.outcome)}</p>
        <fcs-slide-deck data-resume="ai-${slug}" aria-label="${escape(lesson.title)}">${slides}
        <section data-check><h2>Check what you learned</h2><form class="slide-quiz" data-quiz="${slug}">${questions}
        <button type="submit">Check my answers</button><p tabindex="-1" role="status" data-score></p>
        <p data-finished hidden><a href="/learn/ai">Return to AI courses</a></p></form></section></fcs-slide-deck>
        <noscript>Read the slides in order. Enable JavaScript for slide controls and scored feedback.</noscript>
        <p class="slide-extra"><a href="${workbook}">Open the optional practice workbook</a> to apply the lesson or return to earlier notes.</p>
        </main></body></html>`;
}
