-- ============================================================================
-- Folio Circle Book Club Micro-Frontend — Supabase Schema & Security Policies
-- Run this migration in your Supabase SQL Editor or via `supabase db push`.
-- ============================================================================

create extension if not exists "pgcrypto";

-- 1. Reader Profiles (synced with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  handle text unique not null,
  avatar_color text not null default '#1E3A8A',
  bio text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Book Clubs
create table if not exists public.book_clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text not null default '',
  invite_code text unique not null default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  visibility text not null default 'public' check (visibility in ('public', 'private')),
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Club Memberships (RBAC: host, moderator, member)
create table if not exists public.club_members (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.book_clubs(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('host', 'moderator', 'member')),
  joined_at timestamptz not null default now(),
  unique (club_id, user_id)
);

-- 4. Club Titles / Books
create table if not exists public.club_books (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.book_clubs(id) on delete cascade,
  external_library_book_id text, -- Maps to parent Library Shell catalog ID
  title text not null,
  author text not null,
  total_chapters integer not null check (total_chapters > 0),
  total_pages integer not null check (total_pages > 0),
  cover_url text,
  synopsis text default '',
  status text not null default 'current' check (status in ('current', 'upcoming', 'completed')),
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- 5. Chapter-Based Discussions
create table if not exists public.chapter_discussions (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.book_clubs(id) on delete cascade,
  book_id uuid not null references public.club_books(id) on delete cascade,
  chapter_number integer not null check (chapter_number >= 1),
  chapter_title text not null default '',
  title text not null,
  opening_prompt text not null default '',
  is_spoiler_guarded boolean not null default true,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. Real-Time Discussion Messages
create table if not exists public.discussion_messages (
  id uuid primary key default gen_random_uuid(),
  discussion_id uuid not null references public.chapter_discussions(id) on delete cascade,
  club_id uuid not null references public.book_clubs(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0),
  quote_excerpt text,
  page_reference integer check (page_reference is null or page_reference > 0),
  reply_to_id uuid references public.discussion_messages(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 7. Collective Reading Progress Logs
create table if not exists public.reading_logs (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.book_clubs(id) on delete cascade,
  book_id uuid not null references public.club_books(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  current_chapter integer not null default 1 check (current_chapter >= 0),
  current_page integer not null default 0 check (current_page >= 0),
  percent_complete numeric(5, 2) not null default 0 check (percent_complete >= 0 and percent_complete <= 100),
  status text not null default 'reading' check (status in ('not_started', 'reading', 'caught_up', 'finished')),
  notes text default '',
  updated_at timestamptz not null default now(),
  unique (club_id, book_id, user_id)
);

-- Indexes for fast workspace loading
create index if not exists idx_club_members_user on public.club_members(user_id);
create index if not exists idx_club_books_club on public.club_books(club_id);
create index if not exists idx_discussions_book_chapter on public.chapter_discussions(book_id, chapter_number);
create index if not exists idx_messages_discussion_created on public.discussion_messages(discussion_id, created_at);
create index if not exists idx_reading_logs_club_book on public.reading_logs(club_id, book_id);

-- Automatic updated_at maintenance
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_clubs_updated_at on public.book_clubs;
create trigger trg_clubs_updated_at before update on public.book_clubs
  for each row execute function public.set_updated_at();

drop trigger if exists trg_discussions_updated_at on public.chapter_discussions;
create trigger trg_discussions_updated_at before update on public.chapter_discussions
  for each row execute function public.set_updated_at();

drop trigger if exists trg_reading_logs_updated_at on public.reading_logs;
create trigger trg_reading_logs_updated_at before update on public.reading_logs
  for each row execute function public.set_updated_at();

-- Auto-create profile when a user signs up via Supabase Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  base_name text;
  base_handle text;
begin
  base_name := coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1), 'Reader');
  base_handle := lower(regexp_replace(base_name, '[^a-zA-Z0-9]+', '_', 'g')) || '_' || substr(new.id::text, 1, 4);

  insert into public.profiles (id, display_name, handle)
  values (new.id, base_name, base_handle)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Helper function to check club membership securely in RLS
create or replace function public.is_club_member(target_club_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.club_members
    where club_id = target_club_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_club_host(target_club_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.club_members
    where club_id = target_club_id and user_id = auth.uid() and role in ('host', 'moderator')
  );
$$;

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.book_clubs enable row level security;
alter table public.club_members enable row level security;
alter table public.club_books enable row level security;
alter table public.chapter_discussions enable row level security;
alter table public.discussion_messages enable row level security;
alter table public.reading_logs enable row level security;

-- Profiles: readable by authenticated users; editable only by owner
create policy "Profiles readable by authenticated users"
  on public.profiles for select to authenticated using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert to authenticated with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Book Clubs: public clubs readable by authenticated users, private clubs by members
create policy "Clubs readable when public or member"
  on public.book_clubs for select to authenticated
  using (visibility = 'public' or public.is_club_member(id) or created_by = auth.uid());

create policy "Authenticated users can create clubs"
  on public.book_clubs for insert to authenticated
  with check (auth.uid() = created_by);

create policy "Club hosts can update clubs"
  on public.book_clubs for update to authenticated
  using (public.is_club_host(id)) with check (public.is_club_host(id));

-- Club Members
create policy "Members can view club roster"
  on public.club_members for select to authenticated
  using (public.is_club_member(club_id));

create policy "Users can join clubs as member or host on creation"
  on public.club_members for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can leave clubs or hosts can remove"
  on public.club_members for delete to authenticated
  using (auth.uid() = user_id or public.is_club_host(club_id));

-- Club Books
create policy "Members can view club books"
  on public.club_books for select to authenticated
  using (public.is_club_member(club_id));

create policy "Members can add books to their club"
  on public.club_books for insert to authenticated
  with check (public.is_club_member(club_id) and auth.uid() = created_by);

create policy "Hosts can update club books"
  on public.club_books for update to authenticated
  using (public.is_club_host(club_id));

-- Chapter Discussions
create policy "Members can view chapter discussions"
  on public.chapter_discussions for select to authenticated
  using (public.is_club_member(club_id));

create policy "Members can create chapter discussions"
  on public.chapter_discussions for insert to authenticated
  with check (public.is_club_member(club_id) and auth.uid() = created_by);

-- Discussion Messages
create policy "Members can view chapter messages"
  on public.discussion_messages for select to authenticated
  using (public.is_club_member(club_id));

create policy "Members can post messages to club discussions"
  on public.discussion_messages for insert to authenticated
  with check (public.is_club_member(club_id) and auth.uid() = user_id);

create policy "Authors can delete their own messages"
  on public.discussion_messages for delete to authenticated
  using (auth.uid() = user_id or public.is_club_host(club_id));

-- Reading Logs
create policy "Members can view collective reading logs"
  on public.reading_logs for select to authenticated
  using (public.is_club_member(club_id));

create policy "Users can insert their own reading log"
  on public.reading_logs for insert to authenticated
  with check (public.is_club_member(club_id) and auth.uid() = user_id);

create policy "Users can update their own reading log"
  on public.reading_logs for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================================
-- Enable Supabase Realtime CDC for live chapter chat & collective progress
-- ============================================================================
alter publication supabase_realtime add table public.chapter_discussions;
alter publication supabase_realtime add table public.discussion_messages;
alter publication supabase_realtime add table public.reading_logs;
alter publication supabase_realtime add table public.club_members;
