-- Persistent, moderated community content for the sponsor expo city board.
-- The public product reads and writes through backend-server only; direct client access stays closed.

create extension if not exists pgcrypto;

create table if not exists public.expo_community_entries (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('message', 'advert', 'voice')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'removed')),
  title text not null check (char_length(title) between 1 and 48),
  body text not null check (char_length(body) between 1 and 240),
  author_label text not null check (char_length(author_label) between 1 and 48),
  created_by uuid references auth.users(id) on delete set null,
  moderated_by uuid references auth.users(id) on delete set null,
  moderated_at timestamptz,
  audio_content_type text check (
    audio_content_type is null
    or audio_content_type in ('audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg')
  ),
  audio_bytes_base64 text check (
    audio_bytes_base64 is null
    or char_length(audio_bytes_base64) <= 1100000
  ),
  expires_at timestamptz,
  report_count integer not null default 0 check (report_count >= 0),
  reported_at timestamptz,
  removal_reason text check (removal_reason is null or char_length(removal_reason) <= 160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint expo_community_voice_has_audio check (
    kind <> 'voice'
    or (audio_content_type is not null and audio_bytes_base64 is not null)
  )
);

create table if not exists public.expo_community_graffiti (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'removed')),
  mark_text text not null default '' check (char_length(mark_text) <= 12),
  color text not null default '#22d3ee' check (color ~ '^#[0-9a-fA-F]{6}$'),
  logo_url text,
  wall_slot integer not null default 0 check (wall_slot between 0 and 47),
  placement_x numeric(8, 3),
  placement_y numeric(8, 3),
  placement_z numeric(8, 3),
  placement_rotation_y numeric(7, 4),
  placement_normal_x numeric(6, 4),
  placement_normal_y numeric(6, 4),
  placement_normal_z numeric(6, 4),
  placement_host_id text check (placement_host_id is null or char_length(placement_host_id) <= 80),
  placement_surface_label text check (placement_surface_label is null or char_length(placement_surface_label) <= 32),
  author_label text not null check (char_length(author_label) between 1 and 48),
  created_by uuid references auth.users(id) on delete set null,
  moderated_by uuid references auth.users(id) on delete set null,
  moderated_at timestamptz,
  expires_at timestamptz,
  report_count integer not null default 0 check (report_count >= 0),
  reported_at timestamptz,
  removal_reason text check (removal_reason is null or char_length(removal_reason) <= 160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint expo_community_graffiti_has_mark check (
    char_length(mark_text) > 0
    or logo_url is not null
  )
);

alter table public.expo_community_graffiti
  add column if not exists placement_x numeric(8, 3),
  add column if not exists placement_y numeric(8, 3),
  add column if not exists placement_z numeric(8, 3),
  add column if not exists placement_rotation_y numeric(7, 4),
  add column if not exists placement_normal_x numeric(6, 4),
  add column if not exists placement_normal_y numeric(6, 4),
  add column if not exists placement_normal_z numeric(6, 4),
  add column if not exists placement_host_id text,
  add column if not exists placement_surface_label text;

create table if not exists public.expo_community_reports (
  id uuid primary key default gen_random_uuid(),
  item_type text not null check (item_type in ('entry', 'graffiti')),
  item_id uuid not null,
  reason text not null check (reason in ('other', 'spam', 'unsafe', 'wrong-place')),
  detail text check (detail is null or char_length(detail) <= 160),
  reporter_id uuid references auth.users(id) on delete set null,
  reporter_label text not null check (char_length(reporter_label) between 1 and 48),
  created_at timestamptz not null default now()
);

create table if not exists public.expo_community_audit_events (
  id uuid primary key default gen_random_uuid(),
  item_type text not null check (item_type in ('entry', 'graffiti')),
  item_id uuid not null,
  action text not null check (action in ('created', 'reported', 'approved', 'rejected', 'removed')),
  actor_label text not null check (char_length(actor_label) between 1 and 64),
  note text check (note is null or char_length(note) <= 160),
  created_at timestamptz not null default now()
);

create index if not exists expo_community_entries_status_created_at_idx
  on public.expo_community_entries (status, created_at desc);

create index if not exists expo_community_entries_created_by_created_at_idx
  on public.expo_community_entries (created_by, created_at desc);

create index if not exists expo_community_graffiti_status_created_at_idx
  on public.expo_community_graffiti (status, created_at desc);

create index if not exists expo_community_graffiti_created_by_created_at_idx
  on public.expo_community_graffiti (created_by, created_at desc);

create index if not exists expo_community_entries_expires_at_idx
  on public.expo_community_entries (expires_at);

create index if not exists expo_community_graffiti_expires_at_idx
  on public.expo_community_graffiti (expires_at);

create index if not exists expo_community_reports_item_idx
  on public.expo_community_reports (item_type, item_id, created_at desc);

create index if not exists expo_community_audit_events_item_idx
  on public.expo_community_audit_events (item_type, item_id, created_at desc);

alter table public.expo_community_entries enable row level security;
alter table public.expo_community_graffiti enable row level security;
alter table public.expo_community_reports enable row level security;
alter table public.expo_community_audit_events enable row level security;

revoke all on table public.expo_community_entries from anon, authenticated;
revoke all on table public.expo_community_graffiti from anon, authenticated;
revoke all on table public.expo_community_reports from anon, authenticated;
revoke all on table public.expo_community_audit_events from anon, authenticated;

grant select, insert, update, delete on table public.expo_community_entries to service_role;
grant select, insert, update, delete on table public.expo_community_graffiti to service_role;
grant select, insert, update, delete on table public.expo_community_reports to service_role;
grant select, insert, update, delete on table public.expo_community_audit_events to service_role;
