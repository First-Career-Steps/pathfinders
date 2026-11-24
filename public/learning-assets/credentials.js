const html = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const displayDate = value => new Intl.DateTimeFormat('en-US',{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'}).format(new Date(value+'T00:00:00Z'));

export function linkedInCredentialUrl(c) {
  const issued=new Date(c.issueDate+'T00:00:00Z');
  const params=new URLSearchParams({startTask:'CERTIFICATION_NAME',name:c.track !== 'restaurant' && c.credits === 0 ? c.title+' (No CPE Offered)' : c.title,organizationName:c.issuer,
    issueYear:String(issued.getUTCFullYear()),issueMonth:String(issued.getUTCMonth()+1),certId:c.id});
  if(c.verifyUrl)params.set('certUrl',c.verifyUrl);
  return 'https://www.linkedin.com/profile/add?'+params.toString();
}
export function certificateBody(c,sample=false) {
  const fields=[['Date of issue',displayDate(c.issueDate)],['Delivery method',c.method]];
  if(c.track==='restaurant')fields.push(['Class','Restaurant leadership']);
  else if(c.credits>0)fields.push(['CPA CPE credits',String(c.credits)],['Field of study',c.field],['Jurisdiction',c.jurisdiction],['Sponsor registration',c.registration]);
  else fields.push(['CPE status','No CPE Offered']);
  return '<article class="credential-sheet'+(sample?' credential-sample':'')+'"><div class="credential-inner">'+
    (sample?'<b class="credential-sample-mark">SAMPLE</b>':'')+
    '<div class="credential-seal" aria-label="Little Black Book Leadership">LB</div>'+
    '<p class="credential-issuer">'+html(c.issuer)+'</p><p class="credential-kicker">Little Black Book Leadership</p>'+
    '<h2>'+html(c.title)+'</h2><p class="credential-awarded">Presented to</p>'+
    '<p class="credential-recipient">'+html(c.name)+'</p><p class="credential-course">For successful completion of '+html(c.courseTitle)+'</p>'+
    '<dl class="credential-facts">'+fields.map(([k,v])=>'<div><dt>'+html(k)+'</dt><dd>'+html(v)+'</dd></div>').join('')+
    '</dl><div class="credential-foot"><div><span>Credential ID</span><strong>'+html(c.id)+'</strong></div><div><span>'+
    (c.signatory?'Authorized signatory':'Issued by')+'</span><strong>'+html(c.signatory||c.issuer)+'</strong></div></div>'+
    (c.credits>0?'<p class="credential-contact">'+html(c.contact)+'</p>':'')+'</div></article>';
}
const printStyles = `
  @page {size:letter landscape;margin:0.30in}
  *{box-sizing:border-box}html,body{margin:0;color:#183a31;background:#eae8df;font:15px/1.35 Arial,sans-serif}
  main{width:min(10.35in,100%);margin:.3in auto} .credential-sheet{position:relative;min-height:7.45in;text-align:center;
  background:#fffef8;border:3px solid #234b3d;padding:.10in;print-color-adjust:exact;-webkit-print-color-adjust:exact}
  .credential-inner{position:relative;min-height:7.18in;border:1.5px solid #a88746;padding:.22in .43in .19in;display:flex;flex-direction:column;align-items:center;justify-content:center}
  .credential-inner:before,.credential-inner:after{content:"";position:absolute;width:.72in;height:.72in;border-color:#c8a85f;border-width:0;border-style:solid;pointer-events:none}
  .credential-inner:before{top:.065in;left:.065in;border-top-width:3px;border-left-width:3px}.credential-inner:after{bottom:.065in;right:.065in;border-bottom-width:3px;border-right-width:3px}
  .credential-seal{display:grid;place-items:center;width:.45in;height:.45in;margin-bottom:.05in;border:3px double #a58441;border-radius:60%;color:#977333;font:italic 19px Georgia,serif}
  .credential-issuer{margin:.025in 0;font:600 15px/1.25 Georgia,serif}.credential-kicker{margin:.015in 0 .10in;color:#756134;text-transform:uppercase;letter-spacing:.18em;font-size:10px}
  h2{max-width:8.7in;margin:0;font:normal 33px/1.12 Georgia,serif;color:#204e40;text-wrap:balance}
  .credential-awarded{margin:.14in 0 .025in;color:#66583d;font-size:12px}.credential-recipient{margin:.015in 0 .025in;max-width:100%;overflow-wrap:anywhere;font:italic 39px/1.11 Georgia,serif;color:#173b30}
  .credential-course{max-width:7.5in;margin:.075in 0 .16in;font:16px/1.3 Georgia,serif}.credential-facts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));width:100%;margin:0;padding:.11in 0;gap:.10in .16in;border-block:1px solid #c7b789}
  .credential-facts dt,.credential-foot span{display:block;color:#605948;font:10px/1.3 Arial,sans-serif;text-transform:uppercase;letter-spacing:.1em}.credential-facts dd{margin:2px 0 0;font-size:14px;font-weight:600}
  .credential-foot{width:100%;display:flex;justify-content:space-between;align-items:end;text-align:left;gap:.3in;margin:.16in 0 0}
  .credential-foot>div:last-child{text-align:right}.credential-foot strong{font:13px/1.25 Georgia,serif;overflow-wrap:anywhere}
  .credential-contact{font-size:10px;margin:.08in 0 0}.credential-sample-mark{position:absolute;right:.18in;top:.18in;color:#805b1f;letter-spacing:.14em;border:1px solid #ad8a4c;padding:3px 7px;font-size:12px}
  main>button{padding:10px 16px;margin-top:.12in}
  @media print{html,body{background:white}main{margin:0 auto;width:100%}main>button{display:none}.credential-sheet{break-inside:avoid}}
`;
export function printCertificate(c,sample=false) {
  const w=window.open('','_blank');
  if(!w)throw Error('Allow the certificate window to open and select Print again.');
  w.opener=null;
  w.document.open();
  w.document.write('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+
    (sample?'Sample certificate':'Course completion certificate')+'</title><style>'+printStyles+'</style><main>'+certificateBody(c,sample)+'<button type="button">Print / Save PDF</button></main></html>');
  w.document.close();
  w.document.querySelector('button').onclick=()=>w.print();
  w.focus();
  w.print();
}
export function mountSample(container,courseName) {
  if(!container)return;
  const sample={title:(courseName||'Leading Under Pressure')+' — Certificate of Completion',name:'Sample Learner',issuer:'Pathfinders Ventures',credits:0,
    courseTitle:courseName||'Leading under pressure · CPA edition',method:'Self Study',issueDate:'2026-11-22',id:'SAMPLE · Demonstration copy'};
  container.innerHTML=certificateBody(sample,true)+'<div class="row"><button class="soft" type="button" data-print>Print sample</button></div><p aria-live="polite" data-message></p>';
  container.querySelector('[data-print]').onclick=()=>{try{printCertificate(sample,true);}catch(e){container.querySelector('[data-message]').textContent=e.message;}};
}
async function fetchCredential(id,share) {
  const config=share===undefined?{cache:'no-store'}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,share})};
  const res=await fetch('/api/education/credential'+(share===undefined?'?id='+encodeURIComponent(id):''),config);
  const result=await res.json();
  if(!res.ok)throw Error(result.error||'Credential unavailable. Please retry.');
  return result;
}

export async function mountCredential(container,id) {
  if(!container||!id)return;
  const render=c=>{
    container.innerHTML=certificateBody(c)+'<div class="row"><button class="primary" type="button" data-print>Print certificate</button>'+
      '<a class="soft" rel="noopener noreferrer" target="_blank" href="'+html(linkedInCredentialUrl(c))+'">Add credential to LinkedIn</a></div>'+
      (c.canShare||c.hasConsent?'<details class="space"><summary>Verification link</summary><p>Anyone with an enabled link can view your name, certificate title, issuer, issue date, and CPE credits.</p>'+
      (c.verifyUrl?'<p><a target="_blank" rel="noopener noreferrer" href="'+html(c.verifyUrl)+'">View verification page</a></p>':'')+
      '<button class="soft" type="button" data-share>'+ (c.hasConsent?'Revoke verification link':'Enable verification link')+'</button></details>':'')+
      '<p aria-live="polite" data-message></p>';
    const message=container.querySelector('[data-message]');
    container.querySelector('[data-print]').onclick=()=>{try{printCertificate(c);}catch(e){message.textContent=e.message;}};
    const shareButton=container.querySelector('[data-share]');
    if(shareButton)shareButton.onclick=async()=>{
      shareButton.disabled=true;
      try{
        const updated=await fetchCredential(c.id,!c.hasConsent);
        render(updated);
        container.querySelector('[data-message]').textContent=updated.hasConsent?'Verification link enabled.':'Verification link revoked.';
      }catch(e){message.textContent=e.message;shareButton.disabled=false;}
    };
  };
  container.textContent='Loading certificate…';
  try{render(await fetchCredential(id));}catch(e){container.textContent=e.message;}
}
