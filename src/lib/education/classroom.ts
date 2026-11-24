import lessonMedia from './lesson-media.json';
import type { Course } from './catalog';

export const escapeText = (value: string) => value.replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]!));

type Example = { label: string; title: string; rows: [string, string][] };
type LessonCover = { title: string; goal: string; track: string; steps: string; example?: Example; photo?: boolean };

const aiExamples: Record<string, Example> = {
    prompting: {label: 'Prompt anatomy', title: 'A delivery handoff', rows: [['Role','Shift supervisor'],['Task','Brief the opening team'],['Context','Sam receives produce Friday at 9'],['Format','Two bullets for the shift log']]},
    brainstorming: {label: 'Idea shortlist', title: 'What could fix a missed handoff?', rows: [['Read back','Have the next lead repeat the change.'],['Write it down','Keep one shared change log.'],['Set a reminder','Send a cue when the delivery is due.']]},
    'multiple-ais': {label: 'Project brief', title: 'What travels to the next AI?', rows: [['Goal','Track changes between shifts.'],['Agreed','One store for one week.'],['Open question','Who handles a late delivery?']]},
    building: {label: 'Test cases', title: 'Would this feature pass?', rows: [['Usual case','Eight trays against a threshold of five.'],['Boundary','Stock equals the reorder threshold.'],['Missing input','The stock count is blank.']]},
    basics: {label: 'Opening checklist', title: 'What can the assistant use?', rows: [['Source','The approved shift notes'],['Reader','The incoming supervisor'],['Review','Confirm the owner and delivery time']]}
};
const sampleCovers: Partial<Record<Course, LessonCover>> = {
    'leadership/restaurant': {title:'The remake that lost its place',track:'Restaurant Leadership',goal:'Two cooks start the same remake while four guests wait. Decide who takes the ticket rail and what the cashier can tell the next guest.',steps:'2 slides · 1 branching case',photo:true},
    'leadership/cpa/leading-the-close': {title:'The missing support',track:'Leading the Financial Close',goal:'Decide which part of a vendor batch can go to review before the next reporting deadline.',steps:'2 slides · 1 case question',example:{label:'Case file',title:'Tuesday afternoon close',rows:[['Batch','$184,000'],['Missing confirmations','$61,000'],['Flash report due','3:30 p.m.']]}},
    'leadership/cpa/coaching-accounting-teams': {title:'When a review note comes back',track:'Coaching Accounting Teams',goal:'Use a real piece of work to distinguish an unclear assignment from a skill that needs coaching.',steps:'2 slides · 1 case question',example:{label:'Coaching notes',title:'Before the conversation',rows:[['Observe','Find the recurring review note.'],['Ask','Have the preparer explain one example.'],['Agree','Choose one change to try.']]}},
    'leadership/cpa/changing-finance-operations': {title:'Where does the rework begin?',track:'Changing Finance Operations',goal:'Compare rejection rates and case mix to decide what to investigate across three branches.',steps:'2 slides · 1 case question',example:{label:'Case file',title:'Branch comparisons',rows:[['Volume','How many items were eligible?'],['Rejects','How many came back?'],['Case mix','Were the branches handling similar work?']]}}
};

function cover({title, goal, track, steps, example, photo}: LessonCover, leadership: boolean) {
    const figure = photo
        ? '<img class="lesson-photo" width="780" height="490" src="/learning-assets/lead-the-shift.webp" alt="A shift lead coaching a teammate at the pizza pass">'
        : example ? '<figure class="lesson-exhibit"><figcaption>'+escapeText(example.label)+'</figcaption><h2>'+escapeText(example.title)+'</h2><dl>'+example.rows.map(([k,v])=>'<div><dt>'+escapeText(k)+'</dt><dd>'+escapeText(v)+'</dd></div>').join('')+'</dl></figure>' : '';
    return '<div class="classroom" data-subject="'+(leadership?'leadership':'ai')+'"><section class="lesson-cover"><div class="cover-copy"><p class="lesson-series">'+escapeText(track)+(leadership?' · Sample lesson':'')+'</p><h1>'+escapeText(title)+'</h1><p class="cover-goal">'+escapeText(goal)+'</p><p class="cover-meta">'+escapeText(steps)+'</p><a class="start-lesson" href="#lesson-player">Start lesson</a></div>'+figure+'</section><div class="lesson-heading" hidden><p>'+escapeText(track)+'</p><h1>'+escapeText(title)+'</h1></div><div id="lesson-player">';
}

export function aiCover(slug: string, title: string, goal: string, slides: number, questions: number) {
    return cover({title,goal,track:'Working with AI',steps:slides+' slides · '+questions+' end-of-lesson questions',example:aiExamples[slug]},false);
}

export function leadershipCover(course: Course) {
    const lesson = sampleCovers[course];
    return lesson ? cover(lesson,true) : '';
}

// Each public AI or leadership lesson can attach a recording or a slide file to a numbered slide.
type LessonMedia = {slide:number; title:string; video?:string; poster?:string; captions?:string; transcript?:string; slides?:string};
const mediaByCourse: Partial<Record<Course,LessonMedia[]>> = lessonMedia;

export function slideMedia(course: Course, slide: number) {
    return (mediaByCourse[course] || []).filter(item=>item.slide === slide).map(item=>{
        const video = item.video ? `<video controls playsinline preload="none" aria-label="${escapeText(item.title)}"${item.poster ? ' poster="'+escapeText(item.poster)+'"' : ''}>
            <source src="${escapeText(item.video)}">${item.captions ? '<track kind="captions" srclang="en" label="English" src="'+escapeText(item.captions)+'" default>' : ''}</video>` : '';
        const transcript = item.transcript ? '<details><summary>Read the transcript</summary><p>'+escapeText(item.transcript)+'</p></details>' : '';
        const file = item.slides ? '<p><a href="'+escapeText(item.slides)+'">Open the companion slides</a></p>' : '';
        return '<details class="lesson-demo"><summary>'+escapeText(item.title)+'</summary>'+video+transcript+file+'</details>';
    }).join('');
}
