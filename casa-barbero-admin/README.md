# Casa Barbero Admin

Casa Barbero Admin is organized as a small full-stack workspace with a Vite/React client, an Express API, and shared domain fixtures.

## Commands

- `npm run dev` starts the client and API together.
- `npm run client` starts only the Vite client on port 5174.
- `npm run server` starts only the Express API on port 4174.
- `npm run build` creates the production client build.
- `npm run seed` regenerates `backend/data/seed-output.json`.

## Structure

```text
client/
  src/
    app/          application shell and top-level routing
    assets/       global styles and future static assets
    components/   reusable layout and UI components
    hooks/        reusable React hooks
    lib/          third-party client setup and chart configuration
    pages/        route-level admin screens
    services/     API, navigation, and session persistence
    utils/        display and formatting helpers
    validation/   form schemas
backend/
  src/
    config/       environment and external service setup
    data/         in-memory application state
    middleware/   Express middleware
    routes/       API route modules by domain
    services/     business and session logic
  scripts/        backend maintenance scripts
  data/           generated seed output
shared/
  data/           fixtures used by both client and backend
```
