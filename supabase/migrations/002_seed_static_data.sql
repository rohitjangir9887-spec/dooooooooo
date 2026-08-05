-- Migration 002: Seed static reference and catalog data
-- Applied: 2026-06-30

insert into public.booking_statuses (id, label) values
  ('pending',   'Pending'),
  ('confirmed', 'Confirmed'),
  ('completed', 'Completed'),
  ('cancelled', 'Cancelled'),
  ('no_show',   'No Show');

insert into public.payment_statuses (id, label) values
  ('unpaid',   'Unpaid'),
  ('paid',     'Paid'),
  ('refunded', 'Refunded');

insert into public.payment_method_types (id, label) values
  ('card',    'Credit / Debit Card'),
  ('gcash',   'GCash'),
  ('cash',    'Cash'),
  ('counter', 'Pay at Counter');

insert into public.tag_colors (id, name, hex) values
  ('a1b2c3d4-0001-0000-0000-000000000001', 'Gold',  '#C9A84C'),
  ('a1b2c3d4-0001-0000-0000-000000000002', 'Teal',  '#56BFB5'),
  ('a1b2c3d4-0001-0000-0000-000000000003', 'Coral', '#E88C93'),
  ('a1b2c3d4-0001-0000-0000-000000000004', 'Blue',  '#5B9BD5');

insert into public.services (id, name, duration_min, price) values
  ('b2c3d4e5-0001-0000-0000-000000000001', 'Skin Fade',       45,  450),
  ('b2c3d4e5-0001-0000-0000-000000000002', 'Cut & Beard',     55,  550),
  ('b2c3d4e5-0001-0000-0000-000000000003', 'Classic Cut',     30,  350),
  ('b2c3d4e5-0001-0000-0000-000000000004', 'Hot Towel Shave', 40,  400),
  ('b2c3d4e5-0001-0000-0000-000000000005', 'Hair Color',      90, 1200),
  ('b2c3d4e5-0001-0000-0000-000000000006', 'Beard Sculpt',    25,  250);

insert into public.barbers (id, name, role, tag_color_id, is_active) values
  ('c3d4e5f6-0001-0000-0000-000000000001', 'Miguel Santos', 'Master Barber', 'a1b2c3d4-0001-0000-0000-000000000001', true),
  ('c3d4e5f6-0001-0000-0000-000000000002', 'Rafael Cruz',   'Senior Barber', 'a1b2c3d4-0001-0000-0000-000000000002', true),
  ('c3d4e5f6-0001-0000-0000-000000000003', 'Andres Lim',    'Barber',        'a1b2c3d4-0001-0000-0000-000000000003', true),
  ('c3d4e5f6-0001-0000-0000-000000000004', 'Joel Reyes',    'Barber',        'a1b2c3d4-0001-0000-0000-000000000004', false);

-- Miguel (Master): all services
insert into public.barber_services (barber_id, service_id) values
  ('c3d4e5f6-0001-0000-0000-000000000001', 'b2c3d4e5-0001-0000-0000-000000000001'),
  ('c3d4e5f6-0001-0000-0000-000000000001', 'b2c3d4e5-0001-0000-0000-000000000002'),
  ('c3d4e5f6-0001-0000-0000-000000000001', 'b2c3d4e5-0001-0000-0000-000000000003'),
  ('c3d4e5f6-0001-0000-0000-000000000001', 'b2c3d4e5-0001-0000-0000-000000000004'),
  ('c3d4e5f6-0001-0000-0000-000000000001', 'b2c3d4e5-0001-0000-0000-000000000005'),
  ('c3d4e5f6-0001-0000-0000-000000000001', 'b2c3d4e5-0001-0000-0000-000000000006');
-- Rafael (Senior): all except Hair Color
insert into public.barber_services (barber_id, service_id) values
  ('c3d4e5f6-0001-0000-0000-000000000002', 'b2c3d4e5-0001-0000-0000-000000000001'),
  ('c3d4e5f6-0001-0000-0000-000000000002', 'b2c3d4e5-0001-0000-0000-000000000002'),
  ('c3d4e5f6-0001-0000-0000-000000000002', 'b2c3d4e5-0001-0000-0000-000000000003'),
  ('c3d4e5f6-0001-0000-0000-000000000002', 'b2c3d4e5-0001-0000-0000-000000000004'),
  ('c3d4e5f6-0001-0000-0000-000000000002', 'b2c3d4e5-0001-0000-0000-000000000006');
-- Andres: Skin Fade, Classic Cut, Hot Towel, Beard Sculpt
insert into public.barber_services (barber_id, service_id) values
  ('c3d4e5f6-0001-0000-0000-000000000003', 'b2c3d4e5-0001-0000-0000-000000000001'),
  ('c3d4e5f6-0001-0000-0000-000000000003', 'b2c3d4e5-0001-0000-0000-000000000003'),
  ('c3d4e5f6-0001-0000-0000-000000000003', 'b2c3d4e5-0001-0000-0000-000000000004'),
  ('c3d4e5f6-0001-0000-0000-000000000003', 'b2c3d4e5-0001-0000-0000-000000000006');
-- Joel (inactive): Classic Cut, Hot Towel
insert into public.barber_services (barber_id, service_id) values
  ('c3d4e5f6-0001-0000-0000-000000000004', 'b2c3d4e5-0001-0000-0000-000000000003'),
  ('c3d4e5f6-0001-0000-0000-000000000004', 'b2c3d4e5-0001-0000-0000-000000000004');

-- Mon(0)–Sat(5): open 09:00–19:00, break 13:00–14:00; Sun(6): closed
do $$
declare
  b uuid;
  d smallint;
begin
  foreach b in array array[
    'c3d4e5f6-0001-0000-0000-000000000001'::uuid,
    'c3d4e5f6-0001-0000-0000-000000000002'::uuid,
    'c3d4e5f6-0001-0000-0000-000000000003'::uuid,
    'c3d4e5f6-0001-0000-0000-000000000004'::uuid
  ]
  loop
    for d in 0..5 loop
      insert into public.barber_working_hours
        (barber_id, day_of_week, is_open, open_time, close_time, break_start, break_end)
      values (b, d, true, '09:00', '19:00', '13:00', '14:00');
    end loop;
    insert into public.barber_working_hours
      (barber_id, day_of_week, is_open, open_time, close_time)
    values (b, 6, false, null, null);
  end loop;
end $$;

insert into public.shop_profile (id, shop_name, branch_name, phone, currency_code, currency_symbol)
values ('d4e5f6a7-0001-0000-0000-000000000001', 'Casa Barbero', 'Poblacion, Makati', '0917 555 0100', 'PHP', '₱');

insert into public.notification_settings (shop_id)
values ('d4e5f6a7-0001-0000-0000-000000000001');
