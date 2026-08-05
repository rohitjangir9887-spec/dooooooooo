-- Store the Google Calendar OAuth token server-side instead of a local token.json file.
-- Needed because App Runner's filesystem is ephemeral and resets on every deploy.

BEGIN;

CREATE TABLE google_oauth_tokens (
  id text PRIMARY KEY DEFAULT 'default',
  access_token text,
  refresh_token text,
  scope text,
  token_type text,
  expiry_date bigint,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS enabled with no policies: anon/authenticated keys get zero access.
-- Only the service-role key (backend-only, never shipped to clients) can read/write.
ALTER TABLE google_oauth_tokens ENABLE ROW LEVEL SECURITY;

COMMIT;
