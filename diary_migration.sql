-- ╔══════════════════════════════════════════╗
-- ║  QuestLog — Diary Migration              ║
-- ║  Run in Supabase SQL Editor              ║
-- ╚══════════════════════════════════════════╝

-- Add tags column to logs table (if not exists)
alter table public.logs
  add column if not exists tags text default '';

-- Add replayed column (true if user has logged this game before)
alter table public.logs
  add column if not exists replayed boolean default false;

-- Diary view — logs grouped with profile info, ordered by date_played
create or replace view public.diary_entries as
select
  l.id,
  l.user_id,
  l.igdb_id,
  l.title,
  l.cover_url,
  l.platform,
  l.rating,
  l.review,
  l.tags,
  l.status,
  l.replayed,
  l.date_played,
  l.created_at,
  -- Month/year grouping key for frontend
  to_char(l.date_played, 'Month YYYY')   as month_label,
  to_char(l.date_played, 'YYYY-MM')      as month_key,
  to_char(l.date_played, 'DD')           as day,
  to_char(l.date_played, 'Mon')          as month_short,
  -- Profile info
  p.username,
  p.display_name
from public.logs l
join public.profiles p on p.id = l.user_id
order by l.date_played desc, l.created_at desc;

-- RLS: users can only see their own diary
drop policy if exists "Diary entries are private" on public.logs;
