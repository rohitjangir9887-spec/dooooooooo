# Casa Barbero — Appointment Booking System

A full-stack barbershop website with online appointment booking, Google Calendar integration, and PayMongo payment processing.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite 8 + React Router 7 |
| Backend | Node.js + Express 4 |
| Database | Supabase (PostgreSQL) |
| Payments | PayMongo API (card / test mode) |
| Calendar | Google Calendar API (OAuth2) |
| Styling | CSS Modules |

---

## Project Structure

```
casa-barbero/
├── backend/                  ← Express REST API
│   ├── server.js             ← Entry point
│   ├── database.js           ← Supabase client
│   ├── google-calendar.js    ← Google Calendar OAuth + event creation
│   ├── .env                  ← Backend secrets (gitignored)
│   ├── token.json            ← Google OAuth token (auto-created, gitignored)
│   └── routes/
│       ├── slots.js          ← GET /api/available-slots
│       ├── bookings.js       ← POST /api/bookings, GET /api/bookings/:id
│       └── payments.js       ← POST /api/payments, webhooks
├── src/
│   ├── pages/
│   │   ├── AppointmentPage.jsx        ← Multi-step booking UI
│   │   ├── AppointmentPage.module.css
│   │   └── BookingPage.jsx            ← Services & pricing page
│   └── components/           ← Landing page sections
└── client_secret.json        ← Google OAuth credentials (gitignored)
```

---

## Setup

### 1 — Install backend dependencies

```bash
cd casa-barbero/backend
npm install
```

### 2 — Configure backend environment

Edit `backend/.env` (already populated with test keys):

```env
SUPABASE_URL=https://nupzacrvpxkounemjitj.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
PAYMONGO_SECRET_KEY=sk_test_...
PAYMONGO_PUBLIC_KEY=pk_test_...
GOOGLE_CALENDAR_ID=primary
PORT=3001
FRONTEND_URL=http://localhost:5173
```

### 3 — Install frontend dependencies

```bash
cd casa-barbero
npm install
```

### 4 — Configure frontend environment

Add to `casa-barbero/.env`:

```env
VITE_API_URL=http://localhost:3001
```

### 5 — Start the backend

```bash
cd casa-barbero/backend
npm run dev        # uses node --watch for auto-restart
```

### 6 — Start the frontend

```bash
cd casa-barbero
npm run dev
```

Open `http://localhost:5173` and click **Book Appointment** in the nav.

---

## Google Calendar Setup (one-time)

The backend uses OAuth2 with `client_secret.json` (already present).

1. Make sure your Google Cloud project has the **Google Calendar API** enabled.
2. Add `http://localhost:3001/api/auth/google/callback` to the **Authorized redirect URIs** in your OAuth 2.0 Client settings.
3. Start the backend, then visit:

```
http://localhost:3001/api/auth/google
```

4. Sign in with your Google account and authorize access.
5. The backend saves `backend/token.json`. Calendar events will now be created automatically after each paid booking.

**Without this step:** Bookings and payments still work — calendar event creation is silently skipped.

---

## API Reference

### GET `/api/available-slots`

```
?barber=john&date=2026-06-26&duration=30
```

Returns available time slots for the specified barber and date, excluding already-booked times and the 1–2 PM lunch break.

**Response:**
```json
{ "slots": ["09:00", "09:30", "10:00", ...], "date": "...", "barber": "...", "duration": 30 }
```

---

### POST `/api/bookings`

Creates a booking with status `pending`.

**Body:**
```json
{
  "customer_name": "Juan dela Cruz",
  "phone": "09171234567",
  "service_id": "haircut",
  "service_name": "Haircut",
  "barber_id": "john",
  "barber_name": "John",
  "date": "2026-06-26",
  "time_slot": "10:00",
  "duration_min": 30,
  "amount": 300
}
```

**Response:** `{ "booking": { "id": "uuid", "status": "pending", ... } }`

---

### GET `/api/bookings/:id`

Returns a booking and its payment logs.

---

### POST `/api/payments`

Attaches a card to a PayMongo Payment Intent and either confirms immediately or triggers 3DS.

**Body:**
```json
{
  "booking_id": "uuid",
  "card_number": "4343434343434345",
  "exp_month": 12,
  "exp_year": 28,
  "cvc": "123"
}
```

**Response (immediate success):** `{ "status": "paid", "booking_id": "...", "intent_id": "..." }`

**Response (3DS required):** `{ "status": "requires_action", "redirect_url": "https://...", "intent_id": "..." }`

---

### GET `/api/payments/status/:intentId`

Polls a PayMongo Payment Intent for its current status. Used by the frontend after a 3DS redirect.

---

### POST `/api/webhooks/paymongo`

Receives `payment.paid` events from PayMongo, marks the booking as paid, and creates the Google Calendar event.

---

## PayMongo Test Cards

These cards only work with `sk_test_` / `pk_test_` keys.

| Card Type | Number | Exp | CVC |
|-----------|--------|-----|-----|
| Visa — instant approval | `4343 4343 4343 4345` | 12/28 | 123 |
| Visa — triggers 3DS | `4120 0000 0000 0007` | 12/28 | 123 |

The booking page shows these cards with a **Fill** button for quick testing.

---

## Barber Schedule

| | Mon | Tue | Wed | Thu | Fri | Sat |
|---|---|---|---|---|---|---|
| John | 9–7 | 9–7 | 9–7 | 9–7 | 9–7 | 9–7 |
| Patrick | 9–7 | 9–7 | 9–7 | 9–7 | 9–7 | 9–7 |

**Lunch break:** 1:00 PM – 2:00 PM (slots in this window are automatically excluded)

Slot sizes are tied to service duration:
- Shave (20 min) → slots every 20 minutes
- Haircut / Fade (30 min) → slots every 30 minutes
- Haircut + Shave (45 min) → slots every 45 minutes

---

## Services & Pricing

| Service | Price | Duration |
|---------|-------|----------|
| Haircut | ₱300 | 30 min |
| Fade | ₱350 | 30 min |
| Shave | ₱200 | 20 min |
| Haircut + Shave | ₱450 | 45 min |

---

## Database Schema

### `bookings`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| customer_name | TEXT | |
| phone | TEXT | |
| service_id / service_name | TEXT | |
| barber_id / barber_name | TEXT | |
| date | DATE | YYYY-MM-DD |
| time_slot | TEXT | HH:MM (24-hour) |
| duration_min | INTEGER | 20 / 30 / 45 |
| amount | INTEGER | PHP, no decimals |
| status | TEXT | pending → paid → cancelled |
| google_event_id | TEXT | Nullable |
| created_at | TIMESTAMPTZ | |

### `payment_logs`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| booking_id | UUID | FK → bookings |
| paymongo_payment_id | TEXT | Nullable |
| paymongo_intent_id | TEXT | |
| status | TEXT | pending → paid → failed |
| amount | INTEGER | |
| created_at | TIMESTAMPTZ | |
