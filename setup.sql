-- StudyTrack schema for Supabase.
-- Run this in the Supabase SQL Editor. The browser-only starter app does not
-- connect to this schema; configure Supabase Auth before using a hosted client.

create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  subject text not null default '',
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  duration_minutes smallint not null check (duration_minutes between 1 and 720),
  created_at timestamptz not null default now()
);

create table if not exists public.study_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id uuid not null references public.study_sessions (id) on delete cascade,
  checkin_date date not null default current_date,
  status text not null default 'full',
  extra_hours numeric(5, 2) not null default 0,
  checked_in_at timestamptz not null default now(),
  constraint one_checkin_per_session_per_day unique (user_id, session_id, checkin_date)
);

alter table public.study_checkins
  add column if not exists status text not null default 'full',
  add column if not exists extra_hours numeric(5, 2) not null default 0;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'study_checkins_status_check') then
    alter table public.study_checkins
      add constraint study_checkins_status_check check (status in ('full', 'half', 'absent'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'study_checkins_extra_hours_check') then
    alter table public.study_checkins
      add constraint study_checkins_extra_hours_check check (extra_hours between 0 and 24);
  end if;
end $$;

create index if not exists study_sessions_user_weekday_idx
  on public.study_sessions (user_id, weekday, start_time);
create index if not exists study_checkins_user_date_idx
  on public.study_checkins (user_id, checkin_date desc);

alter table public.study_sessions enable row level security;
alter table public.study_checkins enable row level security;

create policy "Users can manage their own study sessions"
  on public.study_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage their own study check-ins"
  on public.study_checkins for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.study_sessions
      where study_sessions.id = study_checkins.session_id
        and study_sessions.user_id = auth.uid()
    )
  );
