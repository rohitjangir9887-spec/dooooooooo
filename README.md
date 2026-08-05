# Casa Barbero

Full-stack barbershop booking platform. Customers book appointments online with real-time slot availability; payments are processed via PayMongo; confirmed bookings auto-create Google Calendar events. A separate admin dashboard manages bookings, barbers, services, and schedules.

**Live:**
- Customer site — https://barbero.tristanehron.xyz
- Admin dashboard — https://barbero-admin.tristanehron.xyz/admin/login

## Tech Stack

**Core (PERN):**
- PostgreSQL — via Supabase (managed Postgres + Auth + RLS)
- Express — REST API, one instance per app
- React 19 — Vite-built SPA, one instance per app
- Node.js 18+

| Concern | Tool |
|---|---|
| Database / Auth / RLS | Supabase |
| Payments | PayMongo API |
| Calendar sync | Google Calendar API (OAuth2) |
| Frontend hosting + CI/CD | AWS Amplify (auto-deploy on push to `main`) |
| Backend hosting | Docker containers on Fly.io |
| Source control | GitHub |
| DNS | GoDaddy (`tristanehron.xyz`) |
| Dev tooling | Claude Code |

## Repo Structure

Monorepo, two independent full-stack apps sharing one Supabase project:

```
casa-barbero/              customer-facing app
  src/                      React frontend (Vite)
  backend/                  Express API (bookings, slots, payments, Google Calendar)

casa-barbero-admin/        admin dashboard
  client/                   React frontend (Vite)
  backend/                  Express API (auth, bookings, barbers, dashboard)
  shared/                   fixtures shared by client + backend

supabase/migrations/       SQL migrations, applied in order
docs/                      activity log, deployment checklists
```

Each app's frontend and backend deploy independently — they are not a single build.

## Run Locally

Requires Node 18+.

```bash
npm install                # root — installs concurrently only
npm run dev                 # runs both customer and admin apps together
```

Or run one app at a time:

```bash
npm run dev:client          # casa-barbero only
npm run dev:admin           # casa-barbero-admin only
```

Each app also needs its own dependencies and env file installed once:

```bash
cd casa-barbero && npm install && cd backend && npm install
cd casa-barbero-admin && npm install
```

Environment variables (Supabase keys, PayMongo keys, Google OAuth credentials) go in `.env` files per app/backend — see each subfolder's README for the exact variables required. Never commit `.env` files.

## Deployment

**Frontends (Amplify):** two separate Amplify apps, each pointed at a different app root (`casa-barbero`, `casa-barbero-admin`) in this same repo. Push to `main` triggers an automatic rebuild and redeploy. Custom domains are CNAME'd from GoDaddy to Amplify; TLS certs are auto-issued.

**Backends (Fly.io):** each backend ships a `Dockerfile` + `fly.toml`. Deploy with `flyctl deploy` from inside `casa-barbero/backend` or `casa-barbero-admin/backend`. Secrets (Supabase service role key, PayMongo secret key, Google OAuth credentials) are set via `flyctl secrets set`, never committed.

**Database:** schema changes go through `supabase/migrations/*.sql`, applied in order. Production schema is never altered by hand.

See `docs/activity-log.md` for deployment history and decisions, and `docs/fly-io-deployment-todo.md` for the current backend deployment checklist.

## API & Schema Docs

Each app has its own README with full API reference and DB schema for that app's domain:
- `casa-barbero/README.md`
- `casa-barbero-admin/README.md`
