-- Editorial metadata and slide text live in the versioned course catalog.
create table public.student_class_progress (
    user_id uuid not null references auth.users(id) on delete cascade,
    course_slug text not null check (course_slug in ('lead-yourself','ai-honestly')),
    last_slide_key text not null default 's01' check (last_slide_key ~ '^s[0-9]{2}$'),
    enrolled_at timestamptz not null default now(),
    enrolled_free boolean not null default true,
    completed_at timestamptz,
    end_quiz_score smallint check (end_quiz_score between 0 and 5),
    worksheet_completed_at timestamptz,
    primary key (user_id, course_slug),
    check (completed_at is null or coalesce(end_quiz_score,0) >= 4)
);
alter table public.student_class_progress enable row level security;
revoke all on public.student_class_progress from public, anon, authenticated;
grant select on public.student_class_progress to authenticated;
grant select, insert, update, delete on public.student_class_progress to service_role;
create policy student_reads_own_class_progress on public.student_class_progress
    for select to authenticated using ((select auth.uid()) = user_id);

-- Server-graded results can only be written by the authenticated application's server.
-- Each event changes its own columns. A later failed retry cannot erase a pass.
create function public.fcs_save_class_progress(
    learner uuid, course text, event text, slide_key text default null, score integer default null
) returns public.student_class_progress
language plpgsql security invoker set search_path = '' as $$
declare saved public.student_class_progress;
begin
    if event = 'start' then
        insert into public.student_class_progress (user_id,course_slug) values (learner,course)
        on conflict (user_id,course_slug) do nothing;
    elsif event = 'slide' then
        update public.student_class_progress set last_slide_key = slide_key
        where user_id=learner and course_slug=course;
    elsif event = 'worksheet' then
        update public.student_class_progress set worksheet_completed_at=coalesce(worksheet_completed_at,now())
        where user_id=learner and course_slug=course;
    elsif event = 'quiz' and score between 0 and 5 then
        update public.student_class_progress set end_quiz_score=greatest(end_quiz_score,score),
          completed_at=case when score >= 4 then coalesce(completed_at,now()) else completed_at end
        where user_id=learner and course_slug=course;
    else
        raise exception 'Unknown progress event';
    end if;
    select * into strict saved from public.student_class_progress where user_id=learner and course_slug=course;
    return saved;
end;
$$;
revoke all on function public.fcs_save_class_progress(uuid,text,text,text,integer) from public,anon,authenticated;
grant execute on function public.fcs_save_class_progress(uuid,text,text,text,integer) to service_role;
