-- All existing enrollments, grades and completion dates retain their course IDs.
alter table public.student_class_progress
  drop constraint student_class_progress_course_series_check,
  add constraint student_class_progress_catalog_check check (course_slug in (
    'lead-yourself', 'see-and-develop-people', 'set-the-stage', 'everyday-techniques', 'culture-overhaul',
    'ai-honestly', 'ai-prompting', 'ai-spot-errors', 'ai-privacy-safety',
    'ai-basics', 'ai-brainstorming', 'ai-multiple', 'ai-building'
  ));
