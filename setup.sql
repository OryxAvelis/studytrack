-- StudyTrack schema for Supabase.
-- Run in the Supabase SQL Editor before configuring the client.

create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  subject text not null default '',
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  duration_minutes smallint not null check (duration_minutes between 1 and 720),
  reminder_minutes smallint check (reminder_minutes between 1 and 1440),
  created_at timestamptz not null default now()
);

alter table public.study_sessions
  add column if not exists reminder_minutes smallint;
alter table public.study_sessions
  add column if not exists legacy_id text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'study_sessions_reminder_check') then
    alter table public.study_sessions
      add constraint study_sessions_reminder_check check (reminder_minutes between 1 and 1440 or reminder_minutes is null);
  end if;
end $$;

create unique index if not exists study_sessions_user_legacy_id_idx
  on public.study_sessions (user_id, legacy_id);

create table if not exists public.study_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id uuid not null references public.study_sessions (id) on delete cascade,
  checkin_date date not null default current_date,
  session_duration_minutes smallint not null check (session_duration_minutes between 1 and 720),
  status text not null default 'full',
  extra_hours numeric(5, 2) not null default 0,
  checked_in_at timestamptz not null default now(),
  constraint one_checkin_per_session_per_day unique (user_id, session_id, checkin_date)
);

alter table public.study_checkins
  add column if not exists session_duration_minutes smallint,
  add column if not exists status text not null default 'full',
  add column if not exists extra_hours numeric(5, 2) not null default 0,
  add column if not exists legacy_id text;

create unique index if not exists study_checkins_user_legacy_id_idx
  on public.study_checkins (user_id, legacy_id);

update public.study_checkins c
set session_duration_minutes = s.duration_minutes
from public.study_sessions s
where c.session_id = s.id and c.session_duration_minutes is null;

alter table public.study_checkins
  alter column session_duration_minutes set default 60,
  alter column session_duration_minutes set not null;

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

create table if not exists public.study_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 100),
  due_date date not null,
  target_hours numeric(6, 2) not null default 0 check (target_hours between 0 and 10000),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists study_goals_user_due_idx
  on public.study_goals (user_id, due_date, created_at);

create table if not exists public.study_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  reminders_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.study_sessions enable row level security;
alter table public.study_checkins enable row level security;
alter table public.study_goals enable row level security;
alter table public.study_preferences enable row level security;

drop policy if exists "Users can manage their own study sessions" on public.study_sessions;
create policy "Users can manage their own study sessions"
  on public.study_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage their own study check-ins" on public.study_checkins;
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

drop policy if exists "Users can manage their own study goals" on public.study_goals;
create policy "Users can manage their own study goals"
  on public.study_goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage their own study preferences" on public.study_preferences;
create policy "Users can manage their own study preferences"
  on public.study_preferences for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
