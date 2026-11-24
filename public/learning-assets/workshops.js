'use strict';

const stateKey = slug => 'fcs.ai-workshop.v1.' + slug;
function readState(slug) {
  try { return JSON.parse(localStorage.getItem(stateKey(slug))) || {}; }
  catch { return {}; }
}
for (const label of document.querySelectorAll('[data-progress]')) {
  const state = readState(label.dataset.progress);
  label.textContent = state.complete ? 'Completed in this browser' : state.values ? 'In progress in this browser' : '';
}
const status = document.querySelector('#status');
let clearMessage;
for (const button of document.querySelectorAll('[data-copy]')) {
  button.addEventListener('click', async () => {
    const source = button.parentElement.querySelector('[data-copy-text]');
    try {
      await navigator.clipboard.writeText(source.textContent);
      status.textContent = 'Copied to clipboard.';
    } catch {
      const range = document.createRange();
      range.selectNodeContents(source);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      status.textContent = 'Text selected. Use your device’s Copy command.';
    }
    clearTimeout(clearMessage);
    clearMessage = setTimeout(() => { status.textContent = ''; }, 4500);
  });
}

function setupWorkbook(page) {
  const form = document.querySelector('#workbook');
  const slug = page.dataset.slug;
  const state = readState(slug);
  const controls = [...form.querySelectorAll('[name]')];
  for (const field of controls) {
    const value = state.values?.[field.name];
    if (typeof value !== 'string') continue;
    if (field.type === 'radio') field.checked = field.value === value;
    else field.value = value;
  }
  let suitePassed = state.suitePassed === true;
  let customPassed = state.customPassed === true;
  let complete = state.complete === true;
  let suiteReport = typeof state.suiteReport === 'string' ? state.suiteReport : '';
  let customReport = typeof state.customReport === 'string' ? state.customReport : '';
  const completion = document.querySelector('#completion');
  function renderCompletion() {
    completion.textContent = complete ? 'Class complete. Your workbook is ready to download.' : '';
  }
  function sections(){
    return [...form.querySelectorAll('.studio[id^="stage-"]')].map(stage=>{
      const lines=[...stage.querySelectorAll('textarea')].filter(f=>f.value.trim()).map(f=>f.labels[0].firstChild.textContent+' — '+f.value.trim());
      return {stage, title:stage.querySelector('h2').textContent, notes:lines.join('\n\n')};
    });
  }
  function workbookText() {
    const notes=sections().map(s=>s.title+'\n'+s.notes);
    if (suiteReport) notes.push('Test suite\n'+suiteReport);
    if (customReport) notes.push('My test\n'+customReport);
    return [page.querySelector('h1').textContent, complete?'Completed':'Work in progress', ...notes].join('\n\n');
  }
  function save(){
    try {
      localStorage.setItem(stateKey(slug),JSON.stringify({values:Object.fromEntries(new FormData(form)), complete,suitePassed,customPassed,suiteReport,customReport,workbook:workbookText()}));
    } catch {
      document.querySelector('#save-note').textContent='This browser could not save your work. Download your workbook before you leave.';
    }
  }
  const master=document.querySelector('#master');
  const template=master?.textContent;
  function renderNotes(){
    for (const {stage,notes} of sections()) {
      stage.querySelector('.draft-preview').textContent=notes || 'Your notes will appear here.';
      stage.querySelector('[data-copy]').disabled = !notes && !stage.contains(master);
      if (stage.contains(master)) stage.querySelector('.draft-preview + button').disabled=!notes;
    }
    if (master) master.textContent=template.replace('[paste developed idea or clear summary]',()=>sections()[0].notes || '[Complete the project context in exercise 1.]');
    const selected=form.querySelector('[name="check"]:checked');
    document.querySelector('#feedback').textContent=selected?.dataset.feedback || '';
  }
  const prior=document.querySelector('#prior-work');
  if (prior) {
    const previous=readState(page.dataset.prior);
    prior.textContent=previous.workbook || 'No earlier workbook is saved in this browser. Use the worked example or your own idea.';
  }

  // The learner selects two implementation decisions. The displayed code and the
  // test runner use the same predicates; no learner-supplied code is executed.
  const loose = value => Number.isFinite(Number(value));
  const strict = value => value.trim() !== '' && Number.isInteger(Number(value)) && Number(value) >= 0;
  const below = (stock,threshold) => stock < threshold;
  const inclusive = (stock,threshold) => stock <= threshold;
  function rules(){
    return {valid:form.elements.validation.value==='strict'?strict:loose, reorder:form.elements.boundary.value==='inclusive'?inclusive:below};
  }
  function stockFlag(stock,threshold,valid,reorder) {
    if (!valid(stock) || !valid(threshold)) return 'Invalid';
    return reorder(Number(stock),Number(threshold)) ? 'Reorder' : 'OK';
  }
  const implementation=document.querySelector('#implementation');
  function showCode(){
    const {valid,reorder}=rules();
    implementation.textContent='const valid = '+valid.toString()+';\nconst reorder = '+reorder.toString()+';\n'+stockFlag.toString()+'\n\n// Example call with text inputs\nstockFlag("4", "5", valid, reorder);';
  }
  function run(stock,threshold){
    const {valid,reorder}=rules();
    return stockFlag(stock,threshold,valid,reorder);
  }
  function resultLine(stock,threshold,expected,actual){
    return JSON.stringify([stock,threshold])+' → '+actual+' (expected '+expected+')';
  }
  function showSuite(){
    const list=document.querySelector('#results');
    list.replaceChildren();
    for(const line of suiteReport.split('\n').filter(Boolean)){
      const item=document.createElement('li');
      item.textContent=line;
      list.append(item);
    }
  }
  if(implementation){
    showCode();
    showSuite();
    document.querySelector('#custom-result').textContent=customReport;
    document.querySelector('#tests').onclick=()=>{
      const cases=[['8','5','OK'],['2','5','Reorder'],['5','5','Reorder'],['','5','Invalid'],['-1','5','Invalid'],['1.5','5','Invalid'],['2','-1','Invalid']];
      suitePassed=true;
      const lines=cases.map(([stock,t,expected])=>{
        const actual=run(stock,t);
        if(actual!==expected) suitePassed=false;
        return (actual===expected?'Pass · ':'Revise · ')+resultLine(stock,t,expected,actual);
      });
      suiteReport=lines.join('\n');
      showSuite();save();
    };
    document.querySelector('#custom-test').onclick=()=>{
      const {stock,threshold,expected}=form.elements;
      const actual=run(stock.value,threshold.value);
      customPassed=actual===expected.value;
      customReport=(customPassed?'Pass · ':'Revise · ')+resultLine(stock.value,threshold.value,expected.value,actual);
      document.querySelector('#custom-result').textContent=customReport;
      save();
    };
  }
  form.addEventListener('input',e=>{
    complete=false;
    e.target.setCustomValidity('');
    if(['validation','boundary'].includes(e.target.name)){
      suitePassed=false;suiteReport='';showSuite();showCode();
    }
    if(['validation','boundary','stock','threshold','expected'].includes(e.target.name)){
      customPassed=false;customReport='';document.querySelector('#custom-result').textContent='';
    }
    renderCompletion();renderNotes();save();
  });
  form.addEventListener('submit',e=>{
    e.preventDefault();
    for(const f of form.querySelectorAll('textarea'))f.setCustomValidity(f.value.trim()?'':'Enter your response.');
    if(!form.reportValidity())return;
    if(form.querySelector('[name="check"]:checked')?.dataset.correct!=='true'){
      completion.textContent='Review the feedback, then try the knowledge check again.';
      return;
    }
    if(implementation && !(suitePassed && customPassed)){
      completion.textContent='Pass the test suite in exercise 2 and run a passing test of your own in exercise 3.';
      return;
    }
    complete=true;renderCompletion();save();
  });
  document.querySelector('#download').onclick=()=>{
    const url=URL.createObjectURL(new Blob([workbookText()],{type:'text/plain;charset=utf-8'}));
    const link=document.createElement('a');
    link.href=url;link.download='AI-'+slug+'-workbook.txt';link.click();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
  };
  renderNotes();renderCompletion();
}
const workshop=document.querySelector('#workshop');
if(workshop)setupWorkbook(workshop);
