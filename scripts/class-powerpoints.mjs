// Build the downloadable teaching decks from the same slides and checks students see online.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import pptxgen from 'pptxgenjs';
import { parse } from 'node-html-parser';

const destination = 'public/learning-assets/decks';
await mkdir(destination, {recursive:true});
const ai = JSON.parse(await readFile('src/lib/education/ai-decks.json','utf8'));
const samples = ['restaurant','cpa-leading-the-close','cpa-coaching-accounting-teams','cpa-changing-finance-operations'];
const clean = node => node?.text.replace(/\s+/g,' ').trim() || '';

function createDeck(subject, title, description) {
    const p = new pptxgen();
    p.layout = 'LAYOUT_WIDE';
    p.author = 'First Career Steps';
    p.title = title;
    p.subject = subject;
    const dark = subject === 'Working with AI' ? '132F49' : '163C34';
    let count = 0;
    function slide(label, heading, body = '', example = '', exampleLabel = 'Worked example') {
        const s = p.addSlide();
        const cover = ++count === 1;
        const ink = cover ? 'FFFFFF' : '17354A';
        s.background = {color:cover ? dark : 'F8FAFC'};
        const write = (text, x,y,w,h,size,options={}) => s.addText(text,{x,y,w,h,fontFace:'Aptos',fontSize:size,color:ink,margin:0,breakLine:false,valign:'mid',fit:'shrink',...options});
        write(label, .75,.44,11.6,.35,16,{color:cover?'ADDBDF':'436575',bold:true});
        write(heading,.74,cover?1.5:1.04,11.6,cover?2.15:1.25,cover?44:35,{fontFace:'Georgia',valign:'mid'});
        if (body) write(body,.78,cover?4.15:2.5,11.6,cover?1.5:example?1.55:3.75,cover?25:23,{valign:'top'});
        if (example) {
            s.addShape(p.ShapeType.rect,{x:.76,y:4.32,w:11.8,h:2.22,rectRadius:.1,line:{color:'DBEAF0'},fill:{color:'E7F1F4'}});
            write(exampleLabel,1,4.48,11.23,.32,16,{bold:true,color:'2C586C'});
            write(example,1,4.96,11.12,1.39,20,{valign:'top'});
        }
        write('First Career Steps',.76,6.92,6,.28,13,{color:cover?'AFCCD5':'536F7E'});
        write(String(count),11.7,6.92,.85,.28,13,{align:'right',color:cover?'AFCCD5':'536F7E'});
        return s;
    }
    slide(subject,title,description);
    return {slide, async save(name) {
        await writeFile(destination+'/'+name+'.pptx',await p.write({outputType:'nodebuffer',compression:true}));
    }};
}

for (const [slug,lesson] of Object.entries(ai)) {
    const deck = createDeck('Working with AI',lesson.title,lesson.outcome);
    for (const item of lesson.slides) deck.slide('Lesson',item.title,item.body,item.example);
    lesson.questions.forEach((q,i) => {
        const options = q.options.map((text,j)=>String.fromCharCode(65+j)+'.  '+text).join('\n\n');
        const slide = deck.slide('Question '+(i+1)+' of '+lesson.questions.length,q.question,options);
        slide.addNotes(q.options[q.correct]+'\n'+q.feedback[q.correct]);
    });
    await deck.save('ai-'+slug);
}
for (const slug of samples) {
    const html = parse(await readFile('education/'+slug+'.html','utf8'));
    const source = html.querySelector('fcs-slide-deck');
    const deck = createDeck('Leadership · Public sample',source.getAttribute('aria-label'),'Read the lesson, then use the case evidence to make a decision. No CPE offered.');
    for (const section of source.querySelectorAll('[data-slide]')) {
        const example = section.querySelector('.slide-example');
        deck.slide('Lesson',clean(section.querySelector('h2')),clean(section.querySelector('h2 + p')),example ? clean(example).replace(/^Worked example/,'').trim() : '');
    }
    for (const field of source.querySelectorAll('fieldset.preview-choices')) {
        const choices = field.childNodes.filter(node=>node.tagName==='DETAILS');
        const options = choices.map((d,i)=>String.fromCharCode(65+i)+'.  '+clean(d.querySelector('summary'))).join('\n\n');
        const slide = deck.slide('Case question',clean(field.querySelector('legend')),options);
        slide.addNotes(choices.map(d=>clean(d.querySelector('summary'))+'\n'+clean(d.querySelector('.preview-feedback > p'))).join('\n\n'));
    }
    await deck.save(slug);
}
