/* A deck has ordinary HTML sections, so the lesson also works with scripts off. */
let deckCount = 0;
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
      if (this.closest('.classroom[data-subject="leadership"]')) {
        const exit = document.createElement('p');
        const link = document.createElement('a');
        link.href = '/learn/leadership#practice';
        link.textContent = 'Return to leadership lessons';
        exit.append(link);
        this.panels.at(-1).append(exit);
      }
      this.installOutline();
      const classroom = this.closest('.classroom');
      if (classroom) {
        const cover = classroom.querySelector('.lesson-cover');
        const player = classroom.querySelector('#lesson-player');
        const title = classroom.querySelector('.lesson-heading');
        const start = cover.querySelector('.start-lesson');
        const open = focus => {
          cover.hidden = true;
          title.hidden = false;
          player.hidden = false;
          this.showSlide(index, focus);
        };
        if (index > 0) start.textContent = 'Resume lesson';
        if (location.hash === '#lesson-player') open(false);
        else player.hidden = true;
        start.addEventListener('click', event => {
          event.preventDefault();
          open(true);
        });
      }
      this.showSlide(index, false);
      this.dataset.ready = 'true';
    });
  }

  installOutline() {
    const tools = document.createElement('div');
    tools.className = 'slide-tools';
    const label = document.createElement('span');
    this.stageLabel = label;
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.textContent = 'Lesson outline';
    const outline = document.createElement('nav');
    outline.className = 'slide-outline';
    outline.id = 'lesson-outline-' + (++deckCount);
    outline.setAttribute('aria-label', 'Lesson outline');
    toggle.setAttribute('aria-controls', outline.id);
    const expand = on => {
      outline.hidden = !on;
      toggle.setAttribute('aria-expanded', String(on));
    };
    expand(false);
    toggle.onclick = () => expand(outline.hidden);
    const list = document.createElement('ol');
    this.outlineButtons = this.panels.map((panel, i) => {
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = panel.querySelector('h1,h2,h3,legend')?.textContent || 'Slide ' + (i+1);
      button.onclick = () => { expand(false); this.showSlide(i,true); };
      li.append(button); list.append(li);
      return button;
    });
    outline.append(list);
    tools.append(label,toggle);
    this.meter.after(tools,outline);
  }

  showSlide(index, focus) {
    if (!Number.isInteger(index) || index < 0 || index >= this.panels.length) return;
    this.panels[this.index]?.querySelectorAll('video').forEach(video => video.pause());
    this.index = index;
    this.outlineButtons.forEach((button,i) => {
      if (i === index) button.setAttribute('aria-current','step');
      else button.removeAttribute('aria-current');
    });
    this.panels.forEach((panel, i) => { panel.hidden = i !== index; });
    const panel = this.panels[index];
    const last = index === this.panels.length - 1;
    this.back.disabled = index === 0;
    this.next.hidden = last;
    this.next.textContent = this.panels[index+1]?.hasAttribute('data-check') ? 'Start questions' : 'Next slide';
    this.position.textContent = panel.hasAttribute('data-check') ? 'End-of-lesson questions' : 'Slide ' + (index + 1) + ' of ' + (this.panels.at(-1).hasAttribute('data-check') ? this.panels.length - 1 : this.panels.length);
    this.stageLabel.textContent = panel.hasAttribute('data-check') ? 'Knowledge check' : 'Lesson presentation';
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
  const submit = form.querySelector('button[type=submit]');
  const progress = document.createElement('p');
  progress.className = 'quiz-progress';
  progress.setAttribute('role','status');
  form.prepend(progress);
  const pager = document.createElement('div');
  pager.className = 'quiz-pager';
  pager.innerHTML = '<button type="button" data-previous>Previous question</button><button type="button" data-forward>Next question</button>';
  submit.before(pager);
  const previous = pager.querySelector('[data-previous]');
  const next = pager.querySelector('[data-forward]');
  let question = 0;
  function showQuestion(index, focus = false) {
    question = index;
    progress.textContent = 'Question ' + (index+1) + ' of ' + groups.length;
    groups.forEach((group,i) => { group.hidden = i !== index; });
    previous.hidden = index === 0;
    next.hidden = index === groups.length-1;
    submit.hidden = !next.hidden;
    if (focus) {
      const legend = groups[index].querySelector('legend');
      legend.tabIndex = -1;
      legend.focus();
    }
  }
  previous.onclick = () => showQuestion(question-1,true);
  next.onclick = () => {
    const field = groups[question].querySelector('input');
    if (field.reportValidity()) showQuestion(question+1,true);
  };
  showQuestion(0);
  const key = 'fcs.slide-quiz.v1.' + form.dataset.quiz;
  const save = submitted => {
    const answers = groups.map(group => group.querySelector(':checked')?.value ?? null);
    try { localStorage.setItem(key,JSON.stringify({answers,submitted,passed:submitted && groups.every(group=>group.querySelector(':checked')?.dataset.right === 'yes')})); } catch { /* Optional. */ }
  };
  function grade() {
    pager.hidden = true;
    progress.textContent = 'Your answers';
    groups.forEach(group => {group.hidden = false;});
    submit.hidden = false;
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
      const firstEmpty = groups.findIndex(group=>!group.querySelector(':checked'));
      if (saved.submitted && firstEmpty < 0) grade();
      else showQuestion(firstEmpty < 0 ? groups.length-1 : firstEmpty);
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
    const missing = groups.findIndex(group=>!group.querySelector(':checked'));
    if (missing >= 0) {
      pager.hidden = false;
      showQuestion(missing,true);
      groups[missing].querySelector('input').reportValidity();
      return;
    }
    grade(); save(true); result.focus();
  });
}
document.querySelectorAll('form[data-quiz]').forEach(enableQuiz);
