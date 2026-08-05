# CLAUDE.md

Guidance for Claude Code working with code in this repository.

## General Principles

- Generate concise, short solutions for new modules or code.
- KISS principle: Keep it simple, stupid.
- Watch for over-engineering and oversized files needing refactor.
- Watch for syntax/style mismatching the rest of the codebase.
- Watch for obvious bugs and logical flaws.
- Prioritize concise, precise code and documentation changes.
- No emojis or special characters in comments.
- Write activity-log.md in /docs to refer back if confused.
- Create a to-do list and run major changes by user first.
- Review existing files before refactoring or major changes.
- Markdown files use kebab naming (e.g., some-description-changes.md).
- Don't auto-commit activity logs and docs.

## Code Quality

### General Standards

- Use right data structures and algorithms for the problem.
- Don't expose data needlessly (least privilege principle).
- No external libraries unless absolutely necessary; check package.json for versions.
- Avoid redundancy unless it improves usability or maintainability.
- Comments: one-liner describing what the code does, keep it direct and actionable.
- No `console.log()` in production code; use proper logging (e.g., Winston, Pino).

### Backend (Express/Node.js)

- Organize code: `controllers/`, `routes/`, `models/`, `middleware/`, `services/`, `config/`, `utils/`.
- One controller per resource; keep controllers thin (delegate logic to services).
- Use async/await, not callbacks or `.then()` chains.
- Validate all inputs (query, params, body) before processing.
- Return consistent JSON responses with status codes and error messages.
- Use environment variables for all config (database URL, API keys, port, etc.).
- Error handling: catch errors in middleware, return meaningful error messages (avoid stack traces in production).
- Database queries: use parameterized queries to prevent SQL injection. Supabase queries must use RLS (Row Level Security).

### Frontend (React)

- Organize code: `components/`, `pages/`, `hooks/`, `utils/`, `services/`, `assets/`, `validators/`, `helpers/`.
- One component per file; break large components into smaller, reusable pieces.
- Prefer functional components with hooks over class components.
- Memoize expensive computations and callbacks (`useMemo`, `useCallback`).
- Lazy load heavy components using `React.lazy()` and `Suspense`.
- Avoid prop drilling; use Context API for shared state (not Redux unless truly needed).
- Minimize re-renders: use dependency arrays correctly, avoid inline object/function creation in render.
- CSS: use CSS modules or styled-components; avoid inline styles.
- No unused imports or dead code.

### Error Pages & Status Codes

Error pages are implemented for both customer (`casa-barbero`) and admin (`casa-barbero-admin`) sites. All 8 status codes are ready to use — no additional implementation needed.

**Customer site errors** (`src/pages/errors/`):
- Import: `import ErrorPage from './pages/errors/ErrorPage'`
- Or use specific wrappers: `NotFound`, `ServerError`, `AuthError`
- Usage: `<ErrorPage code={404} />` or `<ServerError code={500} />`
- Styling: CSS Modules (`ErrorPage.module.css`)
- Animation: `motion/react` stagger entrance + breathing icon glow

**Admin site errors** (`client/src/pages/errors/`):
- Import: `import ErrorPage from '../pages/errors/ErrorPage'`
- Or use specific wrappers: `NotFound`, `ServerError`, `AuthError`
- Usage: `<ErrorPage code={404} />` — pass `code` prop to render any status
- Styling: Global CSS (`errors.css`)
- Animation: `framer-motion` stagger entrance + breathing icon glow

**Implemented status codes (8 total):**

| Code | Name | Color | Use Case |
|------|------|-------|----------|
| 400 | Bad Request | Gold | Invalid form input, malformed requests |
| 401 | Unauthorized | Blue | Missing/expired session (render inline when auth fails) |
| 403 | Forbidden | Blue | User lacks permission (render inline when permission check fails) |
| 404 | Not Found | Gold | Route doesn't exist (auto-renders via catch-all route) |
| 500 | Server Error | Red | Unhandled exceptions (catch in error boundary) |
| 502 | Bad Gateway | Red | Upstream service down (API failure handler) |
| 503 | Service Unavailable | Red | Maintenance mode (graceful shutdown) |
| 504 | Gateway Timeout | Red | Request timeout (API response timeout) |

**Design specs** (shared across both sites):
- Full-viewport dark page (`#141414` bg) with grain texture
- Ghost watermark of code number (0.027 opacity, Playfair/Cormorant serif)
- Top-left: brand wordmark (B glyph + logotype)
- Top-right: status badge (e.g., "4XX · CLIENT ERROR")
- Center: icon circle (scissors/server/lock) with breathing animation
- Large serif code number in status color
- Gold razor-rule divider
- Headline + HTTP status name + description
- Two CTAs: primary action (status color bg) + ghost button
- Bottom footer: "Casa Barbero [Admin] · {code} {name}"

**Rendering patterns:**

404 (auto-routed):
```jsx
// Customer: navigate to any non-existent route
// Admin: navigate to /admin/invalid-page
// Both auto-render the NotFound page
```

401/403 (inline in components):
```jsx
if (!session) return <AuthError code={401} />
if (!permissions.includes('admin')) return <AuthError code={403} />
```

500/502/503/504 (error boundaries or API handlers):
```jsx
catch (error) {
  if (error.status === 503) return <ServerError code={503} />
  return <ServerError code={500} /> // fallback
}
```

### Database (PostgreSQL/Supabase)

- Use migrations for schema changes; never alter production directly.
- Index heavily-queried columns and foreign keys.
- Use RLS (Row Level Security) policies for multi-tenant data.
- Avoid N+1 queries; use `join` or batch queries where possible.
- Keep relationships normalized; avoid storing redundant data.
- Use transactions for multi-step operations.

## Documentation

### Code Comments

- One-line comments above complex logic explaining the "why," not the "what."
- JSDoc for public functions, exported components, and utilities.
- No documentation for obvious code (e.g., `const user = getUser();`).

### README

- Clear setup instructions (Node version, install dependencies, environment variables).
- How to start dev server and run tests.
- Architecture overview (tech stack, folder structure).
- Key endpoints (if API) or main features (if frontend).

### API Documentation

- Document all endpoints: method, path, authentication, request body, response structure.
- Include example requests and responses.
- Document status codes: 200, 400, 401, 403, 404, 500, etc.
- Use comments in route files or maintain a separate `API.md`.

Example format:
```
POST /api/users
Auth: Required (Bearer token)
Body: { name, email, password }
Response: { id, name, email, createdAt }
Errors: 400 (invalid email), 409 (email exists), 500 (server error)
```

### Database Schema

- Maintain a `DATABASE.md` or inline comments in migration files.
- Document tables, columns, relationships, constraints, and indexes.
- Explain RLS policies if using Supabase.

## API Security & Endpoints

### Authentication & Authorization

- Use JWT tokens for stateless authentication; store in HTTP-only cookies or secure storage.
- Validate tokens on every protected route.
- Implement refresh token rotation for long-lived sessions.
- Never expose sensitive data in tokens (passwords, API keys).
- Use role-based access control (RBAC) with user roles and permissions.

### Input Validation

- Validate and sanitize all user inputs (query, params, body).
- Use a validation library (e.g., Joi, Yup, Zod) for schema validation.
- Reject requests with missing or malformed data early.
- Limit request payload size to prevent DoS attacks.

### Data Protection

- Use HTTPS only; reject HTTP requests.
- Hash passwords with bcrypt or Argon2, never store plaintext.
- Use Supabase RLS to prevent unauthorized data access.
- Encrypt sensitive fields at rest if needed (e.g., SSN, payment info).
- Set secure headers: `Content-Security-Policy`, `X-Frame-Options`, `Strict-Transport-Security`.

### Rate Limiting & DoS Prevention

- Implement rate limiting on auth endpoints (login, signup, password reset).
- Use middleware (e.g., express-rate-limit) to throttle requests.
- Set reasonable limits: 5 attempts per 15 minutes for login, etc.

### API Response Standards

- Return consistent error responses:
```json
{ "error": "Invalid email", "status": 400, "timestamp": "2024-01-10T10:00:00Z" }
```
- Never expose internal server paths, database structure, or stack traces.
- Use generic error messages for production (log details server-side).

## Frontend Efficiency

### Performance

- Lazy load routes using `React.lazy()` and code splitting.
- Use dynamic imports for heavy libraries.
- Minimize bundle size: audit with `npm ls`, remove unused packages.
- Cache API responses with appropriate headers (e.g., `Cache-Control: max-age=300`).
- Optimize images: compress, use WebP, lazy load with `loading="lazy"`.

### State Management

- Keep state as close as possible to where it's used (local > Context > external store).
- Use Context for global state (auth, theme, language) only.
- Avoid unnecessary state updates; use immutable updates.

### Network Requests

- Use a single HTTP client instance (e.g., Axios, Fetch with interceptors).
- Set request timeouts (default 10-30 seconds).
- Retry failed requests (with exponential backoff) for non-idempotent operations.
- Cache GET requests; invalidate on mutations.
- Show loading states and error messages to users.

### Rendering Optimization

- Use `React.memo()` for components that receive same props.
- Split large lists into paginated or virtualized components.
- Avoid large inline styles or object creation in render.
- Use `key` prop correctly in lists (never use index).

## Testing

### Backend

- Unit tests for services and utilities (Jest).
- Integration tests for API endpoints (request to response validation).
- Test error cases and edge cases.
- Mock database calls in unit tests; use test database for integration tests.
- Minimum coverage: 70% for critical paths.

### Frontend

- Unit tests for components and hooks (Jest, React Testing Library).
- Test user interactions, not implementation details.
- Test error boundaries and fallback UIs.
- Avoid testing third-party library behavior.

### Test File Naming

- Colocate tests: `component.test.jsx` next to `component.jsx`.
- Use descriptive test names: `should render error message when API fails`.

## Environment & Deployment

### Environment Variables

- Define in `.env.example` (without sensitive values).
- Never commit `.env` to Git.
- Use different env files: `.env.local`, `.env.test`, `.env.production`.
- Required env vars: `NODE_ENV`, `DATABASE_URL`, `API_PORT`, `JWT_SECRET`.

### Local Development

- Provide setup instructions in README.
- Use Docker Compose for local database (PostgreSQL) if needed.
- Use nodemon or similar for auto-restart on changes.

### Production Deployment

- Validate all environment variables at startup.
- Use health check endpoint (`GET /health`).
- Log errors and monitor uptime.
- Use reverse proxy (Nginx) for HTTPS, compression, static files.
- Set up CI/CD to run tests before deploying.

## Version Control

### Commits

- Commit after significant changes with clear, atomic messages.
- Use imperative mood: "Add user authentication" not "Added authentication".
- Reference issues: "Fix #42: Resolve login timeout".
- Keep commits focused; one feature or fix per commit.
- No auto-push; always review before pushing.

### Branches

- Use feature branches: `feature/user-auth`, `fix/login-timeout`, `docs/api-guide`.
- Keep branches short-lived (1-3 days).
- Require PR review before merging to main.

## AI Restrictions

### Data Privacy

- No customer personal data: names, emails, phone numbers, account numbers, transactions (unless approved exemption or mock data).
- No authentication credentials: passwords, API keys, tokens, connection strings, OAuth secrets.
- No internal documentation or business logic that's confidential.

### Security

- Never hardcode secrets; always use environment variables.
- Don't generate code that bypasses security checks.
- Sanitize and validate all user inputs before storage or processing.
- Don't expose error messages that leak system information.

## Lessons Learned (Recurring Pitfalls)

Mined from `/docs/activity-log.md`. Each one already cost real time or a user-visible bug once — check against these before repeating the pattern.

### Third-party animation params don't always mean what they sound like
CountUp's `duration` prop was fed into a `useSpring` damping/stiffness formula — it shapes the physics but does **not** bound wall-clock time (springs are asymptotic, not time-bounded). Cutting the number twice didn't reliably shorten the visible finish time; the user had to report "still too long" twice before the real fix.
- **Recognize:** the user gives a hard numeric constraint ("under 1.5s total", "exactly N", "no more than X") for anything animated.
- **Instead:** before tuning a knob, check what it actually controls (read the type signature / library source). If the user's constraint is a hard bound, use a mechanism with a provable bound (a duration-based tween, e.g. `animate()`) instead of an approximated one (a spring). Do the arithmetic for the worst case (last staggered item, slowest branch) and state the guaranteed number back to the user.

### A "zero matches" search result is not proof of absence
The first emoji sweep used a Unicode-range regex that silently failed to match an astral-plane character (📞, U+1F4DE) in two files. Reported clean, then the user found one anyway.
- **Recognize:** you're about to declare a codebase-wide sweep "clean" (no more emoji, no more instances of X, no remaining references) based on a single regex/grep pass — especially involving Unicode, generated code, or anything the user has already caught you missing once.
- **Instead:** corroborate with a second, differently-shaped check (a broader range, a plain-text keyword search, or just reading the remaining candidate files directly) before reporting completeness. Astral-plane emoji specifically need a range like `\x{1F000}-\x{1FFFF}`, not just the BMP dingbat/symbol blocks.

### CSS Modules leak across pages via shared class names (this repo, both apps)
Both `casa-barbero` and `casa-barbero-admin` lazy-load page CSS that persists after navigation. A generic class name defined in two different page stylesheets creates a load-order-dependent conflict, not a source-order one. One audit pass found three separate live instances: dual `.badge` (layout.css vs ui.css), dual `.filter-bar` (bookings.css vs ui.css), and `.compact { min-width: 900px }` (payments.css) leaking onto Barbers page `.toggle-row.compact` because whichever page's CSS chunk loaded last won.
- **Recognize:** about to add or edit a CSS Modules rule with a short/generic class name (`.icon`, `.strip`, `.badge`, `.compact`, `.card`, `.dot`...) in a page-specific stylesheet.
- **Instead:** grep sibling page CSS files for the same class name first. If it's genuinely shared, put the rule in the shared stylesheet (`ui.css`/`global.css`, or `index.css`) instead of letting two page files each define their own version. When delegating this kind of fix to a subagent, explicitly require it to search other pages for the same selector before assuming a fix is page-local.

### Refactors leave dead CSS and dead controls behind, silently
`.hours-row button` rules kept targeting elements that no longer existed after a refactor to time inputs — CSS doesn't error on a selector that matches nothing, it just quietly stops applying. Same shape of bug as the previously-found hardcoded-June-2026 calendar with dead nav buttons.
- **Recognize:** just changed an element's tag or structure (e.g., `<button>` → `<input>`, removed a wrapper div) in JSX.
- **Instead:** grep the paired CSS file for selectors referencing the old element/class immediately after the JSX change, not as an afterthought during some later unrelated audit.

### Ephemeral hosting breaks local-disk state assumptions
`google-calendar.js` stored an OAuth token in `token.json` on local disk — invisible until the AWS App Runner deployment plan surfaced that the filesystem is wiped on every redeploy.
- **Recognize:** any `fs.writeFileSync`/`readFileSync` used for state that must outlive a single process, on a target that is Fly.io, App Runner, Lambda, or any other ephemeral/serverless host.
- **Instead:** move that state to Supabase (or equivalent) before it becomes a deploy-day surprise, not after.

### Don't auto-install a package whose identity you inferred yourself
Tried `npx ui-ux-pro-max-cli init` for a skill the user named but wasn't installed — the sandbox correctly blocked it because the exact package identity came from my own web search, not from the user.
- **Recognize:** about to run `npx`/`pip install`/similar for a tool the user referenced by a general name, where you had to search to find the actual package name.
- **Instead:** ask the user to confirm/run it themselves (`! <command>`), or fall back to a read-only equivalent (fetch its published docs) and say plainly that the real thing isn't installed.

### Monorepo dev servers need fixed, non-colliding ports
Both `casa-barbero` and `casa-barbero-admin` defaulted to Vite's port 5173; whichever app grabbed it first silently served the other app's requests, producing a confusing "No routes matched /admin/login" React Router error that looked like a routing bug.
- **Recognize:** debugging a routing/navigation error in a monorepo with multiple Vite/dev-server apps, especially a "route that should obviously exist doesn't match."
- **Instead:** check which app is actually listening on the port in question before touching routing code. Keep each app's port fixed and `strictPort: true` in its dev config.

### Resuming interrupted parallel subagents
A session-limit hit interrupted 5 of 6 parallel background subagents mid-edit simultaneously during the admin responsive overhaul. Resuming each with an explicit "re-check current file state before continuing" instruction (rather than just "continue") avoided duplicate or conflicting edits — every agent correctly detected what it had already applied. Keep doing this on any future multi-agent resume.

## Activity Log

- Record significant changes, decisions, and blockers in `/docs/activity-log.md`.
- Format: date, summary, decision/outcome.
- Reference this when returning to the codebase after gaps.
