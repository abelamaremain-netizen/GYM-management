-- ============================================================
-- GYM MANAGEMENT SYSTEM — DATABASE SCHEMA
-- ============================================================
-- Run this entire file in the Supabase SQL editor.
-- Tables: users, admin_sessions, member_profiles,
--         membership_freezes, membership_plans, member_memberships,
--         instructor_profiles, equipment, equipment_maintenance_logs,
--         notifications, audit_logs, configurations
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- 1. USERS
-- All system actors: super_admin, admin, instructor, member.
-- Only super_admin and admin have password_hash set.
-- ============================================================
create table if not exists public.users (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  email              text unique,
  phone              text,
  role               text not null check (role in ('super_admin', 'admin', 'instructor', 'member')),
  status             text not null default 'active' check (status in ('active', 'frozen', 'expired', 'deleted')),
  password_hash      text,                        -- null for instructor and member
  preferred_language text not null default 'en' check (preferred_language in ('en')),
  created_at         timestamptz not null default now(),
  deleted_at         timestamptz                  -- soft delete
);

-- ============================================================
-- 2. ADMIN SESSIONS
-- Tracks active login sessions for admin and super_admin.
-- ============================================================
create table if not exists public.admin_sessions (
  id         uuid primary key default gen_random_uuid(),
  admin_id   uuid not null references public.users (id) on delete cascade,
  token_hash text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz                          -- set on logout
);

-- ============================================================
-- 3. MEMBER PROFILES
-- Extended profile data for members. One row per member.
-- ============================================================
create table if not exists public.member_profiles (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null unique references public.users (id) on delete cascade,
  date_of_birth            date,
  gender                   text check (gender in ('male', 'female', 'other')),
  emergency_contact_name   text,
  emergency_contact_phone  text,
  health_notes             text,
  joined_at                date not null default current_date
);

-- ============================================================
-- 4. MEMBERSHIP FREEZES
-- History of all freezes per member. Multiple per member allowed.
-- Membership end_date is extended by frozen days on reactivation.
-- ============================================================
create table if not exists public.membership_freezes (
  id           uuid primary key default gen_random_uuid(),
  member_id    uuid not null references public.users (id) on delete cascade,
  freeze_start date not null,
  freeze_end   date not null,
  reason       text,
  created_by   uuid not null references public.users (id),
  created_at   timestamptz not null default now()
);

-- ============================================================
-- 5. MEMBERSHIP PLANS
-- Reusable plan definitions. Admin creates and manages these.
-- ============================================================
create table if not exists public.membership_plans (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  duration_days    integer not null check (duration_days > 0),
  original_price   numeric(10, 2) not null check (original_price >= 0),
  discount_amount  numeric(10, 2) not null default 0 check (discount_amount >= 0),
  final_price      numeric(10, 2) not null check (final_price >= 0),
  is_active        boolean not null default true,
  created_by       uuid not null references public.users (id),
  created_at       timestamptz not null default now()
);

-- ============================================================
-- 6. MEMBER MEMBERSHIPS
-- One record per membership period per member.
-- Plan details are snapshotted at assignment time.
-- ============================================================
create table if not exists public.member_memberships (
  id                  uuid primary key default gen_random_uuid(),
  member_id           uuid not null references public.users (id) on delete cascade,
  plan_id             uuid references public.membership_plans (id) on delete set null,
  -- snapshot of plan at time of assignment
  plan_name           text not null,
  plan_duration_days  integer not null,
  original_price      numeric(10, 2) not null,
  discount_amount     numeric(10, 2) not null default 0,
  final_price         numeric(10, 2) not null,
  -- dates
  start_date          date not null,
  end_date            date not null,              -- calculated: start_date + plan_duration_days
  grace_until         date,                       -- admin sets manually on expiry
  -- payment
  paid                boolean not null default false,
  paid_date           date,
  -- meta
  notes               text,
  created_by          uuid not null references public.users (id),
  created_at          timestamptz not null default now()
);

-- ============================================================
-- 7. INSTRUCTOR PROFILES
-- Extended profile data for instructors. One row per instructor.
-- ============================================================
create table if not exists public.instructor_profiles (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null unique references public.users (id) on delete cascade,
  specialization    text,
  hourly_rate       numeric(10, 2) check (hourly_rate >= 0),
  contract_type     text check (contract_type in ('full_time', 'part_time', 'freelance')),
  joined_staff_at   date
);

-- ============================================================
-- 8. EQUIPMENT
-- Gym equipment tracker. Category is a string controlled by
-- the configurations table (equipment_categories key).
-- ============================================================
create table if not exists public.equipment (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  category          text not null,
  serial_number     text,
  purchase_date     date,
  status            text not null default 'operational'
                      check (status in ('operational', 'needs_service', 'out_of_order', 'retired')),
  last_serviced     date,
  next_service_due  date,
  notes             text,
  created_by        uuid not null references public.users (id),
  created_at        timestamptz not null default now(),
  retired_at        timestamptz                  -- set on retirement (soft delete)
);

-- ============================================================
-- 9. EQUIPMENT MAINTENANCE LOGS
-- Every status change and service event for each equipment item.
-- ============================================================
create table if not exists public.equipment_maintenance_logs (
  id               uuid primary key default gen_random_uuid(),
  equipment_id     uuid not null references public.equipment (id) on delete cascade,
  action           text not null check (action in ('status_changed', 'serviced', 'retired', 'restored')),
  previous_status  text,
  new_status       text not null,
  notes            text,
  performed_by     uuid not null references public.users (id),
  performed_at     timestamptz not null default now()
);

-- ============================================================
-- 10. NOTIFICATIONS
-- In-system alerts generated for admins. Broadcast to all admins.
-- ============================================================
create table if not exists public.notifications (
  id            uuid primary key default gen_random_uuid(),
  type          text not null check (type in (
                  'membership_expiring',
                  'membership_expired',
                  'payment_overdue',
                  'freeze_ending',
                  'equipment_service_due',
                  'equipment_out_of_order'
                )),
  entity_type   text not null check (entity_type in ('member', 'equipment')),
  entity_id     uuid not null,
  message       text not null,
  status        text not null default 'active'
                  check (status in ('active', 'seen', 'dismissed', 'resolved')),
  generated_at  timestamptz not null default now(),
  seen_at       timestamptz,
  dismissed_by  uuid references public.users (id),
  dismissed_at  timestamptz,
  resolved_at   timestamptz
);

-- ============================================================
-- 11. AUDIT LOGS
-- Immutable record of every significant admin action.
-- ============================================================
create table if not exists public.audit_logs (
  id            uuid primary key default gen_random_uuid(),
  action        text not null,
  entity_type   text not null,
  entity_id     uuid,
  performed_by  uuid not null references public.users (id),
  old_value     jsonb,
  new_value     jsonb,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- 12. CONFIGURATIONS
-- All system-wide configurable values. No hardcoded thresholds.
-- ============================================================
create table if not exists public.configurations (
  id           uuid primary key default gen_random_uuid(),
  key          text not null unique,
  value        text not null,
  type         text not null check (type in ('integer', 'decimal', 'boolean', 'string')),
  label        text not null,
  description  text,
  group_name   text not null,
  updated_by   uuid references public.users (id),
  updated_at   timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_users_role          on public.users (role);
create index if not exists idx_users_status        on public.users (status);
create index if not exists idx_users_deleted_at    on public.users (deleted_at);

create index if not exists idx_member_memberships_member   on public.member_memberships (member_id);
create index if not exists idx_member_memberships_end_date on public.member_memberships (end_date);
create index if not exists idx_member_memberships_paid     on public.member_memberships (paid);

create index if not exists idx_membership_freezes_member   on public.membership_freezes (member_id);

create index if not exists idx_equipment_status            on public.equipment (status);
create index if not exists idx_equipment_category          on public.equipment (category);
create index if not exists idx_equipment_next_service_due  on public.equipment (next_service_due);

create index if not exists idx_notifications_status        on public.notifications (status);
create index if not exists idx_notifications_entity        on public.notifications (entity_type, entity_id);

create index if not exists idx_audit_logs_performed_by     on public.audit_logs (performed_by);
create index if not exists idx_audit_logs_entity           on public.audit_logs (entity_type, entity_id);

create index if not exists idx_admin_sessions_admin_id     on public.admin_sessions (admin_id);

-- ============================================================
-- SEED: DEFAULT CONFIGURATIONS
-- ============================================================
insert into public.configurations (key, value, type, label, description, group_name) values
  ('membership_expiry_warning_days',   '7',                                          'integer', 'Membership Expiry Warning (days)',    'Days before expiry to show warning on dashboard and generate notification', 'membership'),
  ('payment_due_warning_days',         '3',                                          'integer', 'Payment Due Warning (days)',          'Days before end date to flag unpaid memberships', 'membership'),
  ('freeze_max_days',                  '30',                                         'integer', 'Maximum Freeze Duration (days)',      'Maximum number of days a membership can be frozen', 'membership'),
  ('freeze_ending_warning_days',       '3',                                          'integer', 'Freeze Ending Warning (days)',        'Days before freeze end to generate notification', 'membership'),
  ('equipment_service_interval_days',  '30',                                         'integer', 'Equipment Service Interval (days)',   'Days between routine equipment services', 'equipment'),
  ('equipment_service_due_warning_days','7',                                         'integer', 'Equipment Service Due Warning (days)','Days before service due date to warn admin', 'equipment'),
  ('equipment_categories',             'Cardio,Free Weights,Machines,Accessories,Furniture', 'string', 'Equipment Categories', 'Comma-separated list of allowed equipment categories', 'equipment'),
  ('admin_session_duration_hours',     '8',                                          'integer', 'Admin Session Duration (hours)',      'How long an admin session stays valid', 'system'),
  ('currency_code',                    'ETB',                                        'string',  'Currency Code',                      'ISO 4217 currency code used throughout the system (e.g. ETB, USD, EUR)', 'system')
on conflict (key) do nothing;

-- ============================================================
-- ROW LEVEL SECURITY
-- All tables locked down. Access is via service role key only
-- from the Express backend. Anon key has no access.
-- ============================================================
alter table public.users                     enable row level security;
alter table public.admin_sessions            enable row level security;
alter table public.member_profiles           enable row level security;
alter table public.membership_freezes        enable row level security;
alter table public.membership_plans          enable row level security;
alter table public.member_memberships        enable row level security;
alter table public.instructor_profiles       enable row level security;
alter table public.equipment                 enable row level security;
alter table public.equipment_maintenance_logs enable row level security;
alter table public.notifications             enable row level security;
alter table public.audit_logs                enable row level security;
alter table public.configurations            enable row level security;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Revenue sum for a given month (used by dashboard)
create or replace function public.sum_revenue_this_month(month_start date)
returns table(sum numeric) language sql security definer as $$
  select coalesce(sum(final_price), 0) as sum
  from public.member_memberships
  where paid = true
    and paid_date >= month_start
    and paid_date < (month_start + interval '1 month')::date;
$$;

-- Revenue sum for a given year
create or replace function public.sum_revenue_this_year(year_start date)
returns table(sum numeric) language sql security definer as $$
  select coalesce(sum(final_price), 0) as sum
  from public.member_memberships
  where paid = true
    and paid_date >= year_start
    and paid_date < (year_start + interval '1 year')::date;
$$;

-- Outstanding (unpaid) amount
create or replace function public.sum_outstanding()
returns table(sum numeric) language sql security definer as $$
  select coalesce(sum(final_price), 0) as sum
  from public.member_memberships
  where paid = false;
$$;
