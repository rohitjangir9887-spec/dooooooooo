import { Router } from 'express'
import supabase from '../database.js'
import { createCalendarEvent } from '../google-calendar.js'

const router = Router()
const PM_BASE = 'https://api.paymongo.com/v1'

function pmAuth() {
  return 'Basic ' + Buffer.from(process.env.PAYMONGO_SECRET_KEY + ':').toString('base64')
}

async function pmFetch(endpoint, options = {}) {
  const res = await fetch(PM_BASE + endpoint, {
    ...options,
    headers: {
      Authorization:  pmAuth(),
      'Content-Type': 'application/json',
      Accept:         'application/json',
      ...options.headers,
    },
  })
  const json = await res.json()
  if (!res.ok) {
    const msg = json.errors?.[0]?.detail || json.errors?.[0]?.code || 'PayMongo error'
    throw new Error(msg)
  }
  return json
}

// Confirm a paid booking: update status columns, create transaction, add calendar event
async function confirmBooking(bookingId, intentId) {
  await supabase.from('bookings').update({
    booking_status: 'confirmed',
    payment_status: 'paid',
    payment_method: 'card',
  }).eq('id', bookingId)

  await supabase.from('payment_logs')
    .update({ status: 'paid', payment_method: 'card' })
    .eq('paymongo_intent_id', intentId)

  const { data: booking } = await supabase
    .from('bookings')
    .select('*, service:service_id (name), barber:barber_id (name)')
    .eq('id', bookingId)
    .single()

  if (booking) {
    await supabase.from('transactions').insert({
      booking_id:     bookingId,
      payment_method: 'card',
      amount:         booking.amount,
      processed_at:   new Date().toISOString(),
    })

    const eventId = await createCalendarEvent(booking)
    if (eventId) {
      await supabase.from('bookings').update({ google_event_id: eventId }).eq('id', bookingId)
    }
    await supabase.from('calendar_sync_log').insert({
      booking_id:  bookingId,
      event_type:  'booking',
      description: `Added ${booking.service?.name || ''} — ${booking.client_name || ''} to calendar`,
      success:     eventId !== null,
    })
  }
}

// ── POST /api/payments ───────────────────────────────────
router.post('/', async (req, res) => {
  const { booking_id, card_number, exp_month, exp_year, cvc, email } = req.body

  if (!booking_id || !card_number || !exp_month || !exp_year || !cvc) {
    return res.status(400).json({ error: 'booking_id, card_number, exp_month, exp_year, and cvc are required' })
  }

  const { data: booking, error: bErr } = await supabase
    .from('bookings')
    .select('*, service:service_id (name)')
    .eq('id', booking_id)
    .single()

  if (bErr || !booking) return res.status(404).json({ error: 'Booking not found' })
  if (booking.payment_status === 'paid') {
    return res.status(400).json({ error: 'This booking is already paid' })
  }

  const year4 = parseInt(exp_year, 10) < 100
    ? 2000 + parseInt(exp_year, 10)
    : parseInt(exp_year, 10)

  try {
    // Step 1: Tokenize card
    const pmMethod = await pmFetch('/payment_methods', {
      method: 'POST',
      body: JSON.stringify({
        data: {
          attributes: {
            type: 'card',
            details: {
              card_number: String(card_number).replace(/\s/g, ''),
              exp_month:   parseInt(exp_month, 10),
              exp_year:    year4,
              cvc:         String(cvc),
            },
            billing: {
              name:  booking.client_name,
              phone: booking.client_phone,
              email: email || `${booking.id.slice(0, 8)}@casabarbero.ph`,
            },
          },
        },
      }),
    })
    const paymentMethodId = pmMethod.data.id

    // Step 2: Create payment intent
    const pmIntent = await pmFetch('/payment_intents', {
      method: 'POST',
      body: JSON.stringify({
        data: {
          attributes: {
            amount:                 booking.amount * 100,
            payment_method_allowed: ['card'],
            payment_method_options: { card: { request_three_d_secure: 'any' } },
            currency:               'PHP',
            capture_type:           'automatic',
            description:            `${booking.service?.name || 'Service'} — Casa Barbero (${booking.id.slice(0, 8)})`,
          },
        },
      }),
    })
    const intentId  = pmIntent.data.id
    const clientKey = pmIntent.data.attributes.client_key

    // Step 3: Attach card to intent
    const pmAttach = await pmFetch(`/payment_intents/${intentId}/attach`, {
      method: 'POST',
      body: JSON.stringify({
        data: {
          attributes: {
            payment_method: paymentMethodId,
            client_key:     clientKey,
          },
        },
      }),
    })

    const { status, next_action, payments } = pmAttach.data.attributes
    const paymentId = payments?.[0]?.id ?? null

    await supabase.from('payment_logs').insert({
      booking_id,
      paymongo_payment_id: paymentId,
      paymongo_intent_id:  intentId,
      payment_method:      'card',
      status:              status === 'succeeded' ? 'paid' : 'pending',
      amount:              booking.amount,
    })

    if (status === 'succeeded') {
      await confirmBooking(booking_id, intentId)
      return res.json({ status: 'paid', booking_id, intent_id: intentId })
    }

    if (next_action?.type === 'redirect' && next_action.redirect?.url) {
      return res.json({
        status:       'requires_action',
        redirect_url: next_action.redirect.url,
        intent_id:    intentId,
        booking_id,
      })
    }

    res.json({ status, booking_id, intent_id: intentId })
  } catch (err) {
    console.error('[PayMongo]', err.message)
    res.status(502).json({ error: err.message })
  }
})

// ── GET /api/payments/status/:intentId ──────────────────
router.get('/status/:intentId', async (req, res) => {
  try {
    const data   = await pmFetch(`/payment_intents/${req.params.intentId}`)
    const status = data.data.attributes.status

    if (status === 'succeeded') {
      const { data: logs } = await supabase
        .from('payment_logs')
        .select('booking_id')
        .eq('paymongo_intent_id', req.params.intentId)
        .limit(1)

      if (logs?.[0]?.booking_id) {
        const { data: bk } = await supabase
          .from('bookings').select('payment_status').eq('id', logs[0].booking_id).single()
        if (bk && bk.payment_status !== 'paid') {
          await confirmBooking(logs[0].booking_id, req.params.intentId)
        }
      }
    }

    res.json({ status })
  } catch (err) {
    res.status(502).json({ error: err.message })
  }
})

// ── POST /api/webhooks/paymongo ─────────────────────────
export async function webhookHandler(req, res) {
  try {
    const raw   = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body)
    const event = JSON.parse(raw)
    const type  = event.data?.attributes?.type

    if (type === 'payment.paid') {
      const paymentData = event.data.attributes.data
      const intentId    = paymentData?.attributes?.payment_intent_id

      if (intentId) {
        const { data: logs } = await supabase
          .from('payment_logs')
          .select('booking_id')
          .eq('paymongo_intent_id', intentId)
          .limit(1)

        if (logs?.[0]?.booking_id) {
          const { data: bk } = await supabase
            .from('bookings').select('payment_status').eq('id', logs[0].booking_id).single()
          if (bk && bk.payment_status !== 'paid') {
            await confirmBooking(logs[0].booking_id, intentId)
          }
        }
      }
    }

    res.json({ received: true })
  } catch (err) {
    console.error('[Webhook]', err.message)
    res.status(400).json({ error: err.message })
  }
}

export default router
