'use strict';

const lessons = [...document.querySelectorAll('.lesson')];
const links = [...document.querySelectorAll('.lesson-nav a')];
const storageKey = 'littleblackbook.ai-basics.v1';
const start = document.querySelector('#start-course');
const progress = document.querySelector('#progress');
const finish = document.querySelector('#review');
const notice = document.querySelector('#notice');
const fields = lesson => [...lesson.querySelectorAll('input, textarea, select')];
const examples = {
  before: ['Write a handoff.', 'The AI has to guess who will read it and which details matter.'],
  after: [document.querySelector('#example-prompt').textContent, document.querySelector('#example-note').textContent]
};
const modelFeedback = {
  hr: ['policy', 'HR note', 'Check your organization’s approval and data settings before adding employee information.'],
  build: ['speed', 'Internal tool', 'Look for a way to run the prototype and test what happens when someone uses it.'],
  daily: ['schedule', 'Daily summary', 'Check that the workflow can run on schedule and reach the right source.'],
  idea: ['visual', 'Shared idea', 'Choose an interface where both people can follow the discussion and try another version.']
};

let saved = {};
function storageUnavailable() {
  document.querySelector('#storage-note').textContent = 'This browser can’t save progress. Keep this tab open while you work.';
}
try {
  saved = JSON.parse(localStorage.getItem(storageKey)) || {};
} catch {
  storageUnavailable();
}

const completed = new Set();
const drafts = {};
const emptyPreviews = {};
for (const lesson of lessons) {
  emptyPreviews[lesson.id] = lesson.querySelector('[data-output]').textContent;
  const answers = {};
  for (const field of fields(lesson)) {
    const value = saved.drafts?.[lesson.id]?.[field.name];
    if (typeof value === 'string') field.value = value;
    answers[field.name] = field.value;
  }
  drafts[lesson.id] = answers;
  if (Array.isArray(saved.completed) && saved.completed.includes(lesson.id) && fields(lesson).every(field => field.value.trim())) {
    completed.add(lesson.id);
  }
}
let current = lessons.find(lesson => lesson.id === saved.current)?.id || lessons[0].id;
function persist() {
  try {
    localStorage.setItem(storageKey, JSON.stringify({current, drafts, completed: [...completed]}));
  } catch {
    storageUnavailable();
  }
}
function renderPreview(lesson) {
  const data = Object.fromEntries(Object.entries(drafts[lesson.id]).map(([key,value]) => [key,value.trim()]));
  let lines;
  switch (lesson.id) {
    case 'prompts':
      lines = [data.audience && 'Audience: ' + data.audience, data.task && 'Task: ' + data.task, data.format && 'Format: ' + data.format];
      break;
    case 'projects':
      lines = [[data.folder,data.project].filter(Boolean).join(' / '), data.fileOne && '• ' + data.fileOne, data.fileTwo && '• ' + data.fileTwo];
      break;
    case 'bots':
      lines = [data.job && 'Purpose: ' + data.job, data.inputs && 'Inputs: ' + data.inputs, data.tone && 'Tone: ' + data.tone, data.rule && 'Rule: ' + data.rule];
      break;
    case 'models':
      lines = Object.entries(modelFeedback).map(([key,[priority,label,reason]]) => {
        if (!data[key]) return '';
        return label + (data[key] === priority ? ' — good first check. ' : ' — consider this priority. ') + reason;
      });
      if (data.reason) lines.push('My choice: ' + data.reason);
      break;
  }
  lesson.querySelector('[data-output]').textContent = lines.filter(Boolean).join('\n') || emptyPreviews[lesson.id];
}
function render() {
  const allDone = completed.size === lessons.length;
  for (const [index,lesson] of lessons.entries()) {
    lesson.hidden = lesson.id !== current;
    const link = links[index];
    const done = completed.has(lesson.id);
    if (!lesson.hidden) link.setAttribute('aria-current','step');
    else link.removeAttribute('aria-current');
    link.classList.toggle('done',done);
    link.querySelector('.step').textContent = done ? '✓' : String(index + 1);
    link.setAttribute('aria-label', 'Lesson ' + (index + 1) + ', ' + link.lastElementChild.textContent + (done ? ', completed' : ''));
    lesson.querySelector('button[type=submit]').textContent = done ? 'Review completed work' : 'Complete lesson';
  }
  const label = completed.size + ' of ' + lessons.length + ' complete';
  progress.value = completed.size;
  document.querySelector('#progress-label').textContent = label;
  const hasDraft = Object.values(drafts).some(values => Object.values(values).some(Boolean));
  start.textContent = 'Start the class';
  if (completed.size || hasDraft) start.textContent = 'Resume the class';
  if (allDone) start.textContent = 'Review my work';
  start.href = '#' + (allDone ? 'review' : current);
  finish.hidden = !allDone;
  document.querySelector('#review-actions').hidden = !allDone;
}

function openLesson(id, moveFocus) {
  const lesson = lessons.find(item => item.id === id);
  if (lesson) current = id;
  render();
  persist();
  const target = id === 'review' && !finish.hidden ? finish : lesson;
  if (moveFocus && target) {
    target.querySelector('h2').focus({preventScroll: true});
    target.scrollIntoView({block: 'start'});
  }
}
function navigate(id) {
  if (location.hash !== '#' + id) history.pushState(null, '', '#' + id);
  openLesson(id, true);
}
for (const link of [...links, start]) {
  link.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(link.hash.slice(1));
  });
}
window.addEventListener('hashchange', () => openLesson(location.hash.slice(1), false));
for (const [index,lesson] of lessons.entries()) {
  const form = lesson.querySelector('form');
  renderPreview(lesson);
  form.addEventListener('input', event => {
    const field = event.target;
    if (!field.name) return;
    field.setCustomValidity('');
    drafts[lesson.id][field.name] = field.value;
    completed.delete(lesson.id);
    renderPreview(lesson);
    render();
    persist();
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    for (const field of fields(lesson)) {
      field.setCustomValidity(field.value.trim() ? '' : 'Enter an answer before completing the lesson.');
    }
    if (!form.reportValidity()) return;
    const wasComplete = completed.has(lesson.id);
    completed.add(lesson.id);
    notice.textContent = 'Lesson ' + (index + 1) + ' complete. ' + completed.size + ' of 4 complete.';
    const ordered = [...lessons.slice(index + 1), ...lessons.slice(0,index)];
    const next = ordered.find(item => !completed.has(item.id));
    navigate(next ? next.id : 'review');
    if (wasComplete && !next) notice.textContent = 'All four lessons are complete.';
  });
}
for (const button of document.querySelectorAll('[data-version]')) {
  button.addEventListener('click', () => {
    const mode = button.dataset.version;
    const [prompt,note] = examples[mode];
    document.querySelector('.preview').dataset.mode = mode;
    document.querySelector('#example-prompt').textContent = prompt;
    document.querySelector('#example-note').textContent = note;
    for (const choice of document.querySelectorAll('[data-version]')) {
      choice.setAttribute('aria-pressed',String(choice === button));
    }
  });
}
document.querySelector('#print').addEventListener('click', () => window.print());
document.documentElement.classList.add('enhanced');
openLesson(location.hash.slice(1), false);
