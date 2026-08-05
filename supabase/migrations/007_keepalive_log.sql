-- Tracks the last ping from the GitHub Actions keepalive workflow, which stops
-- the free-tier Supabase project from auto-pausing after a week of inactivity.
-- Singleton row (like shop_profile/google_oauth_tokens) so this never grows.

BEGIN;

CREATE TABLE keepalive_log (
  id text PRIMARY KEY DEFAULT 'default',
  pinged_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'github-actions'
);

INSERT INTO keepalive_log (id) VALUES ('default');

-- RLS enabled with no policies: anon/authenticated keys get zero access.
-- Only the service-role key (backend-only, never shipped to clients) can read/write.
ALTER TABLE keepalive_log ENABLE ROW LEVEL SECURITY;

COMMIT;
