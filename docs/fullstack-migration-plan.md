# Casa Barbero — Full-Stack Migration Plan

## Overview

Replace all in-memory mock data (`casaData.js` + `store.js`) with live Supabase data.
Both the client booking site and the admin dashboard will hit the same Supabase project.

---

## Phase 1 — Database Schema

Tables are listed in creation order (dependencies first).

---

### 1. `tag_colors`
Reusable color palette for barber avatars.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, gen_random_uuid() |
| name | text | e.g. "Gold" |
| hex | text | e.g. "#C9A84C" |

---

### 2. `services`
Barbershop service catalog.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| name | text | NOT NULL |
| duration_min | integer | NOT NULL |
| price | integer | PHP whole pesos, NOT NULL |
| is_active | boolean | default true |
| created_at | timestamptz | default now() |

---

### 3. `barbers`
Staff roster.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| name | text | NOT NULL |
| role | text | e.g. "Master Barber" |
| tag_color_id | uuid | FK → tag_colors |
| is_active | boolean | default true |
| created_at | timestamptz | default now() |

---

### 4. `barber_services` (junction)
Which services each barber performs.

| Column | Type | Notes |
|--------|------|-------|
| barber_id | uuid | FK → barbers ON DELETE CASCADE |
| service_id | uuid | FK → services ON DELETE CASCADE |
| PRIMARY KEY | (barber_id, service_id) | |

---

### 5. `barber_working_hours`
Per-barber, per-day schedule. 7 rows per barber.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| barber_id | uuid | FK → barbers ON DELETE CASCADE |
| day_of_week | smallint | 0=Mon, 1=Tue ... 6=Sun |
| is_open | boolean | default true |
| open_time | time | nullable when is_open=false |
| close_time | time | nullable when is_open=false |
| break_start | time | nullable |
| break_end | time | nullable |
| UNIQUE | (barber_id, day_of_week) | |

---

### 6. `blocked_dates`
Barber unavailability (day off, event, training).

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| barber_id | uuid | FK → barbers ON DELETE CASCADE |
| blocked_date | date | NOT NULL |
| is_all_day | boolean | default true |
| start_time | time | nullable |
| end_time | time | nullable |
| reason | text | NOT NULL |
| notes | text | nullable |
| created_at | timestamptz | default now() |

---

### 7. `booking_statuses` (lookup)
Text primary key — no int IDs for lookup tables.

| id | label |
|----|-------|
| pending | Pending |
| confirmed | Confirmed |
| completed | Completed |
| cancelled | Cancelled |
| no_show | No Show |

---

### 8. `payment_statuses` (lookup)

| id | label |
|----|-------|
| unpaid | Unpaid |
| paid | Paid |
| refunded | Refunded |

---

### 9. `payment_method_types` (lookup)

| id | label |
|----|-------|
| card | Credit / Debit Card |
| gcash | GCash |
| cash | Cash |
| counter | Pay at Counter |

---

### 10. `bookings` — REPLACE existing table

Current table has `status` mixing booking state and payment state. New schema separates them.

**Changes from current:**
- `date` (date) + `time_slot` (text) → `booked_at` (timestamptz) — single clean field
- `service_id` (text slug) → uuid FK → services
- `barber_id` (text slug) → uuid FK → barbers
- `status` ('pending'/'paid') → split into `booking_status` + `payment_status`
- `customer_name` → `client_name` (consistent naming)

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| service_id | uuid | FK → services |
| barber_id | uuid | FK → barbers |
| client_name | text | NOT NULL |
| client_phone | text | NOT NULL |
| client_email | text | nullable |
| booked_at | timestamptz | NOT NULL — appointment date+time |
| duration_min | integer | locked at booking time |
| amount | integer | PHP pesos charged |
| booking_status | text | FK → booking_statuses, default 'pending' |
| payment_status | text | FK → payment_statuses, default 'unpaid' |
| payment_method | text | FK → payment_method_types, nullable |
| notes | text | nullable |
| google_event_id | text | nullable |
| created_at | timestamptz | default now() |

**Index:** `(barber_id, booked_at)` for slot conflict checks.

---

### 11. `payment_logs` — keep, minor update
Already in Supabase. Add `payment_method` column for counter payments.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| booking_id | uuid | FK → bookings ON DELETE CASCADE |
| paymongo_payment_id | text | nullable (null for counter/cash) |
| paymongo_intent_id | text | nullable |
| payment_method | text | FK → payment_method_types, nullable |
| status | text | CHECK ('pending','paid','failed') |
| amount | integer | |
| created_at | timestamptz | |

---

### 12. `transactions`
A confirmed payment record. Created when payment is confirmed (card/GCash/cash).

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| booking_id | uuid | FK → bookings |
| payment_method | text | FK → payment_method_types |
| amount | integer | PHP pesos |
| processed_at | timestamptz | when confirmed |
| receipt_url | text | nullable — for GCash screenshot / card receipt |
| note | text | nullable |
| created_at | timestamptz | default now() |

---

### 13. `shop_profile` (single row)
Replaces the user's `Owner_Account` + `currency` tables. Holds all shop config.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| shop_name | text | NOT NULL |
| branch_name | text | nullable |
| phone | text | NOT NULL |
| email | text | nullable |
| address | text | nullable |
| currency_code | text | default 'PHP' |
| currency_symbol | text | default '₱' |
| google_calendar_id | text | nullable |
| updated_at | timestamptz | |

---

### 14. `notification_settings`
Per-shop notification toggles. FK to shop_profile, one row per shop.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| shop_id | uuid | FK → shop_profile UNIQUE |
| notify_new_booking | boolean | default true |
| notify_cancellation | boolean | default true |
| notify_reschedule | boolean | default true |
| notify_reminder | boolean | default true |
| updated_at | timestamptz | |

---

### 15. `admin_users`
Links to Supabase Auth (`auth.users`). Replaces hardcoded session credentials.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK — same as auth.users.id |
| email | text | UNIQUE |
| name | text | NOT NULL |
| role | text | CHECK ('owner', 'admin', 'staff') |
| is_active | boolean | default true |
| created_at | timestamptz | |

---

### 16. `calendar_sync_log`
Replaces the mock `syncLog` array. Append-only log.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| booking_id | uuid | FK → bookings nullable |
| event_type | text | CHECK ('booking','reschedule','cancellation','reminder') |
| description | text | |
| success | boolean | |
| synced_at | timestamptz | default now() |

---

## Design Decisions (vs. your original ideas)

| Your idea | Decision | Why |
|-----------|----------|-----|
| `barber.services` as array | Junction table `barber_services` | Queryable, indexable, avoids array parsing |
| `barber.working_hours` embedded | Separate `barber_working_hours` table | Proper normalization, easy per-day queries |
| `Block_date` table | `blocked_dates` (same concept) | Minor rename for consistency |
| `payment` as lookup table | Split into `payment_statuses` + `payment_method_types` | Status and method are different concepts |
| `transaction_history` + "paid through where" | `transactions.payment_method` FK → lookup | Named column with proper reference |
| `Owner_Account` + `currency` | `shop_profile` with currency columns | Avoids an extra join for a single-row config |
| `settings` table | `notification_settings` | Renamed for clarity; settings is too generic |
| Separate `currency` table | Currency columns on `shop_profile` | Single currency per shop — no need for a table |
| Booking `date_time (timestamptz)` | `booked_at timestamptz` | Same concept, clearer name |
| Single `status` on booking | `booking_status` + `payment_status` | They are independent states — a booking can be confirmed but unpaid (counter pay) |

---

## Phase 2 — Seed Data

Static seed to run once after creating tables:

1. `tag_colors` — Gold, Teal, Coral, Blue
2. `services` — 6 services from casaData.js
3. `barbers` — 4 barbers from casaData.js (with tag_color_id)
4. `barber_services` — all barbers offer all services initially
5. `barber_working_hours` — Mon–Sat 09:00–19:00, break 13:00–14:00, Sun closed
6. Lookup rows for `booking_statuses`, `payment_statuses`, `payment_method_types`
7. `shop_profile` — Casa Barbero, Poblacion Makati
8. `notification_settings` — all true by default

---

## Phase 3 — Admin Backend (casa-barbero-admin)

Replace `data/store.js` in-memory functions with Supabase queries. One route at a time:

| Route file | Change |
|------------|--------|
| `barbers.routes.js` | Query `barbers` JOIN `tag_colors`, `barber_working_hours` |
| `bookings.routes.js` | Query `bookings` JOIN `services`, `barbers` |
| `payments.routes.js` | Query `transactions` JOIN `bookings`, `barbers` |
| `availability.routes.js` | Query `blocked_dates`, `barber_working_hours` |
| `dashboard.routes.js` | Aggregate queries on `bookings`, `transactions` |
| `auth.routes.js` | Replace session auth with Supabase Auth JWT |
| `system.routes.js` | Query `shop_profile`, `notification_settings`, `calendar_sync_log` |

---

## Phase 4 — Client Backend (casa-barbero/backend)

Minimal changes — mainly field name updates:

| Current | New |
|---------|-----|
| `date` + `time_slot` (text) | `booked_at` (ISO timestamptz string) |
| `service_id` (slug like "skin-fade") | uuid from services table |
| `barber_id` (slug like "john") | uuid from barbers table |
| `status: 'pending'/'paid'` | `booking_status` + `payment_status` separately |

Slot conflict check: query `booked_at` range instead of `date` + `time_slot` parsing.

---

## Phase 5 — RLS Policies

| Table | Anon read | Anon write | Admin |
|-------|-----------|------------|-------|
| services | YES | NO | full access |
| barbers | YES | NO | full access |
| barber_working_hours | YES | NO | full access |
| blocked_dates | YES | NO | full access |
| bookings | own row only (by booking id) | INSERT only | full access |
| payment_logs | NO | NO | full access |
| transactions | NO | NO | full access |
| shop_profile | YES | NO | full access |
| admin_users | NO | NO | owner only |
| calendar_sync_log | NO | NO | full access |

---

## Implementation Order

1. Run Phase 1 SQL migrations in Supabase dashboard (new tables first, then ALTER bookings)
2. Run Phase 2 seed script
3. Update Phase 4 (client backend) — smallest change, keep site working
4. Run Phase 3 admin backend route by route — test each before the next
5. Update admin frontend pages to use live API instead of mock data
6. Set up RLS policies (Phase 5)
7. Test end-to-end: client books → admin sees it → payment confirms → transaction logged

---

## What This Does NOT Include (future scope)

- Customer accounts / login (bookings are currently guest/anonymous)
- SMS / email notifications (Twilio, Resend)
- Multi-branch support
- Discount / promo codes
