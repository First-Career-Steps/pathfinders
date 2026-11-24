import {recognitionPractice} from './recognition.js';
import {certificateBody,printCertificate,linkedInCredentialUrl} from './credentials.js';
const main=document.querySelector('main');
const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=c=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(c/100);
const link=(href,text,cls='cta')=>'<a class="'+cls+'" href="'+href+'">'+esc(text)+'</a>';
let navigation=0;
async function api(path,data){
  const r=await fetch('/api/education/restaurant/'+path,data===undefined?{cache:'no-store'}:{
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
  const result=await r.json();
  if(!r.ok)throw Object.assign(Error(result.error||'Please try again.'),{status:r.status});
  return result;
}
function panel(html){main.innerHTML=html;}
function report(error){
  const place=main.querySelector('[role="alert"]');
  if(place)place.textContent=error.message;
}
function onClick(selector,run){
  const btn=main.querySelector(selector);
  if(btn)btn.onclick=async()=>{btn.disabled=true;try{await run();}catch(err){report(err);}finally{btn.disabled=false;}};
}
const alertBox='<p class="shift-error" role="alert"></p>';
function board(s,orders){
  const done=s.work.filter(w=>w.note!=null);
  const next=s.requiredShifts.find(i=>!done.some(w=>w.shift===i)) ?? -1;
  const progress=done.filter(w=>s.requiredShifts.includes(w.shift)).length+' of 3 core shifts complete';
  let action=s.entitled?(next<0?link('#award','Open completion certificate'):link('#shift/'+next,s.work.length?'Continue your shifts':'Play your first shift')):'<button id="join" class="primary">'+(s.paid?'Enroll · '+money(s.cents):'Join the free pilot')+'</button>';
  panel('<section class="shelf"><div class="shelf-copy"><p class="eyebrow">Leadership course</p><h1>Restaurant <em>Leadership.</em></h1><p>Make three calls you can use on your next shift. Steady a rush, coach a teammate, and close a handoff. Each decision shows how the crew responds.</p>'+action+'</div><img src="/learning-assets/lead-the-shift.webp" alt="Restaurant teammates working the pizza pass"></section>'+
    '<section class="box"><h2>Three restaurant courses</h2><p>Lead the rush, coach a new hire and hand off the shift. Each course includes a lesson, decisions with feedback and a plan for your next shift. Print your practice record before closing the tab.</p>'+(s.entitled?link('/api/education/restaurant/courses','Open the three courses'):'<p>Join the restaurant class to open the courses.</p>')+'<p>'+link('/learn/leadership/team-training','Individual course and paperback · $49','textlink')+'</p></section>'+
    '<div class="shift-strip">3 core shifts · 3 optional scenarios · Certificate of completion · No CPE</div>'+alertBox+
    '<section class="shift-board"><div class="sectitle"><h2>Shift board</h2><small>'+ (s.entitled?progress:'Three core shifts')+'</small></div><div class="shift-list">'+[...s.requiredShifts,...s.shifts.map((_,i)=>i).filter(i=>!s.requiredShifts.includes(i))].map(i=>{
      const item=s.shifts[i];
      const work=s.work.find(w=>w.shift===i);
      const status=work?.note!=null?'Review your shift':work?'Resume your shift':'Play this shift';
      return '<article class="shift-ticket"><p class="eyebrow">'+(s.requiredShifts.includes(i)?'Core shift':'Optional practice')+' · '+esc(item.station)+'</p><h3>'+esc(item.title)+'</h3><p>'+esc(item.objective)+'</p>'+(s.entitled?link('#shift/'+i,status,'textlink'):'')+'</article>';
    }).join('')+'</div></section><section class="box"><h2>Your fieldbook</h2><p>Each shift draws on <i>The Little Black Book on Leadership</i> by Brenen Morse. '+(s.paid?'Paid enrollment includes the PDF and one paperback with U.S. standard shipping.':'The free pilot includes the complete digital book.')+'</p><div class="shift-tools">'+(s.entitled?link('/api/education/restaurant/handbook.pdf','Download the book (PDF)','soft'):'')+(s.certificate?link('#award','My certificate','soft'):'')+'</div>'+orders.map(o=>'<p>Paperback · '+esc(({pending:'Awaiting shipment',needs_address:'Address under review',shipped:'Shipped'})[o.status]||o.status)+(o.tracking?' · '+esc(o.tracking):'')+'</p>').join('')+'</section>');
  onClick('#join',async()=>{if(s.paid){const {url}=await api('checkout',{});location.assign(url);}else{await api('join',{});location.hash='#shift/0';}});
}
const options=(labels,name)=>labels.map((x,i)=>'<label class="option"><input type="radio" required name="'+name+'" value="'+i+'"><span>'+esc(x)+'</span></label>').join('');
const boardLink=link('/learn/leadership/restaurant','Shift board','crumb');
function player(d,i,s,draft=''){
  const nextCore=s.requiredShifts.find(n=>n!==i&&!s.work.some(w=>w.shift===n&&w.note!=null));
  const next=nextCore!==undefined?link('#shift/'+nextCore,'Open next core shift'):link('#award','Open certificate');
  const completed=d.done?'<section><h2>Shift debrief</h2><p>'+esc(d.debrief)+'</p><h3>Your next-shift action</h3><p class="shift-note">'+esc(d.note)+'</p>'+(i===0?recognitionPractice('restaurant'):'')+'<div class="row">'+next+link('#practice/'+i,'Explore other decisions','soft')+'</div><p>'+link('#award','Check certificate progress','textlink')+'</p></section>':'';
  const scenario='<section class="shift-scene"><p class="eyebrow">'+esc(d.time)+' · '+esc(d.station)+'</p><p>'+esc(d.scene)+'</p></section>';
  let body='<fieldset><legend>'+esc(d.question)+'</legend>'+options(d.options,'choice')+'</fieldset><button class="primary">Make the call</button>';
  let consequence='';
  if(d.branch){
    consequence='<p><b>Your call</b> · '+esc(d.options[d.first])+'</p><p class="shift-note">'+esc(d.branch.outcome)+'</p>';
    body='<fieldset><legend>'+esc(d.branch.followUp)+'</legend>'+options(d.branch.choices,'choice')+'</fieldset><label for="note" class="label">Your next-shift action</label><p>'+esc(d.challenge)+'</p><textarea class="write" id="note" name="note" required minlength="8" maxlength="600" placeholder="What will you do on your next shift?">'+esc(draft)+'</textarea><button class="primary">Try this follow-up</button>';
  }
  panel('<article class="focus">'+boardLink+'<p class="eyebrow">'+(s.requiredShifts.includes(i)?'Core shift '+(s.requiredShifts.indexOf(i)+1)+' of 3':'Optional scenario')+' · Book chapters '+esc(d.chapters)+'</p><h1>'+esc(d.title)+'</h1>'+scenario+consequence+
    (d.feedback?'<p class="shift-feedback" role="status"><b>'+(d.done?'Shift completed.':'Try the follow-up again.')+'</b> '+esc(d.feedback)+'</p>':'')+
    (d.done?completed:'<form class="shift-form">'+body+'</form>')+alertBox+'</article>');
  const form=main.querySelector('form');
  if(form)form.onsubmit=async e=>{
    e.preventDefault();const btn=e.submitter, route=navigation;btn.disabled=true;
    const values=new FormData(form);const note=String(values.get('note')||'');
    try{const updated=await api(d.branch?'resolve':'decide',{shift:i,first:d.first,choice:Number(values.get('choice')),note});
      if(route===navigation){player(updated,i,s,note);const focus=main.querySelector('[role="status"]')||main.querySelector('.shift-note');if(focus){focus.tabIndex=-1;focus.focus();}}
    }catch(err){report(err);}finally{btn.disabled=false;}
  };
}
function practice(d,i,first=null,second=null){
  const branch=first!==null?d.options[first]:null;
  panel('<article class="focus">'+link('#shift/'+i,'Return to your completed shift','crumb')+'<p class="eyebrow">Practice replay</p><h1>'+esc(d.title)+'</h1><p>'+esc(d.scene)+'</p><form class="shift-form"><fieldset><legend>'+esc(branch?branch.followUp:d.question)+'</legend>'+
    (branch?'<p class="shift-note">'+esc(branch.outcome)+'</p>':'')+options((branch?branch.choices:d.options).map(x=>x.label),'choice')+'</fieldset><button class="primary">'+(branch?'See the outcome':'Explore this choice')+'</button></form>'+
    (second!==null?'<p role="status" class="shift-feedback">'+esc(branch.choices[second].feedback)+'</p>':'')+(branch?'<button id="again" class="soft">Try another first decision</button>':'')+'</article>');
  main.querySelector('form').onsubmit=e=>{e.preventDefault();const choice=Number(new FormData(e.target).get('choice'));practice(d,i,branch?first:choice,branch?choice:null);};
  onClick('#again',()=>practice(d,i));
}
async function award(s,ticket){
  if(s.certificate){
    const c=await api('certificate');if(ticket!==navigation)return;
    panel('<section class="focus">'+boardLink+certificateBody(c)+'<div class="row"><button id="print" class="primary">Print / Save PDF</button><a class="soft" target="_blank" rel="noopener noreferrer" href="'+esc(linkedInCredentialUrl(c))+'">Add to LinkedIn</a></div>'+alertBox+'</section>');
    onClick('#print',()=>printCertificate(c));return;
  }
  const remaining=s.requiredShifts.filter(i=>!s.work.some(w=>w.shift===i&&w.note!=null)).length;
  panel('<section class="focus">'+boardLink+'<p class="eyebrow">Restaurant leadership</p><h1>Certificate of completion</h1>'+
    (remaining?'<p>Complete '+remaining+' more shift'+(remaining===1?'':'s')+' to earn your restaurant leadership certificate.</p>'+link('/learn/leadership/restaurant','See your shift board'):
    '<p>You completed all three core shifts. Enter your name as you would like it to appear on your certificate.</p><form class="shift-form"><label class="label" for="award-name">Name on certificate</label><input class="write" id="award-name" name="name" required minlength="2" maxlength="100" autocomplete="name"><button class="primary">Issue my certificate</button></form>')+alertBox+'</section>');
  const form=main.querySelector('form');
  if(form)form.onsubmit=async e=>{e.preventDefault();const btn=e.submitter;btn.disabled=true;try{await api('finish',{name:new FormData(form).get('name')});await route();}catch(err){report(err);}finally{btn.disabled=false;}};
}
async function route(){
  const ticket=++navigation;
  const [page,arg]=location.hash.slice(1).split('/');
  try{
    const s=await api('state');if(ticket!==navigation)return;
    if(page==='award'){await award(s,ticket);}
    else if(s.entitled&&['shift','practice'].includes(page)&&/^\d+$/.test(arg)&&Number(arg)<s.shifts.length){
      const i=Number(arg),d=await api('play?shift='+i+(page==='practice'?'&practice=1':''));if(ticket!==navigation)return;
      if(page==='practice')practice(d,i);else player(d,i,s);
    }else{
      const shipping=s.entitled&&s.paid?await api('book'):{orders:[]};if(ticket!==navigation)return;
      board(s,shipping.orders);
    }
    if(new URLSearchParams(location.search).has('session_id') && s.entitled)history.replaceState(null,'',location.pathname+location.hash);
    main.focus({preventScroll:true});window.scrollTo(0,0);
  }catch(err){
    if(ticket!==navigation)return;
    panel('<div class="focus box"><h1>Restaurant Leadership</h1><p>'+esc(err.message)+'</p>'+ (err.status===401?link('/learn/signin?return_to=%2Frestaurant','Sign in to start'):link('/learn/leadership/restaurant','Return to shift board'))+'</div>');
  }
}
window.addEventListener('hashchange',route);
route();
