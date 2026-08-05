import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'
import ws from 'ws'

const SCOPES = ['https://www.googleapis.com/auth/calendar']
const TOKEN_ROW_ID = 'default'

// Dedicated service-role client: google_oauth_tokens has RLS with no policies,
// so only the service-role key (backend-only) can read/write it.
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { realtime: { transport: ws } }
)

function buildClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )
}

async function saveTokens(tokens) {
  await supabaseAdmin.from('google_oauth_tokens').upsert({
    id: TOKEN_ROW_ID,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    scope: tokens.scope,
    token_type: tokens.token_type,
    expiry_date: tokens.expiry_date,
    updated_at: new Date().toISOString(),
  })
}

// Returns the URL the user must visit to authorize access
export function getAuthUrl() {
  return buildClient().generateAuthUrl({
    access_type: 'offline',
    scope:       SCOPES,
    prompt:      'consent',
  })
}

// Called by the OAuth callback route — exchanges code for tokens and saves them
export async function handleCallback(code) {
  const client = buildClient()
  const { tokens } = await client.getToken(code)
  await saveTokens(tokens)
  return tokens
}

async function getAuthorizedClient() {
  const { data: saved } = await supabaseAdmin
    .from('google_oauth_tokens')
    .select('access_token, refresh_token, scope, token_type, expiry_date')
    .eq('id', TOKEN_ROW_ID)
    .maybeSingle()

  if (!saved) return null

  const client = buildClient()
  client.setCredentials(saved)
  // Persist refreshed tokens automatically
  client.on('tokens', (fresh) => {
    saveTokens({ ...saved, ...fresh })
  })
  return client
}

export async function createCalendarEvent(booking) {
  const auth = await getAuthorizedClient()
  if (!auth) {
    console.warn('[Google Calendar] No stored token — skipping calendar event.')
    console.warn('[Google Calendar] Visit /api/auth/google on this API to authorize.')
    return null
  }

  const calendar   = google.calendar({ version: 'v3', auth })
  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary'

  const clientName  = booking.client_name   || 'Unknown'
  const clientPhone = booking.client_phone  || ''
  const svcName     = booking.service?.name || 'Service'
  const barberName  = booking.barber?.name  || 'Staff'

  const start = new Date(booking.booked_at)
  const end   = new Date(start.getTime() + booking.duration_min * 60_000)

  const event = {
    summary:     `${svcName} — ${clientName}`,
    description: [
      `Service : ${svcName}`,
      `Barber  : ${barberName}`,
      `Customer: ${clientName}`,
      `Phone   : ${clientPhone}`,
      `Amount  : ₱${booking.amount}`,
      `Booking : ${booking.id}`,
    ].join('\n'),
    start: { dateTime: start.toISOString(), timeZone: 'Asia/Manila' },
    end:   { dateTime: end.toISOString(),   timeZone: 'Asia/Manila' },
    colorId: '6', // tangerine — matches the barbershop accent
  }

  try {
    const response = await calendar.events.insert({ calendarId, resource: event })
    console.log(`[Google Calendar] Event created: ${response.data.id}`)
    return response.data.id
  } catch (err) {
    console.error('[Google Calendar] Failed to create event:', err.message)
    return null
  }
}
