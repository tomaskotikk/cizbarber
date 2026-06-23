create extension if not exists "pgcrypto";

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  price_czk integer not null check (price_czk >= 0),
  duration_minutes integer not null check (duration_minutes > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.availability_slots (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  barber_name text not null default 'Cíž',
  is_available boolean not null default true,
  note text,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.availability_slots(id) on delete cascade,
  service_id uuid not null references public.services(id),
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  note text,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  created_at timestamptz not null default now(),
  unique (slot_id)
);

create index if not exists availability_slots_starts_at_idx on public.availability_slots(starts_at);
create index if not exists bookings_slot_id_idx on public.bookings(slot_id);

alter table public.services enable row level security;
alter table public.availability_slots enable row level security;
alter table public.bookings enable row level security;

drop policy if exists "Public can read active services" on public.services;
create policy "Public can read active services"
on public.services for select
using (is_active = true);

drop policy if exists "Public can read available future slots" on public.availability_slots;
create policy "Public can read available future slots"
on public.availability_slots for select
using (is_available = true and starts_at >= now());

drop policy if exists "Public can reserve a visible slot" on public.bookings;
create policy "Public can reserve a visible slot"
on public.bookings for insert
with check (
  exists (
    select 1
    from public.availability_slots
    where availability_slots.id = slot_id
      and availability_slots.is_available = true
      and availability_slots.starts_at >= now()
  )
);

drop policy if exists "Public can mark reserved slot unavailable" on public.availability_slots;
create policy "Public can mark reserved slot unavailable"
on public.availability_slots for update
using (is_available = true and starts_at >= now())
with check (is_available = false);

insert into public.services (name, description, price_czk, duration_minutes)
values
  ('Pánský střih', 'Konzultace, přesný střih nůžkami i strojkem, mytí a finální styling.', 600, 45),
  ('Vousy rituál', 'Tvarování vousů, kontury břitvou, teplý ručník a ošetření pokožky.', 450, 35),
  ('Střih + vousy', 'Kompletní servis pro vlasy i vousy s čistým finišem a stylingem.', 820, 75),
  ('Dětský střih', 'Střih pro mladší klienty s klidným tempem a jednoduchým stylingem.', 400, 35)
on conflict do nothing;

insert into public.availability_slots (starts_at, ends_at, barber_name, note)
values
  (now() + interval '1 day' + interval '10 hours', now() + interval '1 day' + interval '11 hours', 'Cíž', 'Seed termín'),
  (now() + interval '2 days' + interval '13 hours', now() + interval '2 days' + interval '14 hours', 'Cíž', 'Seed termín'),
  (now() + interval '3 days' + interval '15 hours', now() + interval '3 days' + interval '16 hours', 'Matěj', 'Seed termín')
on conflict do nothing;
