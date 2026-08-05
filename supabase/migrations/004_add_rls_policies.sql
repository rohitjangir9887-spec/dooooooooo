-- Migration 004: RLS policies for all new tables
-- Applied: 2026-06-30
-- Service role (used by admin backend) bypasses RLS by default in Supabase.
-- Anon key (used by client frontend) is restricted to public-read only.

alter table public.booking_statuses      enable row level security;
alter table public.payment_statuses      enable row level security;
alter table public.payment_method_types  enable row level security;
alter table public.tag_colors            enable row level security;
alter table public.services              enable row level security;
alter table public.barbers               enable row level security;
alter table public.barber_services       enable row level security;
alter table public.barber_working_hours  enable row level security;
alter table public.blocked_dates         enable row level security;
alter table public.transactions          enable row level security;
alter table public.shop_profile          enable row level security;
alter table public.notification_settings enable row level security;
alter table public.admin_users           enable row level security;
alter table public.calendar_sync_log     enable row level security;

-- Public read (client booking UI needs these to build the booking form)
create policy "public_read_booking_statuses"     on public.booking_statuses     for select using (true);
create policy "public_read_payment_statuses"     on public.payment_statuses     for select using (true);
create policy "public_read_payment_method_types" on public.payment_method_types for select using (true);
create policy "public_read_tag_colors"           on public.tag_colors           for select using (true);
create policy "public_read_services"             on public.services             for select using (true);
create policy "public_read_barbers"              on public.barbers              for select using (is_active = true);
create policy "public_read_barber_services"      on public.barber_services      for select using (true);
create policy "public_read_barber_working_hours" on public.barber_working_hours for select using (true);
create policy "public_read_blocked_dates"        on public.blocked_dates        for select using (true);
create policy "public_read_shop_profile"         on public.shop_profile         for select using (true);

-- Service role full access (admin backend uses SUPABASE_SERVICE_ROLE_KEY)
create policy "admin_all_services"              on public.services             for all using (auth.role() = 'service_role');
create policy "admin_all_barbers"               on public.barbers              for all using (auth.role() = 'service_role');
create policy "admin_all_barber_services"       on public.barber_services      for all using (auth.role() = 'service_role');
create policy "admin_all_barber_working_hours"  on public.barber_working_hours for all using (auth.role() = 'service_role');
create policy "admin_all_blocked_dates"         on public.blocked_dates        for all using (auth.role() = 'service_role');
create policy "admin_all_transactions"          on public.transactions         for all using (auth.role() = 'service_role');
create policy "admin_all_shop_profile"          on public.shop_profile         for all using (auth.role() = 'service_role');
create policy "admin_all_notification_settings" on public.notification_settings for all using (auth.role() = 'service_role');
create policy "admin_all_admin_users"           on public.admin_users          for all using (auth.role() = 'service_role');
create policy "admin_all_calendar_sync_log"     on public.calendar_sync_log    for all using (auth.role() = 'service_role');
create policy "admin_all_payment_logs"          on public.payment_logs         for all using (auth.role() = 'service_role');
create policy "admin_all_bookings"              on public.bookings             for all using (auth.role() = 'service_role');
