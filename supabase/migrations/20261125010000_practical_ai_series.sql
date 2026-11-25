-- Widen the set of course identifiers. Historic progress and ownership stay on the same rows.
alter table public.student_class_progress
  drop constraint student_class_progress_course_slug_check,
  add constraint student_class_progress_course_series_check check (course_slug in (
    'lead-yourself', 'ai-honestly', 'ai-prompting', 'ai-spot-errors', 'ai-privacy-safety',
    'ai-basics', 'ai-brainstorming', 'ai-multiple', 'ai-building'
  ));
