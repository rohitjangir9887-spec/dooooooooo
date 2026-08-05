-- Migration 003: Alter bookings + payment_logs for new schema
-- Applied: 2026-06-30
-- NOTE: Old columns (customer_name, phone, date, time_slot, service_id text, barber_id text, status)
-- are kept during transition. Drop them in migration 005 after backend is updated.

alter table public.bookings
  add column if not exists booked_at       timestamptz,
  add column if not exists service_id_new  uuid references public.services(id) on delete restrict,
  add column if not exists barber_id_new   uuid references public.barbers(id)  on delete restrict,
  add column if not exists booking_status  text references public.booking_statuses(id),
  add column if not exists payment_status  text references public.payment_statuses(id),
  add column if not exists payment_method  text references public.payment_method_types(id),
  add column if not exists client_name     text,
  add column if not exists client_phone    text,
  add column if not exists client_email    text,
  add column if not exists notes           text;

update public.bookings
set booked_at = (("date" + time_slot::time) at time zone 'Asia/Manila')
where "date" is not null and time_slot is not null;

update public.bookings
set client_name  = customer_name,
    client_phone = phone;

update public.bookings set
  booking_status = case status
    when 'paid'      then 'confirmed'
    when 'cancelled' then 'cancelled'
    else 'pending'
  end,
  payment_status = case status
    when 'paid' then 'paid'
    else 'unpaid'
  end
where status is not null;

create index if not exists idx_bookings_barber_booked_at
  on public.bookings (barber_id_new, booked_at);

alter table public.payment_logs
  add column if not exists payment_method text references public.payment_method_types(id);
