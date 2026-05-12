-- ============================================================
-- CompuClass Roadmap — Supabase Schema
-- Run this entire file in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- STREAMS (the 5 parallel workstreams)
-- ============================================================
create table public.streams (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  owner       text not null,
  color       text not null default '#6366f1',
  icon        text not null default 'layers',
  created_at  timestamptz default now()
);

-- ============================================================
-- SPRINTS
-- ============================================================
create table public.sprints (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  start_date  date not null,
  end_date    date not null,
  is_active   boolean default false,
  created_at  timestamptz default now()
);

-- ============================================================
-- TASKS
-- ============================================================
create table public.tasks (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  stream_id   uuid references public.streams(id) on delete cascade,
  sprint_id   uuid references public.sprints(id) on delete set null,
  status      text not null default 'todo' check (status in ('done','in_progress','todo')),
  priority    text not null default 'medium' check (priority in ('high','medium','low')),
  points      int default 0,
  month       int check (month between 1 and 4),
  notes       text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ============================================================
-- MILESTONES
-- ============================================================
create table public.milestones (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  target_date date not null,
  status      text not null default 'upcoming' check (status in ('done','active','upcoming')),
  created_at  timestamptz default now()
);

-- ============================================================
-- AUTO-UPDATE updated_at on tasks
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tasks_updated_at
  before update on public.tasks
  for each row execute function update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.streams    enable row level security;
alter table public.sprints    enable row level security;
alter table public.tasks      enable row level security;
alter table public.milestones enable row level security;

-- Authenticated users can read everything
create policy "auth read streams"    on public.streams    for select to authenticated using (true);
create policy "auth read sprints"    on public.sprints    for select to authenticated using (true);
create policy "auth read tasks"      on public.tasks      for select to authenticated using (true);
create policy "auth read milestones" on public.milestones for select to authenticated using (true);

-- Authenticated users can insert/update/delete
create policy "auth write streams"    on public.streams    for all to authenticated using (true) with check (true);
create policy "auth write sprints"    on public.sprints    for all to authenticated using (true) with check (true);
create policy "auth write tasks"      on public.tasks      for all to authenticated using (true) with check (true);
create policy "auth write milestones" on public.milestones for all to authenticated using (true) with check (true);

-- ============================================================
-- SEED DATA — CompuClass Channel Zero Team
-- ============================================================

-- Streams
insert into public.streams (id, name, owner, color, icon) values
  ('11111111-0000-0000-0000-000000000001', 'UI Enhancement',    'Lutho Buyaphi',   '#6366f1', 'layout-dashboard'),
  ('11111111-0000-0000-0000-000000000002', 'Gamification',      'Thabo Kumalo',    '#f59e0b', 'trophy'),
  ('11111111-0000-0000-0000-000000000003', 'Chemistry Lab',     'Kamo (Kamohelo)', '#10b981', 'flask-conical'),
  ('11111111-0000-0000-0000-000000000004', 'Documentation',     'Mila (Emilia)',   '#f43f5e', 'file-text'),
  ('11111111-0000-0000-0000-000000000005', 'Support & QA',      'Lindo',           '#8b5cf6', 'shield-check');

-- Sprints
insert into public.sprints (id, name, start_date, end_date, is_active) values
  ('22222222-0000-0000-0000-000000000001', 'Sprint 1', '2025-03-16', '2025-04-15', false),
  ('22222222-0000-0000-0000-000000000002', 'Sprint 2', '2025-04-16', '2025-05-31', true),
  ('22222222-0000-0000-0000-000000000003', 'Sprint 3', '2025-06-01', '2025-07-15', false),
  ('22222222-0000-0000-0000-000000000004', 'Sprint 4', '2025-07-16', '2025-09-30', false);

-- Milestones
insert into public.milestones (name, target_date, status) values
  ('M1 End Review',      '2025-04-15', 'done'),
  ('M2 Progress Review', '2025-05-31', 'active'),
  ('M3 Feature Complete','2025-08-15', 'upcoming'),
  ('M4 Final Delivery',  '2025-09-30', 'upcoming');

-- Tasks — Stream 1: UI Enhancement
insert into public.tasks (title, stream_id, sprint_id, status, priority, points, month) values
  ('UX audit of current application',         '11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 'done',        'high',   3, 1),
  ('Design enhancement roadmap & style guide','11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 'done',        'high',   2, 1),
  ('Dashboard wireframes & redesign planning', '11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 'done',        'high',   3, 1),
  ('Dashboard layout & navigation implemented','11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000002', 'done',        'high',   5, 2),
  ('Component library — buttons, cards, forms','11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000002', 'in_progress', 'medium', 3, 2),
  ('Responsive design for all screen sizes',  '11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000002', 'todo',        'high',   5, 2),
  ('PC Lab & AR Lab screen visual updates',   '11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000003', 'todo',        'medium', 3, 3),
  ('Accessibility — contrast & keyboard nav', '11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000003', 'todo',        'medium', 3, 3),
  ('Screen-by-screen UI polish',              '11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000004', 'todo',        'medium', 3, 4),
  ('Final UI testing & refinement',           '11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000004', 'todo',        'high',   2, 4);

-- Tasks — Stream 2: Gamification
insert into public.tasks (title, stream_id, sprint_id, status, priority, points, month) values
  ('Gamification system architecture design', '11111111-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000001', 'done',        'high',   3, 1),
  ('Quiz difficulty levels design & logic',   '11111111-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000001', 'done',        'high',   3, 1),
  ('Points and scoring system design',        '11111111-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000001', 'done',        'high',   5, 1),
  ('XP accumulation & point multipliers',     '11111111-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000002', 'done',        'high',   5, 2),
  ('Badge system — 20+ types built',          '11111111-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000002', 'done',        'high',   5, 2),
  ('Leaderboard screen',                      '11111111-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000002', 'todo',        'medium', 5, 2),
  ('Streak counter & daily motivation',       '11111111-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000002', 'todo',        'medium', 3, 2),
  ('Celebratory animations on correct answers','11111111-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000003', 'todo',        'low',    2, 3),
  ('Social & friend leaderboard',             '11111111-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000003', 'todo',        'medium', 3, 3),
  ('Weekly/monthly challenge system',         '11111111-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000004', 'todo',        'medium', 3, 4);

-- Tasks — Stream 3: Chemistry Lab
insert into public.tasks (title, stream_id, sprint_id, status, priority, points, month) values
  ('Chemistry lab planning & experiment specs','11111111-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000002', 'todo',        'high',   3, 2),
  ('3D molecular model sourcing',             '11111111-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000002', 'todo',        'high',   5, 2),
  ('3D models integrated into platform',      '11111111-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000002', 'todo',        'high',   8, 2),
  ('Virtual experiment & reaction system',    '11111111-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000003', 'todo',        'high',   8, 3),
  ('Real-time chemistry reaction visualisation','11111111-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000003', 'todo',        'medium', 5, 3),
  ('Chemistry lab screens implementation',    '11111111-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000003', 'todo',        'high',   5, 3),
  ('Chemistry lab assessment quizzes',        '11111111-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000004', 'todo',        'medium', 3, 4),
  ('Chemistry content library & testing',     '11111111-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000004', 'todo',        'medium', 3, 4);

-- Tasks — Stream 4: Documentation
insert into public.tasks (title, stream_id, sprint_id, status, priority, points, month) values
  ('System architecture UML diagram',         '11111111-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000001', 'done',        'high',   5, 1),
  ('Class diagram for core components',       '11111111-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000001', 'done',        'high',   3, 1),
  ('Documentation plan & requirements',       '11111111-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000001', 'done',        'high',   3, 1),
  ('Sequence diagrams — quiz & AR flows',     '11111111-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000002', 'done',        'high',   3, 2),
  ('ERD & database schema documentation',     '11111111-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000002', 'done',        'high',   3, 2),
  ('Business model documentation',            '11111111-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000002', 'in_progress', 'high',   3, 2),
  ('API endpoint documentation',              '11111111-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000002', 'todo',        'medium', 3, 2),
  ('Stakeholder use case documentation',      '11111111-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000003', 'todo',        'medium', 3, 3),
  ('User manual & how-to guides',             '11111111-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000003', 'todo',        'medium', 3, 3),
  ('Final project presentation',              '11111111-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000004', 'todo',        'high',   5, 4);

-- Tasks — Stream 5: Support & QA
insert into public.tasks (title, stream_id, sprint_id, status, priority, points, month) values
  ('Git branching strategy & repo setup',     '11111111-0000-0000-0000-000000000005', '22222222-0000-0000-0000-000000000001', 'done',        'high',   3, 1),
  ('Weekly team standups established',        '11111111-0000-0000-0000-000000000005', '22222222-0000-0000-0000-000000000001', 'done',        'high',   2, 1),
  ('Integration testing — Sprint 2 features', '11111111-0000-0000-0000-000000000005', '22222222-0000-0000-0000-000000000002', 'todo',        'high',   5, 2),
  ('Bug tracking set up & in use',            '11111111-0000-0000-0000-000000000005', '22222222-0000-0000-0000-000000000002', 'todo',        'high',   3, 2),
  ('End-to-end application testing',          '11111111-0000-0000-0000-000000000005', '22222222-0000-0000-0000-000000000003', 'todo',        'high',   5, 3),
  ('Build & deployment guide',               '11111111-0000-0000-0000-000000000005', '22222222-0000-0000-0000-000000000003', 'todo',        'medium', 3, 3),
  ('Final QA & delivery handover',            '11111111-0000-0000-0000-000000000005', '22222222-0000-0000-0000-000000000004', 'todo',        'high',   5, 4);
