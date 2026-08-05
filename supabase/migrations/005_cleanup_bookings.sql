-- Phase 6: Drop old transitional columns and promote *_new columns to canonical names.
-- Run AFTER all backend code has been updated to use the new schema.

BEGIN;

-- 1. Drop old text slug columns first (names conflict with the *_new columns we're about to rename)
ALTER TABLE bookings
  DROP COLUMN IF EXISTS service_id,
  DROP COLUMN IF EXISTS barber_id;

-- 2. Rename UUID FK columns to the clean, canonical names
ALTER TABLE bookings RENAME COLUMN service_id_new TO service_id;
ALTER TABLE bookings RENAME COLUMN barber_id_new  TO barber_id;

-- 3. Drop remaining legacy text columns (superseded by new schema)
ALTER TABLE bookings
  DROP COLUMN IF EXISTS customer_name,
  DROP COLUMN IF EXISTS phone,
  DROP COLUMN IF EXISTS service_name,
  DROP COLUMN IF EXISTS barber_name,
  DROP COLUMN IF EXISTS "date",
  DROP COLUMN IF EXISTS time_slot,
  DROP COLUMN IF EXISTS status;

COMMIT;
