import assert from 'node:assert/strict';
import {randomUUID,randomBytes} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createClient} from '@supabase/supabase-js';
import {createServerClient} from '@supabase/ssr';
import {parse} from 'node-html-parser';
const base='https://www.firstcareersteps.com',url=process.env.NEXT_PUBLIC_SUPABASE_URL;
assert.equal(new URL(url).hostname,'utvzeplkmadbxjnrxnlt.supabase.co');
const courses=[['ai-multiple',[6,25,42],44],['ai-building',[7,26,44],45]];
for(const [slug] of courses){
 const html=await (await fetch(base+'/classes/'+slug+'?qa='+randomUUID(),{redirect:'error'})).text();
 assert.match(parse(html).querySelector('.sc-cover .sc-label').text,/Published · Free/);
}
const admin=createClient(url,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{autoRefreshToken:false,persistSession:false}});
const email='release-check-'+randomUUID()+'@example.invalid',password=randomBytes(28).toString('base64url');
const created=await admin.auth.admin.createUser({email,password,email_confirm:true});
if(created.error)throw new Error('QA identity setup: '+created.error.code);
const id=created.data.user.id;
try{
 const jar=new Map();
 const student=createServerClient(url,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{cookies:{getAll:()=>Array.from(jar,([name,value])=>({name,value})),setAll:entries=>{for(const {name,value} of entries){if(value)jar.set(name,value);else jar.delete(name)}}}});
 const auth=await student.auth.signInWithPassword({email,password});
 if(auth.error||auth.data.user?.id!==id)throw new Error('QA learner sign-in failed');
 const cookie=Array.from(jar,([name,value])=>name+'='+value).join('; ');
 assert.ok(cookie.length);
 for(const [slug,numbers,video] of courses){
  const staged=JSON.parse(readFileSync('src/lib/classes/content/'+slug+'.json','utf8')).slides;
  const post=async data=>{const r=await fetch(base+'/api/classes/'+slug,{method:'POST',redirect:'error',headers:{'Content-Type':'application/json',Origin:base,Cookie:cookie},body:JSON.stringify(data)});assert.equal(r.status,200,slug+' progress '+data.event+' status '+r.status);};
  await post({event:'start'});
  for(const n of [...numbers,video]){
   const slide=staged[n-1];await post({event:'slide',key:slide.key});
   const r=await fetch(base+'/classes/'+slug+'/learn?qa='+randomUUID(),{redirect:'error',headers:{Cookie:cookie,'Cache-Control':'no-cache'}});
   assert.equal(r.status,200);
   const doc=parse(await r.text());const body=doc.querySelector('.sc-teaching')?.text;
   assert.equal(doc.querySelector('.sc-slidebody h2')?.text,slide.title);
   assert.ok(doc.querySelector('.sc-slidebar')?.text.includes('Slide '+n+' of '+staged.length));
   assert.equal(body,slide.body);
   if(n===video){
     const recording=doc.querySelector('.sc-work')?.text??'';assert.match(recording,/Recording coming soon/);assert.match(recording,/Annotated walkthrough/);assert.match(recording,/Read the narration script/);
     console.log('LIVE_VIDEO_SLOT '+slug+' '+n);
   }else console.log('LIVE_SLIDE '+JSON.stringify({slug,number:n,body}));
  }
 }
}finally{
 const deleted=await admin.auth.admin.deleteUser(id);
 if(deleted.error)throw new Error('QA cleanup failed: '+deleted.error.code);
 console.log('LIVE_VERIFICATION_ACCOUNT_REMOVED');
}
