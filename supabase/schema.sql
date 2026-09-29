create extension if not exists "pgcrypto";

create table if not exists public.members (
  id text primary key,
  full_name text not null,
  email text not null unique,
  phone text,
  plan text not null default 'Essential',
  status text not null default 'Active' check (status in ('Active', 'Expired', 'Inactive')),
  joined_at date not null default current_date,
  expires_at date,
  created_at timestamptz not null default now()
);

create table if not exists public.trainers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text unique,
  specialty text not null,
  members integer not null default 0,
  status text not null default 'Available',
  initials text,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  member_name text not null,
  description text not null,
  amount numeric(10, 2) not null check (amount >= 0),
  status text not null default 'Paid' check (status in ('Paid', 'Pending', 'Refunded')),
  paid_at date not null default current_date,
  method text not null default 'Card',
  created_at timestamptz not null default now()
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  member_name text not null,
  time text not null,
  type text not null default 'Check in',
  attended_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  duration text not null,
  assignments integer not null default 0,
  trainer text,
  created_at timestamptz not null default now()
);

alter table public.members enable row level security;
alter table public.trainers enable row level security;
alter table public.payments enable row level security;
alter table public.attendance enable row level security;
alter table public.workouts enable row level security;

-- Starter access is for local demos only. Replace it with authenticated policies before production.
do $$
declare
  table_name text;
begin
  foreach table_name in array array['members', 'trainers', 'payments', 'attendance', 'workouts'] loop
    execute format('drop policy if exists "demo access %s" on public.%I', table_name, table_name);
    execute format('create policy "demo access %s" on public.%I for all to anon using (true) with check (true)', table_name, table_name);
  end loop;
end $$;