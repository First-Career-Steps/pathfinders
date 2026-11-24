import {mountTiming} from './pilot-timing.js';
import {recognitionPractice} from './recognition.js';
import {offer, downloads, shippingStatus, booksDesk} from './books.js';
import {mountCredential,mountSample} from './credentials.js';
const main=document.querySelector('main'), notice=document.querySelector('#notice');
const slug=location.pathname.split('/').at(-1);
const seriesCourse=Boolean(slug && slug!=='fieldbook');
const base=seriesCourse ? '/api/education/cpa/'+encodeURIComponent(slug)+'/' : '/api/education/';
let meta={title:'Leading under pressure · CPA edition',examCount:15};
let parts=['You','Your people','Environment','Techniques of leadership','Culture overhaul'];
let descriptions=['Set standards and own the decisions they require.','Recognize coachability and learn what motivates a teammate.','Shape the conditions in which people do their work.','Practice specific recognition, correction, and follow-up.','Diagnose drift and choose who carries the standard forward.'];
const roman=['I','II','III','IV','V'];
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const get=id=>document.getElementById(id);
const button=(href,label,cls='cta')=>'<a class="'+cls+'" href="'+href+'">'+esc(label)+'</a>';
const emptyState={done:[],notes:{},attempts:[],passed:false,entitled:false};
let state={...emptyState},catalog=[],lessons=[],questions=[],reference=[],signed=false,routeTicket=0,toastTimer;
let lastReview=null,activeClock=null,examDraft=null;
const drafts=new Map();
function notify(msg){notice.textContent=msg;clearTimeout(toastTimer);toastTimer=setTimeout(()=>notice.textContent='',4500)}
async function api(path,body){
 const r=await fetch(base+path,body===undefined?{cache:'no-store'}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,version:state.version})});
 const data=await r.json();
 if(!r.ok)throw Object.assign(new Error(data.error||'Request failed. Please retry.'),{status:r.status});return data
}
async function refresh(){try{state=await api('state');signed=true}catch(e){if(e.status!==401)throw e;state={...emptyState};signed=false}}
function kickoff(){if(!signed)return button('/learn/signin?return_to='+encodeURIComponent(location.pathname),'Sign in to start');if(!state.entitled)return '<button class="primary" id="buy">Enroll · '+esc(new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(state.priceCents/100))+'</button>';return button(state.passed?'#record':state.done.length===catalog.length?'#exam':'#slides',state.passed?'View completion record':state.done.length?'Review course slides':'Start course slides')}
function creditSummary(release=state.release){
 if(!release?.awardsCredit)return 'No CPE Offered';
 return esc(release.credits)+' CPE credits · '+esc(release.jurisdiction);
}
function creditDescription(release=state.release){
 if(!release?.awardsCredit)return '<strong>No CPE Offered.</strong> This edition awards a certificate of completion only.';
 return 'Sponsor: '+esc(release.sponsor)+'. Registration: '+esc(release.registration)+'. '+esc(release.field)+' · '+esc(release.method)+' · '+esc(release.jurisdiction)+'. '+esc(release.credits)+' CPE credits.';
}
function timingLink(){
 return signed && seriesCourse && state.stage==='pilot' ? '<p class="no-print"><a class="textlink" href="#timing">Independent tester timing log</a></p>' : '';
}
function opsLinks(){
 return state.isOperator ? '<p class="no-print"><a href="https://www.littleblackbookleadership.com/cpa/fieldbook#resources">Open course administration on Little Black Book Leadership</a></p>' : '';
}
function payHook(){if(get('buy'))get('buy').onclick=async e=>{e.target.disabled=true;try{const result=await api('checkout',{});location.assign(result.url)}catch(err){e.target.disabled=false;notify(err.message)}}}
function block(s){main.innerHTML=s}
function clockStop(){if(activeClock&&activeClock.at!==null){activeClock.value+=performance.now()-activeClock.at;activeClock.at=null}}
function clockOpen(data){clockStop();activeClock=data;if(!document.hidden)data.at=performance.now()}
function seconds(data){return Math.round((data.value+(data.at===null?0:performance.now()-data.at))/1000)}
document.addEventListener('visibilitychange',()=>{if(!activeClock)return;if(document.hidden)clockStop();else if(activeClock.at===null)activeClock.at=performance.now()});
const linkLesson=(l,i)=>'<a class="lessonlink" href="#lesson/'+i+'"><span>'+esc(l.title)+'</span><span>'+ (state.done.includes(i)?'Completed':'Open')+'</span></a>';
function home(){block('<div class="hero"><div class="hero-copy"><div class="eyebrow">Interactive course · CPA edition</div><h1>'+esc(meta.title)+'</h1><p>'+esc(meta.summary||'Work through the decisions that shape a team, from the Friday dinner rush to the final hours of a financial close.')+'</p><p class="credit-notice"><strong>'+creditSummary()+'</strong></p>'+kickoff()+'</div><div class="hero-art"><img class="book-cover" src="/learning-assets/book-cover.jpg" width="1350" height="2025" alt="The Little Black Book on Leadership by Brenen Morse"></div></div><div class="factrow"><span>Brenen Morse, CPA</span><span>'+catalog.length+' activities</span><span>Self-paced</span></div><div class="homegrid"><section><div class="sectitle"><h2>Course fieldbook</h2><small>'+parts.length+' case groups</small></div>'+parts.map((p,n)=>'<details class="part" '+(n===(catalog.find((_,i)=>!state.done.includes(i))?.part??1)-1?'open':'')+'><summary><span class="roman">'+roman[n]+'</span><span><span class="partname">'+p+'</span><span class="sub">'+descriptions[n]+'</span></span></summary>'+catalog.map((l,i)=>l.part===n+1?linkLesson(l,i):'').join('')+'</details>').join('')+'<div class="inset">'+button('#slides','Course slides','textlink')+' · '+button('#exam','Final assessment','textlink')+'</div></section><aside><div class="card tint"><div class="eyebrow">Your progress</div><h3>'+state.done.length+' of '+catalog.length+' activities</h3><div class="track"><i style="width:'+100*state.done.length/catalog.length+'%"></i></div><p class="mini">Finish each case and save a field note to unlock the final assessment.</p><a class="textlink" href="#journal">Open your field notes</a>'+timingLink()+'</div>'+offer(state)+'<div class="card"><h3>Course credit</h3><p>'+creditDescription()+'</p><a class="textlink" href="#details">Program details</a></div></aside></div>');payHook()}
function info(){block('<section class="focus"><a class="crumb" href="#home">Course overview</a><div class="sectionhead"><div class="eyebrow">Program information</div><h1>About this edition</h1><p>'+esc(meta.title)+'</p></div>'+timingLink()+'<div class="box"><h3>Who this is for</h3><p>CPAs and finance professionals who supervise or coach others. Basic level. No prerequisite or advance preparation. The digital book is included. The companion app is optional.</p><h3>What you will learn</h3><ol>'+descriptions.map(s=>'<li>'+s+'</li>').join('')+'</ol><h3>How to complete the course</h3><p>Read the slides, then answer the case questions, review the feedback, and save an original field note of at least '+(seriesCourse?80:12)+' characters. Use fictional names and omit client or personnel information. You can revisit any lesson. Your saved work follows your signed-in account.</p><p>Complete all '+catalog.length+' activities and score at least '+Math.ceil(meta.examCount*.8)+' out of '+meta.examCount+' on the final assessment. You may review the material and retry after an unsuccessful attempt. '+creditDescription()+'</p><h3>Learning records and privacy</h3><p>Submitted field notes, responses, assessment results, active study times, and optional feedback are stored for course administration and review. Draft text and unfinished exam answers stay in memory until submitted and clear on page reload. You can export your submitted work from Field notes.</p><h3>Registration and support</h3><p>'+(state.stage==='paid'?'Enrollment is paid. Review the displayed price before checkout.':'The private pilot is free.')+' For access, accommodations, corrections, complaints, or questions about your records, contact the course publisher through <a href="https://www.pathfindersventures.com/">Pathfinders Ventures</a>. For course navigation, use the part and lesson links in the overview.</p><h3>Author and source</h3><p>Brenen Morse, CPA, is president of Brenz Pizza Co. The course draws on his first-edition manuscript, <i>The Little Black Book on Leadership</i>. Financial workplace cases were developed for this course. Edition released in November 2026.</p></div>'+opsLinks()+'</section>')}
function resources(){block('<section class="focus"><a class="crumb" href="#home">Course overview</a><div class="sectionhead"><div class="eyebrow">Companions</div><h1>Resources</h1><p>Revisit a chapter, find a term, or take a coaching exercise into your next workday.</p></div>'+timingLink()+(slug==='coaching-accounting-teams'?'<p><a class="textlink" href="#rhythm">Practice giving specific recognition</a></p>':'')+'<div class="tools">'+downloads(state,base)+''+[['#reference','Chapter reference','A searchable quick reference covering all 23 chapters.'],['/learning-assets/course-glossary.html','Course glossary','Definitions and examples for the leadership terms used throughout the course.'],['https://apps.apple.com/us/app/leadership-rhythm/id6762418274','Leadership Rhythm','Use timed prompts to notice and recognize people during the workday. Optional iPhone and iPad companion.'],['https://www.barnesandnoble.com/w/the-little-black-book-on-leadership-brenen-morse/1150343489?ean=9798234074829','The original handbook','Explore the first edition of Brenen Morse’s hospitality leadership handbook.']].map(([href,title,desc])=>'<div class="card"><h3><a href="'+href+'">'+title+'</a></h3><p>'+desc+'</p></div>').join('')+'</div><div id="shipStatus" class="card space" hidden></div><p class="space"><a href="#certificates">My certificates</a></p></section>');if(state.stage==='paid'&&state.entitled)shippingStatus(get('shipStatus'),api)}
function enroll(){block('<div class="focus box"><h2>Course access</h2><p>Sign in and enroll to open the lessons and save your work.</p><p class="credit-notice"><strong>'+creditSummary()+'</strong></p>'+offer(state)+kickoff()+'</div>');payHook()}
function caseExhibit(l){
 if(!l.workpaper)return '';
 const w=l.workpaper, lines=w.data.split('\n'), grid=lines.filter(line=>line.includes('|')).map(line=>line.split('|').map(cell=>cell.trim()));
 const table='<div class="paper-table"><table><thead><tr>'+grid[0].map(v=>'<th scope="col">'+esc(v)+'</th>').join('')+'</tr></thead><tbody>'+
   grid.slice(1).map(row=>'<tr>'+row.map(v=>'<td>'+esc(v)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
 return '<section class="box paper"><h2>'+esc(w.title)+'</h2>'+table+lines.filter(line=>!line.includes('|')).map(line=>'<p>'+esc(line)+'</p>').join('')+
  '<h3>Your workpaper</h3><p>'+esc(w.assignment)+'</p>'+
  (l.stage>0?'<h3>New information</h3><p>'+esc(w.change)+'</p>':'')+
  (l.stage===2?'<h3>Check your work</h3><p>'+esc(w.rubric)+'</p>':'')+'</section>';
}
function lessonDraft(index) {
 if (!drafts.has(index)) {
   const choice = state.done.includes(index) ? lessons[index].choices.findIndex(option => option.correct) : -1;
   drafts.set(index, {note:state.notes[index] || '', choice, time:{value:0, at:null}});
 }
 return drafts.get(index);
}
main.addEventListener('slidechange', event => {
 const index = event.detail.panel.dataset.lesson;
 if (index !== undefined) clockOpen(lessonDraft(Number(index)).time);
 else if (event.target.hasAttribute('data-course-reading')) { clockStop(); activeClock = null; }
});
function courseSlides() {
 const seen = new Set();
 const slides = [];
 for (const [index,lesson] of lessons.entries()) {
   for (const paragraph of lesson.reading) {
     if (seen.has(paragraph)) continue;
     seen.add(paragraph);
     slides.push('<section data-slide data-lesson="'+index+'"><p class="slide-kicker">'+esc(meta.title)+' · Chapters '+esc(lesson.chapters)+'</p><h2>'+esc(lesson.title)+'</h2><p>'+esc(paragraph)+'</p></section>');
   }
 }
 const first = catalog.findIndex((_,i)=>!state.done.includes(i));
 const action = first < 0 ? button('#exam','Open final assessment') : button('#fieldwork/'+first,'Answer case questions');
 block('<div class="focus"><a class="crumb" href="#home">Course overview</a><h1>'+esc(meta.title)+'</h1><p class="credit-notice">No CPE Offered</p><fcs-slide-deck data-course-reading data-resume="cpa-'+esc(slug)+'">'+slides.join('')+'<section data-check><h2>Apply the case evidence</h2><p>Answer the case questions and save your field notes. Once all cases are complete, take the final assessment.</p>'+action+'</section></fcs-slide-deck></div>');
}
function lesson(i, afterSlides = false){
 const l=lessons[i];if(!l){home();return}const draft=lessonDraft(i);clockOpen(draft.time);
 const questions = '<form id="practice"><fieldset><legend>'+esc(l.question)+'</legend>'+l.choices.map((c,j)=>'<label class="option"><input required type="radio" name="choice" value="'+j+'" '+(draft.choice===j?'checked':'')+'>'+esc(c.text)+'</label>').join('')+'</fieldset><div id="fb" role="status"></div><label class="label" for="note">Field note · '+esc(l.prompt)+'</label><textarea class="write" id="note" required minlength="'+(seriesCourse?80:12)+'" maxlength="4000" placeholder="Write your response using a fictional example…">'+esc(draft.note)+'</textarea><details class="sample"><summary>See a worked example</summary><p>'+esc(l.example)+'</p></details><div class="row"><button class="primary" type="submit">'+(state.done.includes(i)?'Save and continue':'Complete lesson')+'</button><span id="saveinfo" role="status"></span></div></form>';
 const reading=l.reading.map(p=>'<section data-slide><p class="slide-kicker">Chapters '+esc(l.chapters)+'</p><h2>'+esc(l.title)+'</h2><p>'+esc(p)+'</p></section>').join('');
 const packet='<p>'+esc(l.case)+'</p>'+caseExhibit(l);
 const rhythm=slug==='coaching-accounting-teams' && i===0 ? '<p><a href="#rhythm">Optional recognition exercise</a> · Save your response before leaving.</p>' : '';
 const assessment='<h2>'+esc(l.title)+'</h2>'+packet+questions+rhythm;
 const view=afterSlides ? assessment : '<fcs-slide-deck>'+reading+'<section data-slide><h2>Case briefing</h2>'+packet+'</section><section data-check>'+assessment+'</section></fcs-slide-deck>';
 block('<div class="focus"><a class="crumb" href="#home">Course overview</a><h1>'+(afterSlides?'Case questions':esc(l.title))+'</h1><p>'+esc(l.objective)+'</p>'+view+'</div>');
 const fb=()=>{const item=l.choices[draft.choice];get('fb').innerHTML=item?'<div class="feedback '+(item.correct?'good':'')+'"><strong>'+(item.correct?'Good decision. ':'Consider the consequence. ')+'</strong>'+esc(item.feedback)+'</div>':''};fb();
 get('practice').onchange=e=>{if(e.target.name==='choice'){draft.choice=Number(e.target.value);fb()}};
 get('note').oninput=e=>draft.note=e.target.value;
 get('practice').onsubmit=async e=>{e.preventDefault();if(!l.choices[draft.choice]?.correct){get('saveinfo').textContent='Review the feedback and try another response.';return}const submit=e.submitter;submit.disabled=true;try{await api('lesson',{index:i,choice:draft.choice,note:draft.note,seconds:seconds(draft.time)});await refresh();notify('Lesson and field note saved.');const remaining=catalog.findIndex((_,index)=>!state.done.includes(index));location.hash=remaining<0?'exam':'fieldwork/'+remaining}catch(err){get('saveinfo').textContent=err.message}finally{submit.disabled=false}}
}
function journal(){block('<div class="focus"><a class="crumb" href="#home">Course overview</a><div class="sectionhead"><div class="eyebrow">Your workbook</div><h1>Field notes</h1><p>Your written responses form a personal leadership action plan.</p></div>'+(state.done.length?'<div class="row no-print">'+button('#lesson/'+state.done[0],'Revisit a lesson','outline')+'<button class="soft" id="print">Print action plan</button><button class="soft" id="download">Export learning records</button></div>'+state.done.map(i=>'<article class="card space"><div class="eyebrow">Part '+roman[catalog[i].part-1]+'</div><h3>'+esc(catalog[i].title)+'</h3><p class="journalnote">'+esc(state.notes[i])+'</p><a class="textlink no-print" href="#lesson/'+i+'">Edit response</a></article>').join(''):'<div class="box"><h3>Your first field note starts in lesson one.</h3><p>After the case, save your decision and the action you would take with your team.</p>'+kickoff()+'</div>')+'</div>');payHook();if(get('print'))get('print').onclick=()=>print();if(get('download'))get('download').onclick=async()=>{try{const data=await api('records'),url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='leadership-learning-record.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000)}catch(e){notify(e.message)}}}
function refPage(){block('<div class="focus"><a class="crumb" href="#resources">Resources</a><div class="sectionhead"><h1>Chapter reference</h1><p>From the handbook’s quick reference guide.</p></div><label class="label" for="search">Find a chapter or idea</label><input class="write" id="search" type="search" placeholder="Try coachability or culture"><div id="results" class="space"></div></div>');function show(){const term=get('search').value.trim().toLowerCase();get('results').innerHTML=reference.filter(r=>(r.chapter+' '+r.title+' '+r.excerpt).toLowerCase().includes(term)).map(r=>'<article class="card"><div class="eyebrow">Chapter '+r.chapter+'</div><h3>'+esc(r.title)+'</h3><p>'+esc(r.excerpt)+'</p></article>').join('')||'<p>No matching chapters.</p>'}get('search').oninput=show;show()}
function exam(){
 if(state.passed){record();return}if(state.done.length<catalog.length){block('<div class="focus box"><div class="eyebrow">Final assessment</div><h2>Finish your fieldwork first.</h2><p>'+state.done.length+' of '+catalog.length+' activities complete. Your final assessment opens once each lesson has a saved response.</p>'+kickoff()+'</div>');return}
 if(!examDraft)examDraft={answers:Array(questions.length).fill(-1),name:state.name||'',id:crypto.randomUUID(),time:{value:0,at:null}};clockOpen(examDraft.time);
 block('<div class="focus"><a class="crumb" href="#home">Course overview</a><div class="sectionhead"><div class="eyebrow">'+esc(meta.title)+'</div><h1>Final assessment</h1><p>Choose the strongest response to each case. You need '+Math.ceil(meta.examCount*.8)+' correct answers out of '+meta.examCount+' to complete the course.</p></div>'+(lastReview?'<div class="case"><h3>Last attempt · '+lastReview.score+'%</h3>'+timingLink()+'<p>Revisit the fieldwork before trying again.</p><ul>'+lastReview.review.filter(r=>!r.correct).map(r=>'<li>'+esc(r.title)+'</li>').join('')+'</ul></div>':'')+'<form id="test"><div class="exam-progress no-print"><label for="answer-count">Assessment progress</label><progress id="answer-count" max="'+questions.length+'"></progress><span id="answer-caption" role="status"></span></div><label class="label" for="learner">Name for your completion record</label><input class="write" required minlength="2" maxlength="100" id="learner" autocomplete="name" value="'+esc(examDraft.name)+'">'+questions.map((q,i)=>'<div class="examq"><div class="eyebrow">Decision '+(i+1)+' of '+meta.examCount+'</div><fieldset><legend>'+esc(q.question)+'</legend>'+q.choices.map((x,j)=>'<label class="option"><input required type="radio" name="q'+i+'" value="'+j+'" '+(examDraft.answers[i]===j?'checked':'')+'>'+esc(x)+'</label>').join('')+'</fieldset></div>').join('')+'<div class="row space"><button class="primary">Submit assessment</button><span role="status" id="examerr"></span></div></form></div>');
 get('learner').oninput=e=>examDraft.name=e.target.value;
 function showAnswered(){
   const count = examDraft.answers.filter(answer => answer >= 0).length;
   get('answer-count').value = count;
   get('answer-caption').textContent = count + ' of ' + questions.length + ' answered';
 }
 showAnswered();
 get('test').onchange=e=>{
   if (!/^q\d+$/.test(e.target.name)) return;
   examDraft.answers[Number(e.target.name.slice(1))] = Number(e.target.value);
   showAnswered();
 };
 get('test').onsubmit=async e=>{e.preventDefault();const btn=e.submitter;btn.disabled=true;try{const d=examDraft;lastReview=await api('exam',{name:d.name,answers:d.answers,seconds:seconds(d.time),attemptId:d.id});await refresh();examDraft=null;if(lastReview.passed){location.hash='record'}else{exam();window.scrollTo(0,0)}}catch(err){get('examerr').textContent=err.message}finally{btn.disabled=false}}
}
function record(){if(!state.passed){location.hash='exam';return}block('<div class="focus"><div id="credential"></div>'+timingLink()+'<div class="row space no-print">'+button('#journal','View action plan','soft')+'</div><form class="box no-print" id="evaluation"><h3>Evaluate the course</h3><label class="label" for="rating">How well did the course meet its objectives?</label><select class="write" id="rating" required><option value="">Choose a rating</option>'+[1,2,3,4,5].map(i=>'<option value="'+i+'">'+i+([' · Poorly','',' · Adequately','',' · Very well'][i-1])+'</option>').join('')+'</select><label class="label space" for="comment">What would you change about the cases, timing, materials, or assessment?</label><textarea id="comment" class="write" maxlength="3000"></textarea><button class="primary">Save evaluation</button><p id="evalmsg" role="status"></p></form></div>');mountCredential(get('credential'),state.certificateId).catch(e=>notify(e.message));get('evaluation').onsubmit=async e=>{e.preventDefault();e.submitter.disabled=true;try{await api('evaluation',{rating:Number(get('rating').value),comment:get('comment').value});get('evalmsg').textContent='Thank you. Your evaluation has been saved.'}catch(err){get('evalmsg').textContent=err.message}finally{get('evaluation').querySelector('button').disabled=false}}}
async function certificateHistory(id){
 if(!signed){enroll();return}
 const {certificates}=await api('certificates');
 if(id){
  if(!certificates.some(c=>c.id===id))throw new Error('Certificate unavailable for this account.');
  block('<div class="focus"><p class="no-print"><a href="#certificates">My certificates</a></p><div id="credential"></div></div>');
  await mountCredential(get('credential'),id);return;
 }
 block('<div class="focus"><p><a class="crumb" href="#resources">Resources</a></p><h1>My certificates</h1>'+ (certificates.length?certificates.map(c=>'<article class="card"><h3>'+esc(c.release?.courseTitle||'Leading under pressure')+'</h3><p>'+esc(c.completedAt?.slice(0,10))+' · '+creditSummary(c.release ?? null)+'</p>'+button('#certificates/'+encodeURIComponent(c.id),'Open certificate','soft')+'</article>').join(''):'<p>Complete the course and pass the assessment to earn your certificate.</p>')+'</div>');
}
async function route(){
 const ticket=++routeTicket;clockStop();activeClock=null;
 const [page,arg]=location.hash.substring(1).split('/');document.querySelectorAll('.fcs-course-actions a').forEach(a=>{const curr=page==='journal'?'journal':['resources','reference'].includes(page)?'resources':'home';if(a.hash==='#'+curr)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
 try{
 if(['slides','lesson','fieldwork','reference','exam','record'].includes(page)&&!state.entitled){enroll();return}
 if(['slides','lesson','fieldwork'].includes(page)&&!lessons.length)lessons=await api('lessons');
 if(page==='exam'&&state.done.length===catalog.length&&!state.passed&&!questions.length)questions=await api('questions');
 if(page==='reference'&&!reference.length)reference=await api('reference');
 if(ticket!==routeTicket)return;
 if(page==='timing' && signed && seriesCourse && state.stage==='pilot'){
   block('<div id="pilot-log"></div>'); await mountTiming(get('pilot-log'),api,meta.title,state.version);
   if(ticket!==routeTicket)return;
 }else if(page==='rhythm' && slug==='coaching-accounting-teams'){
   block('<p><a class="crumb" href="#resources">Resources</a></p>'+recognitionPractice('coaching'));
 }else switch(page){case 'sample':block('<section class="focus"><p class="no-print"><a class="crumb" href="#home">Course overview</a></p><div id="sample"></div></section>');mountSample(get('sample'),seriesCourse?meta.title:undefined);break;case 'certificates':await certificateHistory(arg);break;case 'books':if(!state.isOperator)throw new Error('Operator access required.');await booksDesk(main,api,['pending','shipped','needs_address'].includes(arg)?arg:'pending');break;case 'slides':courseSlides();break;case 'fieldwork':lesson(Number(arg),true);break;case 'lesson': lesson(Number(arg));break;case 'reference':refPage();break;case 'resources':resources();break;case 'details':info();break;case 'exam':exam();break;case 'record':record();break;case 'journal':journal();break;default:home()}
 window.scrollTo(0,0);main.focus({preventScroll:true})
 }catch(e){errorPage(e)}
}
function errorPage(e){block('<div class="focus box"><h2>We couldn’t load this page.</h2><p>'+esc(e.message)+'</p><button class="primary" id="retry">Try again</button></div>');get('retry').onclick=()=>location.reload()}
async function start(){try{if(seriesCourse){
  meta=await api('outline');catalog=meta.outline;parts=meta.parts;descriptions=meta.descriptions;
  document.title=meta.title+' · First Career Steps';
 }else{const r=await fetch('/learning-assets/outline.json');if(!r.ok)throw new Error('Course outline unavailable.');catalog=await r.json();}
 await refresh();const sid=new URLSearchParams(location.search).get('session_id');if(sid&&signed){await api('checkout/confirm',{sessionId:sid});await refresh();history.replaceState(null,'',location.pathname+location.hash)}await route();window.addEventListener('hashchange',route)}catch(e){errorPage(e)}}
start();
