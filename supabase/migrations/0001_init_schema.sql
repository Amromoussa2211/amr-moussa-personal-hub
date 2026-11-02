-- ============================================================
-- Amr Moussa — Personal Tech Hub · Initial schema (Phase 2)
-- Supabase / PostgreSQL 15+
-- Principles:
--   * RLS enabled everywhere; only the service role (secret key)
--     writes workflow data. Public reads go through explicit views.
--   * Approvals bind (article, version, destination) and are
--     invalidated when a new version is created.
--   * Publishing is idempotent via publish_key uniqueness.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- taxonomy ----------

create table categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text not null default '',
  in_nav      boolean not null default false,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create table tags (
  id   uuid primary key default gen_random_uuid(),
  name text not null unique
);

-- ---------- articles ----------

create type article_status as enum (
  'IDEA', 'RESEARCHING', 'DRAFTING', 'TECHNICAL_REVIEW',
  'NEEDS_REVISION', 'READY_FOR_REVIEW', 'APPROVED',
  'PUBLISHED', 'REJECTED'
);

create type content_destination as enum ('website', 'linkedin', 'x');

create table articles (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  subtitle     text,
  description  text not null default '',
  category_id  uuid references categories(id) on delete set null,
  difficulty   text not null default 'Intermediate'
               check (difficulty in ('Beginner', 'Intermediate', 'Advanced')),
  status       article_status not null default 'IDEA',
  featured     boolean not null default false,
  scheduled_at timestamptz,
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  published_at timestamptz
);

create table article_versions (
  id          uuid primary key default gen_random_uuid(),
  article_id  uuid not null references articles(id) on delete cascade,
  version_no  int not null,
  body        text not null,
  created_by  text not null default 'system',
  created_at  timestamptz not null default now(),
  note        text,
  unique (article_id, version_no)
);

create index article_versions_article on article_versions (article_id, version_no desc);

/* Holds meta per version (immutable snapshots) */
create table version_meta (
  version_id uuid primary key references article_versions(id) on delete cascade,
  title      text,
  subtitle   text,
  seo_title  text,
  seo_description text,
  slug       text,
  tags       text[] not null default '{}',
  found      boolean not null default false
);

create table article_tags (
  article_id uuid not null references articles(id) on delete cascade,
  tag_id     uuid not null references tags(id) on delete cascade,
  primary key (article_id, tag_id)
);

-- ---------- approvals (destination-specific, version-bound) ----------

create table article_approvals (
  id            uuid primary key default gen_random_uuid(),
  article_id    uuid not null references articles(id) on delete cascade,
  version_id    uuid not null references article_versions(id) on delete cascade,
  destination   content_destination not null,
  approved      boolean not null default true,
  approved_by   uuid references auth.users(id) on delete set null,
  approved_at   timestamptz not null default now(),
  invalidated_at timestamptz,
  note          text,
  unique (version_id, destination)
);

create index approvals_article_dest on article_approvals (article_id, destination) where invalidated_at is null;

-- ---------- publishing ----------

create table publishing_jobs (
  id           uuid primary key default gen_random_uuid(),
  article_id   uuid not null references articles(id) on delete cascade,
  version_id   uuid not null references article_versions(id) on delete cascade,
  destination  content_destination not null,
  payload      jsonb not null default '{}',
  status       text not null default 'PENDING'
               check (status in ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED')),
  attempts     int not null default 0,
  max_attempts int not null default 3,
  publish_key  text not null unique,          -- idempotency key: hash(article+version+destination)
  error        text,
  created_at   timestamptz not null default now(),
  started_at   timestamptz,
  finished_at  timestamptz
);

create index publishing_jobs_pending on publishing_jobs (status, created_at) where status in ('PENDING','RUNNING');

create table published_posts (
  id            uuid primary key default gen_random_uuid(),
  article_id    uuid not null references articles(id) on delete cascade,
  version_id    uuid not null references article_versions(id) on delete cascade,
  destination   content_destination not null,
  platform      text not null check (platform in ('website', 'x', 'linkedin')),
  platform_post_id text,
  platform_url  text,
  manual        boolean not null default false,   -- copy-ready manual publishing
  created_at    timestamptz not null default now(),
  unique (version_id, destination)
);

create table publishing_logs (
  id         uuid primary key default gen_random_uuid(),
  job_id     uuid references publishing_jobs(id) on delete set null,
  article_id uuid,
  destination content_destination,
  level      text not null default 'info' check (level in ('info','warn','error')),
  message    text not null,
  context    jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- ---------- social accounts ----------

create table social_accounts (
  id              uuid primary key default gen_random_uuid(),
  platform        text not null unique check (platform in ('x', 'linkedin')),
  platform_user_id text,
  display_name    text,
  avatar_url      text,
  scopes          text[] not null default '{}',
  status          text not null default 'DISCONNECTED'
                  check (status in ('DISCONNECTED','CONNECTED','ERROR')),
  token_ciphertext bytea,                      -- encrypted OAuth token storage
  token_updated_at timestamptz,
  last_checked_at  timestamptz,
  last_error       text,
  created_at       timestamptz not null default now()
);

-- ---------- media ----------

create table media_assets (
  id         uuid primary key default gen_random_uuid(),
  filename   text not null,
  mime_type  text not null,
  kind       text not null default 'image' check (kind in ('image','diagram','chart','other')),
  alt_text   text,
  caption    text,
  size_bytes bigint,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create table article_images (
  article_id uuid not null references articles(id) on delete cascade,
  media_id   uuid not null references media_assets(id) on delete cascade,
  role       text not null default 'inline' check (role in ('cover','inline','diagram')),
  sort_order int not null default 0,
  primary key (article_id, media_id)
);

-- ---------- AI content factory ----------

create type idea_source as enum ('manual', 'strategy_agent', 'reader', 'other');

create table content_ideas (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text not null default '',
  category_id uuid references categories(id) on delete set null,
  source      idea_source not null default 'manual',
  score       int,                            -- strategist priority 1..100
  status      text not null default 'NEW' check (status in ('NEW','ACCEPTED','DISMISSED','CONVERTED')),
  article_id  uuid references articles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create table research_sources (
  id          uuid primary key default gen_random_uuid(),
  article_id  uuid references articles(id) on delete cascade,
  idea_id     uuid references content_ideas(id) on delete cascade,
  title       text not null,
  url         text,
  kind        text not null default 'doc' check (kind in ('doc','repo','blog','paper','experiment')),
  quote       text,
  notes       text,
  verified    boolean not null default false,
  created_at  timestamptz not null default now()
);

create type agent_kind as enum (
  'CONTENT_STRATEGIST', 'RESEARCH', 'WRITER', 'TECHNICAL_REVIEWER',
  'VISUAL', 'SEO_EDITOR', 'SOCIAL_EDITOR', 'CUSTOM'
);

create table agent_runs (
  id          uuid primary key default gen_random_uuid(),
  agent       agent_kind not null,
  article_id  uuid references articles(id) on delete set null,
  idea_id     uuid references content_ideas(id) on delete set null,
  trigger     text not null default 'manual' check (trigger in ('manual','scheduled','api')),
  status      text not null default 'RUNNING' check (status in ('RUNNING','SUCCEEDED','FAILED','CANCELLED')),
  provider    text not null default 'opencode',  -- who executed (opencode / local model / ...)
  model       text,
  prompt      text,
  error       text,
  started_at  timestamptz not null default now(),
  finished_at timestamptz
);

create table agent_outputs (
  id      uuid primary key default gen_random_uuid(),
  run_id  uuid not null references agent_runs(id) on delete cascade,
  kind    text not null check (kind in ('draft','research','review','image','seo','social','outline','list')),
  content jsonb not null,
  applied boolean not null default false,     -- whether a human merged it into an article version
  created_at timestamptz not null default now()
);

-- ---------- engagement (real data only) ----------

create table reader_profiles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  display_name text,
  initials    text,
  avatar_url  text,
  show_on_articles boolean not null default false,  -- explicit consent for avatar row
  created_at  timestamptz not null default now(),
  unique (user_id)
);

create table reader_events (
  id         uuid primary key default gen_random_uuid(),
  article_slug text not null,
  event_kind text not null check (event_kind in ('view','unique_view','bookmark','share','read_50','read_90','newsletter_click')),
  anonymous_id text,                          -- privacy: random uuid cookie/client id
  user_id    uuid references auth.users(id) on delete set null,
  referrer   text,
  country    text,
  device     text,
  created_at timestamptz not null default now()
);

create index reader_events_article on reader_events (article_slug, event_kind, created_at);

create table newsletter_subscribers (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  status      text not null default 'PENDING' check (status in ('PENDING','CONFIRMED','UNSUBSCRIBED')),
  consent_at  timestamptz,
  created_at  timestamptz not null default now()
);

-- ---------- misc ----------

create table projects (
  id          uuid primary key default gen_random_uuid(),
  repo_name   text not null unique,
  title       text not null,
  description text not null default '',
  tech_stack  text[] not null default '{}',
  repo_url    text not null,
  sections    jsonb not null default '{}',     -- {architecture, features, challenges, lessons}
  visible     boolean not null default true,
  sort_order  int not null default 0,
  updated_at  timestamptz not null default now()
);

create table site_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

create table audit_logs (
  id         uuid primary key default gen_random_uuid(),
  actor      text not null default 'system',   -- user id or 'ai:<agent>' or 'system'
  action     text not null,
  entity     text not null,
  entity_id  uuid,
  before     jsonb,
  after      jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_entity on audit_logs (entity, entity_id, created_at desc);

-- ---------- admin helpers ----------

create table admin_users (
  user_id   uuid primary key references auth.users(id) on delete cascade,
  role      text not null default 'admin' check (role in ('admin','editor')),
  created_at timestamptz not null default now()
);

-- ---------- updated_at triggers ----------

create or replace function touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger articles_touch before update on articles
for each row execute function touch_updated_at();
create trigger projects_touch before update on projects
for each row execute function touch_updated_at();

-- ---------- approval invalidation on new version ----------
-- A new version of an article invalidates any active approvals that
-- referenced an older version of the same article.

create or replace function invalidate_old_approvals() returns trigger as $$
begin
  update article_approvals
     set invalidated_at = now()
   where article_id = new.article_id
     and version_id <> new.id
     and invalidated_at is null;
  return new;
end;
$$ language plpgsql;

create trigger article_versions_invalidate on article_versions
after insert on article_versions
for each row execute function invalidate_old_approvals();

-- ---------- Row Level Security ----------
-- Workflow data is service-role only. Public reads happen via views or
-- the website build (service role). No anon/browser write access at all.

alter table categories              enable row level security;
alter table tags                    enable row level security;
alter table article_tags            enable row level security;
alter table articles                enable row level security;
alter table article_versions        enable row level security;
alter table version_meta            enable row level security;
alter table article_approvals       enable row level security;
alter table publishing_jobs         enable row level security;
alter table published_posts         enable row level security;
alter table publishing_logs         enable row level security;
alter table social_accounts         enable row level security;
alter table media_assets            enable row level security;
alter table article_images          enable row level security;
alter table content_ideas           enable row level security;
alter table research_sources        enable row level security;
alter table agent_runs              enable row level security;
alter table agent_outputs           enable row level security;
alter table reader_profiles         enable row level security;
alter table reader_events           enable row level security;
alter table newsletter_subscribers  enable row level security;
alter table projects                enable row level security;
alter table site_settings           enable row level security;
alter table audit_logs              enable row level security;
alter table admin_users             enable row level security;

-- RLS policies intentionally empty = deny all for anon/authenticated clients.
-- Service role (secret key, server-side only) bypasses RLS.
