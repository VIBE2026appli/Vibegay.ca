-- ============================================================
-- VIBE QBC 2026 – Schema, RLS, and seed migration
-- Apply via Supabase dashboard SQL editor or CLI:
--   supabase db push
-- ============================================================

-- ─── 1. Profiles & Roles ────────────────────────────────────
create type if not exists public.user_role as enum ('admin','co_admin','attendee');

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  role        public.user_role not null default 'attendee',
  display_name text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Users can read their own profile; admins/co_admins can read all
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_select_admin" on public.profiles
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin','co_admin')
    )
  );

-- Only admins may change roles
create policy "profiles_update_admin" on public.profiles
  for update using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles(id, email, display_name)
  values (new.id, new.email, split_part(new.email,'@',1))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── 2. Events ──────────────────────────────────────────────
create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  description text,
  location    text,
  starts_at   timestamptz,
  ends_at     timestamptz,
  published   boolean not null default false,
  created_by  uuid references auth.users(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.events enable row level security;

create policy "events_select_published" on public.events
  for select using (published = true);

create policy "events_select_admin" on public.events
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','co_admin'))
  );

create policy "events_insert_admin" on public.events
  for insert with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','co_admin'))
  );

create policy "events_update_admin" on public.events
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','co_admin'))
  );

-- Seed Vibe QBC 2026 event
insert into public.events(slug, name, description, location, starts_at, ends_at, published)
values (
  'vibe-qbc-2026',
  'Vibe QBC 2026',
  'Le grand rassemblement LGBTQ+ du Québec.',
  'Québec, QC',
  '2026-08-22 20:00:00-04',
  '2026-08-23 04:00:00-04',
  true
) on conflict (slug) do nothing;

-- ─── 3. Ticket inventory ────────────────────────────────────
create type if not exists public.ticket_status as enum ('available','reserved','issued','redeemed','cancelled');
create type if not exists public.ticket_type as enum ('standard','complimentary');

create table if not exists public.tickets (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references public.events(id) on delete cascade,
  ticket_type   public.ticket_type not null default 'standard',
  status        public.ticket_status not null default 'available',
  holder_id     uuid references auth.users(id),
  holder_email  text,
  holder_note   text,          -- reason/recipient note (comp tickets)
  issued_by     uuid references auth.users(id),
  issued_at     timestamptz,
  redeemed_at   timestamptz,
  cancelled_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- prevent duplicate active tickets for same user/event
  constraint unique_active_holder unique (event_id, holder_id, ticket_type)
);

alter table public.tickets enable row level security;

-- Attendees see only their own tickets
create policy "tickets_select_own" on public.tickets
  for select using (holder_id = auth.uid());

-- Admins/co_admins see all tickets
create policy "tickets_select_admin" on public.tickets
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','co_admin'))
  );

-- Only admin/co_admin may insert tickets
create policy "tickets_insert_admin" on public.tickets
  for insert with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','co_admin'))
  );

-- Only admin/co_admin may update ticket status
create policy "tickets_update_admin" on public.tickets
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','co_admin'))
  );

-- ─── 4. Complimentary-ticket allocation tracking ────────────
create table if not exists public.comp_allocation (
  event_id      uuid primary key references public.events(id) on delete cascade,
  total_alloc   int not null default 1000,
  issued_count  int not null default 0,
  updated_at    timestamptz not null default now()
);

alter table public.comp_allocation enable row level security;

create policy "comp_alloc_select_admin" on public.comp_allocation
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','co_admin'))
  );

create policy "comp_alloc_update_admin" on public.comp_allocation
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','co_admin'))
  );

-- Seed allocation for Vibe QBC 2026
insert into public.comp_allocation(event_id, total_alloc)
select id, 1000 from public.events where slug = 'vibe-qbc-2026'
on conflict (event_id) do nothing;

-- ─── 5. RPC: issue_comp_ticket (server-authoritative) ───────
-- Issues one complimentary ticket; enforces allocation limit.
-- Must be called by authenticated admin or co_admin.
-- NOTE: audit_log table is defined in section 6 below; PL/pgSQL
--       resolves names at execution time, so forward reference is safe.
--       However, to maintain clear dependency order the audit_log table
--       has been moved to section 5a immediately below.

-- ─── 5a. Audit log (must precede the RPC that references it) ─
create table if not exists public.audit_log (
  id          bigserial primary key,
  actor_id    uuid references auth.users(id),
  action      text not null,
  entity_type text,
  entity_id   uuid,
  detail      jsonb,
  created_at  timestamptz not null default now()
);

alter table public.audit_log enable row level security;

-- Only admins may read the audit log via the client SDK.
create policy "audit_select_admin" on public.audit_log
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Inserts are performed exclusively by security-definer RPCs, which
-- run as the database owner and therefore bypass RLS entirely.
-- No client-facing INSERT policy is created, preventing any authenticated
-- user from injecting spurious audit records directly.

-- ─── 5b. RPC ─────────────────────────────────────────────────
create or replace function public.issue_comp_ticket(
  p_event_id    uuid,
  p_holder_id   uuid,
  p_holder_email text,
  p_note        text default null
)
returns uuid language plpgsql security definer set search_path = public
as $$
declare
  v_caller_role public.user_role;
  v_alloc       record;
  v_ticket_id   uuid;
begin
  -- Authorization check
  select role into v_caller_role from public.profiles where id = auth.uid();
  if v_caller_role not in ('admin','co_admin') then
    raise exception 'FORBIDDEN: admin or co_admin required';
  end if;

  -- Lock and check allocation
  select * into v_alloc from public.comp_allocation
    where event_id = p_event_id for update;
  if not found then
    raise exception 'EVENT_NOT_FOUND';
  end if;
  if v_alloc.issued_count >= v_alloc.total_alloc then
    raise exception 'ALLOCATION_EXHAUSTED: all % complimentary tickets have been issued', v_alloc.total_alloc;
  end if;

  -- Insert ticket
  insert into public.tickets(
    event_id, ticket_type, status,
    holder_id, holder_email, holder_note,
    issued_by, issued_at
  ) values (
    p_event_id, 'complimentary', 'issued',
    p_holder_id, p_holder_email, p_note,
    auth.uid(), now()
  ) returning id into v_ticket_id;

  -- Increment counter
  update public.comp_allocation
    set issued_count = issued_count + 1, updated_at = now()
    where event_id = p_event_id;

  -- Audit log (bypasses RLS because this function runs as security definer)
  insert into public.audit_log(actor_id, action, entity_type, entity_id, detail)
  values (
    auth.uid(), 'issue_comp_ticket', 'ticket', v_ticket_id,
    jsonb_build_object(
      'holder_id', p_holder_id,
      'holder_email', p_holder_email,
      'note', p_note,
      'remaining', v_alloc.total_alloc - v_alloc.issued_count - 1
    )
  );

  return v_ticket_id;
end;
$$;

-- ─── 6. Updated_at triggers ─────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

do $$
declare t text;
begin
  foreach t in array array['profiles','events','tickets','comp_allocation']
  loop
    execute format(
      'drop trigger if exists set_updated_at on public.%I;
       create trigger set_updated_at before update on public.%I
         for each row execute procedure public.set_updated_at();',
      t, t
    );
  end loop;
end;
$$;
