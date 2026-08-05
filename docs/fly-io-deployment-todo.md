# Fly.io Deployment TODO — Phase 2 & 3

Status: **BLOCKED on Fly.io card verification**

## Phase 2: Deploy Backends to Fly.io

### 1. Fly.io Account Setup
- [ ] Go to https://fly.io
- [ ] Sign up / log in
- [ ] Complete card verification (~$7 hold, auto-releases)
- [ ] Install `flyctl` CLI locally
- [ ] Run `flyctl auth login`

### 2. Deploy Customer Backend
- [ ] Open terminal, cd to `casa-barbero/backend`
- [ ] Run: `flyctl deploy` (builds Docker image, deploys)
- [ ] Wait for deployment (2–3 min)
- [ ] Note the URL: `https://casa-barbero-api.fly.dev`
- [ ] Test: `flyctl open -a casa-barbero-api /api/health` (should return JSON)

### 3. Set Customer Backend Secrets
- [ ] Have these values ready:
  - `SUPABASE_URL` (from Supabase dashboard)
  - `SUPABASE_ANON_KEY` (from Supabase dashboard)
  - `SUPABASE_SERVICE_ROLE_KEY` (from Supabase dashboard)
  - `GOOGLE_CLIENT_ID` (from Google Cloud console)
  - `GOOGLE_CLIENT_SECRET` (from Google Cloud console)
  - `PAYMONGO_SECRET_KEY` (from PayMongo dashboard)
- [ ] Run secrets command:
```powershell
flyctl secrets set --app casa-barbero-api `
  SUPABASE_URL="your-url" `
  SUPABASE_ANON_KEY="your-key" `
  SUPABASE_SERVICE_ROLE_KEY="your-key" `
  GOOGLE_CLIENT_ID="your-id" `
  GOOGLE_CLIENT_SECRET="your-secret" `
  GOOGLE_REDIRECT_URI="https://api.barbero.tristanehron.xyz/api/auth/google/callback" `
  GOOGLE_CALENDAR_ID="primary" `
  PAYMONGO_SECRET_KEY="your-key" `
  FRONTEND_URL="https://barbero.tristanehron.xyz"
```
- [ ] Fly.io auto-redeploys with secrets

### 4. Deploy Admin Backend
- [ ] Open terminal, cd to `casa-barbero-admin/backend`
- [ ] Run: `flyctl deploy`
- [ ] Wait for deployment
- [ ] Note the URL: `https://casa-barbero-admin-api.fly.dev`
- [ ] Test: `flyctl open -a casa-barbero-admin-api /api/health`

### 5. Set Admin Backend Secrets
- [ ] Run secrets command:
```powershell
flyctl secrets set --app casa-barbero-admin-api `
  SUPABASE_URL="your-url" `
  SUPABASE_SERVICE_ROLE_KEY="your-key" `
  VITE_SUPABASE_ANON_KEY="your-key" `
  ADMIN_EMAIL="your-admin-email" `
  ADMIN_PASSWORD="your-admin-password" `
  PORT="8080"
```

## Phase 3: DNS & Environment Updates

### 6. Update GoDaddy DNS Records
- [ ] Go to GoDaddy → Manage DNS for `tristanehron.xyz`
- [ ] Add CNAME for customer API:
  - Name: `api.barbero`
  - Value: (from Fly.io customer app URL)
- [ ] Add CNAME for admin API:
  - Name: `api.barbero-admin`
  - Value: (from Fly.io admin app URL)
- [ ] Wait for DNS propagation (5–15 min)
- [ ] Test: `nslookup api.barbero.tristanehron.xyz`

### 7. Update Amplify Environment Variables

**Customer App (`casa-barbero`):**
- [ ] Go to Amplify → casa-barbero → App settings → Environment variables
- [ ] Update `VITE_API_URL` = `https://api.barbero.tristanehron.xyz`
- [ ] Keep `VITE_ADMIN_URL` = `https://barbero-admin.tristanehron.xyz/login`
- [ ] Save (auto-redeploys)

**Admin App (`casa-barbero-admin`):**
- [ ] Keep existing env vars (no changes needed)

### 8. Google Calendar OAuth Re-authorization
- [ ] Visit `https://api.barbero.tristanehron.xyz/api/auth/google` once
- [ ] Complete Google OAuth consent flow
- [ ] Confirm token is saved in Supabase `google_oauth_tokens` table

## Phase 3: End-to-End Testing

### 9. Smoke Tests
- [ ] Load `https://barbero.tristanehron.xyz`
  - [ ] Appointment booking page loads
  - [ ] Can select date/barber/service
  - [ ] Can make a test booking
- [ ] Confirm booking reaches backend (check Supabase)
- [ ] Confirm Google Calendar event created (check calendar)
- [ ] Load `https://barbero-admin.tristanehron.xyz/admin/login`
  - [ ] Login page loads
  - [ ] Can log in with admin credentials
  - [ ] Dashboard shows bookings from Supabase
- [ ] Test payment webhook (optional, requires PayMongo test)

### 10. Cleanup & Documentation
- [ ] Delete this TODO (when complete)
- [ ] Update `activity-log.md` with Phase 2/3 completion notes
- [ ] Test auto-redeploy: push a trivial commit to main, confirm both Amplify + Fly.io redeploy

---

## Notes
- All Docker configs + fly.toml files are already in the repo (pushed to main)
- Backend code changes for Google Calendar token storage already merged
- Frontends are live and working on custom domains
- Fly.io is FREE tier; sufficient for 1–5 users
