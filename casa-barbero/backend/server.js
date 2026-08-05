import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import catalogRouter from './routes/catalog.js'
import slotsRouter from './routes/slots.js'
import bookingsRouter from './routes/bookings.js'
import paymentsRouter, { webhookHandler } from './routes/payments.js'
import { getAuthUrl, handleCallback } from './google-calendar.js'

const app = express()
const PORT = process.env.PORT || 3001

// Allow requests from the Vite dev server (5173 / 5174)
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5174',
  ],
  credentials: true,
}))

// Webhook must be registered BEFORE express.json() so we get the raw body
// PayMongo sends raw JSON which we need to verify signatures against
app.post('/api/webhooks/paymongo', express.raw({ type: 'application/json' }), webhookHandler)

app.use(express.json())

// ── API routes ──────────────────────────────────────────
app.use('/api/catalog',         catalogRouter)
app.use('/api/available-slots', slotsRouter)
app.use('/api/bookings',        bookingsRouter)
app.use('/api/payments',        paymentsRouter)

// ── Google OAuth (one-time setup) ───────────────────────
// Visit /api/auth/google once to authorize your Google account so the
// backend can create calendar events. Redirect URI is set via GOOGLE_REDIRECT_URI
// and must match an authorized redirect URI in the Google Cloud OAuth client.
app.get('/api/auth/google', (req, res) => {
  res.redirect(getAuthUrl())
})

app.get('/api/auth/google/callback', async (req, res) => {
  const { code } = req.query
  if (!code) return res.status(400).send('No authorization code received.')
  try {
    await handleCallback(code)
    res.send(`
      <html><body style="font-family:sans-serif;padding:60px;background:#0d0a07;color:#e8dfd5">
        <h1 style="color:#c9922a">✓ Google Calendar authorized!</h1>
        <p>Token saved. Close this tab and restart the server.</p>
      </body></html>
    `)
  } catch (err) {
    console.error('[Google OAuth]', err.message)
    res.status(500).send(`<pre>Error: ${err.message}</pre>`)
  }
})

// ── Health check ────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ── Global error handler ────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Unhandled]', err.message)
  res.status(500).json({ error: err.message || 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`\nCasa Barbero API  →  http://localhost:${PORT}\n`)
})
