-- Migration 001: Create all new reference and feature tables
-- Applied: 2026-06-30

create table public.booking_statuses (
  id    text primary key,
  label text not null
);

create table public.payment_statuses (
  id    text primary key,
  label text not null
);

create table public.payment_method_types (
  id    text primary key,
  label text not null
);

create table public.tag_colors (
  id   uuid primary key default gen_random_uuid(),
  name text not null,
  hex  text not null
);

create table public.services (
  id           uuid primary key default gen_random_uuid(),
  name         text    not null,
  duration_min integer not null,
  price        integer not null,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

create table public.barbers (
  id           uuid primary key default gen_random_uuid(),
  name         text    not null,
  role         text    not null default 'Barber',
  tag_color_id uuid    references public.tag_colors(id) on delete set null,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

create table public.barber_services (
  barber_id  uuid references public.barbers(id)  on delete cascade,
  service_id uuid references public.services(id) on delete cascade,
  primary key (barber_id, service_id)
);

create table public.barber_working_hours (
  id          uuid primary key default gen_random_uuid(),
  barber_id   uuid references public.barbers(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6), -- 0=Mon .. 6=Sun
  is_open     boolean  not null default true,
  open_time   time,
  close_time  time,
  break_start time,
  break_end   time,
  unique (barber_id, day_of_week)
);

create table public.blocked_dates (
  id           uuid primary key default gen_random_uuid(),
  barber_id    uuid references public.barbers(id) on delete cascade,
  blocked_date date not null,
  is_all_day   boolean not null default true,
  start_time   time,
  end_time     time,
  reason       text not null,
  notes        text,
  created_at   timestamptz not null default now()
);

create table public.transactions (
  id             uuid primary key default gen_random_uuid(),
  booking_id     uuid references public.bookings(id) on delete set null,
  payment_method text references public.payment_method_types(id),
  amount         integer not null,
  processed_at   timestamptz not null default now(),
  receipt_url    text,
  note           text,
  created_at     timestamptz not null default now()
);

create table public.shop_profile (
  id                  uuid primary key default gen_random_uuid(),
  shop_name           text not null,
  branch_name         text,
  phone               text not null,
  email               text,
  address             text,
  currency_code       text not null default 'PHP',
  currency_symbol     text not null default '₱',
  google_calendar_id  text,
  updated_at          timestamptz not null default now()
);

create table public.notification_settings (
  id                   uuid primary key default gen_random_uuid(),
  shop_id              uuid unique references public.shop_profile(id) on delete cascade,
  notify_new_booking   boolean not null default true,
  notify_cancellation  boolean not null default true,
  notify_reschedule    boolean not null default true,
  notify_reminder      boolean not null default true,
  updated_at           timestamptz not null default now()
);

create table public.admin_users (
  id         uuid primary key,
  email      text not null unique,
  name       text not null,
  role       text not null default 'staff' check (role in ('owner', 'admin', 'staff')),
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.calendar_sync_log (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid references public.bookings(id) on delete set null,
  event_type  text not null check (event_type in ('booking', 'reschedule', 'cancellation', 'reminder')),
  description text not null,
  success     boolean not null,
  synced_at   timestamptz not null default now()
);

create index idx_barber_services_barber  on public.barber_services(barber_id);
create index idx_barber_services_service on public.barber_services(service_id);
create index idx_blocked_dates_barber    on public.blocked_dates(barber_id, blocked_date);
create index idx_transactions_booking    on public.transactions(booking_id);
create index idx_sync_log_booking        on public.calendar_sync_log(booking_id);
