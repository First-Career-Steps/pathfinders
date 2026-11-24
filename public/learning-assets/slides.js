/* A deck has ordinary HTML sections, so the lesson also works with scripts off. */
class LessonDeck extends HTMLElement {
  connectedCallback() {
    queueMicrotask(() => {
      if (!this.isConnected || this.controls) return;
      this.panels = Array.from(this.children).filter(node => node.matches('[data-slide],[data-check]'));
      if (this.panels.length < 2) return;
      this.controls = document.createElement('div');
      this.controls.className = 'slide-controls';
      this.controls.innerHTML = '<button type="button" class="slide-back">Back</button><span class="slide-position" role="status"></span><button type="button" class="slide-next">Next</button>';
      const meter = document.createElement('progress');
      meter.className = 'slide-meter';
      meter.max = this.panels.length;
      meter.setAttribute('aria-label', 'Presentation progress');
      this.meter = meter;
      this.prepend(meter);
      this.append(this.controls);
      this.back = this.controls.querySelector('.slide-back');
      this.next = this.controls.querySelector('.slide-next');
      this.position = this.controls.querySelector('.slide-position');
      this.back.onclick = () => this.showSlide(this.index - 1, true);
      this.next.onclick = () => this.showSlide(this.index + 1, true);
      this.addEventListener('keydown', event => {
        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey ||
            event.target.closest('input,textarea,select,button,a,summary,[contenteditable]')) return;
        if (['ArrowLeft','ArrowRight'].includes(event.key)) {
          event.preventDefault();
          this.showSlide(this.index + (event.key === 'ArrowRight' ? 1 : -1), true);
        }
      });
      this.addEventListener('click', event => {
        const link = event.target.closest('[data-review-slide]');
        if (link) this.showSlide(Number(link.dataset.reviewSlide) - 1, true);
      });
      this.setAttribute('role','region');
      if (!this.hasAttribute('aria-label')) this.setAttribute('aria-label','Lesson slides');
      let index = Number(this.dataset.start) || 0;
      if (this.dataset.resume) {
        try {
          const stored = sessionStorage.getItem('fcs.slides.' + this.dataset.resume);
          const saved = stored === null ? -1 : Number(stored);
          if (Number.isInteger(saved) && saved >= 0 && saved < this.panels.length) index = saved;
        } catch { /* Browsers can disable storage. Navigation still works. */ }
      }
      this.showSlide(index, false);
      this.dataset.ready = 'true';
    });
  }

  showSlide(index, focus) {
    if (!Number.isInteger(index) || index < 0 || index >= this.panels.length) return;
    this.index = index;
    this.panels.forEach((panel, i) => { panel.hidden = i !== index; });
    const panel = this.panels[index];
    const last = index === this.panels.length - 1;
    this.back.disabled = index === 0;
    this.next.hidden = last;
    this.next.textContent = this.panels[index+1]?.hasAttribute('data-check') ? 'Start questions' : 'Next slide';
    this.position.textContent = panel.hasAttribute('data-check') ? 'End-of-lesson questions' : 'Slide ' + (index + 1) + ' of ' + (this.panels.at(-1).hasAttribute('data-check') ? this.panels.length - 1 : this.panels.length);
    this.meter.value = index + 1;
    this.dispatchEvent(new CustomEvent('slidechange', {bubbles:true, detail:{panel}}));
    if (this.dataset.resume) {
      try { sessionStorage.setItem('fcs.slides.' + this.dataset.resume, String(index)); } catch { /* Optional. */ }
    }
    if (focus) {
      const heading = panel.querySelector('h1,h2,h3,legend') || panel;
      heading.tabIndex = -1;
      heading.focus({preventScroll:true});
      this.scrollIntoView({block:'start',behavior:'instant'});
    }
  }
}
if (!customElements.get('fcs-slide-deck')) customElements.define('fcs-slide-deck', LessonDeck);

function enableQuiz(form) {
  const groups = Array.from(form.querySelectorAll('fieldset'));
  const result = form.querySelector('[data-score]');
  const key = 'fcs.slide-quiz.v1.' + form.dataset.quiz;
  const save = submitted => {
    const answers = groups.map(group => group.querySelector(':checked')?.value ?? null);
    try { localStorage.setItem(key,JSON.stringify({answers,submitted,passed:submitted && groups.every(group=>group.querySelector(':checked')?.dataset.right === 'yes')})); } catch { /* Optional. */ }
  };
  function grade() {
    let score = 0;
    groups.forEach(group => {
      const answer = group.querySelector(':checked');
      const correct = answer?.dataset.right === 'yes';
      if (correct) score++;
      const feedback = group.querySelector('[data-answer-feedback]');
      feedback.textContent = (correct ? 'Correct. ' : 'Review this one. ') + (answer?.dataset.feedback || '');
      feedback.className = correct ? 'slide-feedback good' : 'slide-feedback retry';
    });
    result.textContent = score + ' of ' + groups.length + ' correct. ' +
      (score === groups.length ? 'Lesson complete.' : 'Review the feedback, then try again.');
    form.querySelector('[data-finished]').hidden = score !== groups.length;
  }
  try {
    const saved = JSON.parse(localStorage.getItem(key) || 'null');
    if (Array.isArray(saved?.answers)) {
      groups.forEach((group,i) => {
        const input = Array.from(group.querySelectorAll('input')).find(option=>option.value === saved.answers[i]);
        if (input) input.checked = true;
      });
      if (saved.submitted && groups.every(group=>group.querySelector(':checked'))) grade();
    }
  } catch { /* The deck also works without a saved attempt. */ }
  form.addEventListener('change', () => {
    result.textContent = '';
    form.querySelector('[data-finished]').hidden = true;
    groups.forEach(group => {const output=group.querySelector('[data-answer-feedback]');output.textContent='';output.className='';});
    save(false);
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    grade(); save(true); result.focus();
  });
}
document.querySelectorAll('form[data-quiz]').forEach(enableQuiz);
