create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  phone text,
  password_hash text not null,
  profile_image_url text,
  role text not null default 'barber' check (role in ('owner', 'barber')),
  can_invite boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.availability_slots
  add column if not exists barber_user_id uuid references public.users(id);

create index if not exists availability_slots_barber_user_id_idx
on public.availability_slots(barber_user_id);

alter table public.users enable row level security;

drop policy if exists "Public can read active barbers" on public.users;
create policy "Public can read active barbers"
on public.users for select
using (is_active = true);

update public.services
set is_active = false
where name in ('Pánský střih', 'Skin fade', 'Vousy rituál', 'Střih + vousy');

insert into public.services (name, description, price_czk, duration_minutes, is_active)
values
  ('Střih', 'Klasický pánský střih s konzultací, precizním zpracováním a finálním stylingem.', 550, 45, true),
  ('Vousy', 'Úprava a tvarování vousů, čisté kontury a závěrečná péče o pokožku.', 450, 35, true),
  ('Dětský střih', 'Střih pro mladší klienty v klidném tempu a s jednoduchým stylingem.', 400, 35, true),
  ('Střih + vousy Hot Towel', 'Kompletní servis vlasů a vousů včetně hot towel péče s napařkou.', 850, 75, true)
on conflict do nothing;

update public.services
set description = 'Klasický pánský střih s konzultací, precizním zpracováním a finálním stylingem.',
    price_czk = 550,
    duration_minutes = 45,
    is_active = true
where name = 'Střih';

update public.services
set description = 'Úprava a tvarování vousů, čisté kontury a závěrečná péče o pokožku.',
    price_czk = 450,
    duration_minutes = 35,
    is_active = true
where name = 'Vousy';

update public.services
set description = 'Střih pro mladší klienty v klidném tempu a s jednoduchým stylingem.',
    price_czk = 400,
    duration_minutes = 35,
    is_active = true
where name = 'Dětský střih';

update public.services
set description = 'Kompletní servis vlasů a vousů včetně hot towel péče s napařkou.',
    price_czk = 850,
    duration_minutes = 75,
    is_active = true
where name = 'Střih + vousy Hot Towel';
