const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const activities = {study:'Required study or casework',firstExam:'First final assessment',retake:'Remedial study or retake',excluded:'Break, evaluation or optional practice'};

export async function mountTiming(container, api, title, version) {
  let saved = await api('timing');
  if (!container.isConnected) return;
  const data = saved.record || {sessions:[]};
  const readOnly = Boolean(saved.signedAt);
  const field = (label,key) => '<label class="label">'+label+'<input class="write" maxlength="160" name="'+key+'" value="'+escape(data[key])+'"></label>';
  container.innerHTML = '<section class="focus"><a class="crumb" href="#home">Course overview</a><p class="eyebrow">Independent pilot · No CPE Offered</p>'+
    '<h1>Pilot timing log</h1><p>'+escape(title)+' · '+escape(version)+'</p>'+
    '<p>Study at your usual pace. Record the date and minutes you actually spent on each activity. Use a separate entry for breaks, repeat attempts, app practice and other optional work. Save your draft before leaving this page.</p>'+
    '<form><fieldset class="timing-fields"><legend>Your study sessions</legend><div data-sessions></div><button type="button" class="soft" data-add>Add a session</button><p data-total aria-live="polite"></p></fieldset>'+
    '<fieldset class="timing-fields"><legend>Tester details</legend>'+field('Full name','name')+field('Role and relevant experience','role')+
    '<label class="label">Tester category<select class="write" name="status" aria-label="Tester category"><option value="">Select one</option><option value="CPA">CPA with an active license in good standing</option><option value="Other professional">Other professional in the intended audience</option></select></label>'+
    field('CPA jurisdiction, if applicable','jurisdiction')+field('CPA license number, if applicable','license')+
    '<label class="label">Unusual circumstances or feedback (optional)<textarea class="write" maxlength="1800" name="notes">'+escape(data.notes)+'</textarea></label></fieldset>'+
    '<p>Your saved drafts are private to your account through the course site. Signing makes this record available in the operator’s evidence export.</p>'+
    '<label class="option"><input type="checkbox" name="attest"> I completed this edition independently of its development team, was not told an expected duration and recorded my own times accurately. My name above is my electronic signature.</label>'+
    '<p class="row no-print"><button class="soft" value="draft">Save draft</button><button class="primary" value="sign">Sign and submit final record</button></p></form>'+
    '<p data-message role="status"></p><button class="soft no-print" type="button" data-print>Print or save PDF</button></section>';
  const form = container.querySelector('form');
  const sessions = form.querySelector('[data-sessions]');
  const message = container.querySelector('[data-message]');
  const total = form.querySelector('[data-total]');
  form.elements.status.value = data.status || '';
  form.elements.attest.checked = Boolean(data.attested);
  function updateTotals() {
    const sums = {study:0,firstExam:0,retake:0,excluded:0};
    for (const line of sessions.children) sums[line.querySelector('select').value] += Number(line.querySelector('[name=minutes]').value) || 0;
    total.textContent = 'Included: '+(sums.study+sums.firstExam)+' min ('+sums.study+' study + '+sums.firstExam+' first assessment). Separately recorded: '+sums.retake+' min remedial or retake, '+sums.excluded+' min excluded.';
  }
  function addSession(entry = {}) {
    const line = document.createElement('div');
    line.className = 'timing-entry';
    line.innerHTML = '<label>Date<input type="date" name="date" required></label><label>Type of activity<select aria-label="Type of activity" name="category">'+Object.entries(activities).map(([value,label])=>'<option value="'+value+'">'+label+'</option>').join('')+'</select></label>'+
      '<label>Minutes<input name="minutes" type="number" min="1" max="1440" step="1" required></label><label>Activity<input name="activity" required maxlength="180" placeholder="e.g. Review the exception register"></label><button class="soft no-print" type="button">Remove entry</button>';
    const date = new Date();
    line.querySelector('[name=date]').value = entry.date || new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,10);
    line.querySelector('[name=category]').value = entry.category || 'study';
    line.querySelector('[name=minutes]').value = entry.minutes ?? '';
    line.querySelector('[name=activity]').value = entry.activity || '';
    line.querySelector('button').onclick = () => { line.remove(); updateTotals(); };
    sessions.append(line);
    updateTotals();
    return line;
  }
  for (const entry of data.sessions) addSession(entry);
  if (!data.sessions.length && !readOnly) addSession();
  updateTotals();
  form.querySelector('[data-add]').onclick = () => {
    if (sessions.children.length >= 80) { message.textContent = 'This log supports 80 entries.'; return; }
    addSession().querySelector('input').focus();
  };
  sessions.addEventListener('input', updateTotals);
  function lock() {
    for (const element of form.elements) element.disabled = true;
    for (const button of form.querySelectorAll('button')) button.hidden = true;
    message.textContent = 'Signed '+new Date(saved.signedAt).toLocaleString()+'. Your final record is available to the course operator.';
  }
  if (readOnly) lock();
  else if (saved.revision) message.textContent = 'Saved draft. You can return to this page after another session.';
  container.querySelector('[data-print]').onclick = () => window.print();
  form.onsubmit = async event => {
    event.preventDefault();
    if (saved.signedAt || form.dataset.saving) return;
    const finalize = event.submitter?.value === 'sign';
    const record = Object.fromEntries(['name','role','status','jurisdiction','license','notes'].map(name=>[name,form.elements[name].value]));
    record.sessions = Array.from(sessions.children, line => ({
      date:line.querySelector('[name=date]').value,category:line.querySelector('select').value,
      minutes:Number(line.querySelector('[name=minutes]').value),activity:line.querySelector('[name=activity]').value
    }));
    if (finalize && !form.elements.attest.checked) { message.textContent = 'Read and check the attestation before signing.'; return; }
    const attested = form.elements.attest.checked;
    form.dataset.saving = 'yes';
    const controls = Array.from(form.querySelectorAll('input,select,textarea,button'));
    controls.forEach(control => control.disabled = true);
    try {
      saved = await api('timing/save',{revision:saved.revision,finalize,attested,record});
      message.textContent = 'Draft saved to your account.';
    } catch(error) {
      message.textContent = error.message;
    } finally {
      controls.forEach(control => control.disabled = false);
      delete form.dataset.saving;
      if (saved.signedAt) lock();
    }
  };
}
