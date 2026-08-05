import { Router } from 'express'
import supabase from '../database.js'
import { createCalendarEvent } from '../google-calendar.js'

const router = Router()

function timeToMin(t) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

// POST /api/bookings — reserve a slot (booking_status = "pending" until payment)
router.post('/', async (req, res) => {
  const {
    customer_name, phone,
    service_name,
    barber_id, barber_name,
    date, time_slot, duration_min, amount,
    payment_method,
  } = req.body

  const missing = ['customer_name', 'phone', 'service_name',
                   'barber_name', 'date', 'time_slot', 'duration_min', 'amount']
    .filter(k => !req.body[k])
  if (missing.length) {
    return res.status(400).json({ error: `Missing: ${missing.join(', ')}` })
  }

  const isUuidBarber = /^[0-9a-f-]{36}$/i.test(barber_id)

  // Slot conflict check against new schema columns
  if (isUuidBarber) {
    const { data: existing } = await supabase
      .from('bookings')
      .select('booked_at, duration_min')
      .eq('barber_id', barber_id)
      .neq('booking_status', 'cancelled')
      .gte('booked_at', `${date}T00:00:00+08:00`)
      .lt('booked_at',  `${date}T24:00:00+08:00`)

    const newStart = timeToMin(time_slot)
    const newEnd   = newStart + parseInt(duration_min, 10)

    const conflict = (existing || []).some(b => {
      if (!b.booked_at) return false
      const d = new Date(b.booked_at)
      const bStart = d.getHours() * 60 + d.getMinutes()
      const bEnd   = bStart + (b.duration_min || parseInt(duration_min, 10))
      return newStart < bEnd && newEnd > bStart
    })

    if (conflict) {
      return res.status(409).json({ error: 'This slot was just taken. Please choose a different time.' })
    }
  }

  // Resolve UUID FKs: service by name; barber by UUID or name fallback
  const [svcResult, barberResult] = await Promise.all([
    supabase.from('services').select('id').eq('name', service_name).maybeSingle(),
    isUuidBarber
      ? supabase.from('barbers').select('id').eq('id', barber_id).eq('is_active', true).single()
      : supabase.from('barbers').select('id').ilike('name', barber_name).eq('is_active', true).maybeSingle()
  ])

  const booked_at = `${date}T${time_slot}:00+08:00`
  const isCounter = payment_method === 'counter'

  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      client_name:    customer_name,
      client_phone:   phone,
      booked_at,
      service_id:     svcResult.data?.id   ?? null,
      barber_id:      barberResult.data?.id ?? null,
      duration_min:   parseInt(duration_min, 10),
      amount:         parseInt(amount, 10),
      booking_status: 'pending',
      payment_status: 'unpaid',
      payment_method: isCounter ? 'counter' : null,
    })
    .select('*, service:service_id (name), barber:barber_id (name)')
    .single()

  if (error) return res.status(500).json({ error: error.message })

  // Counter bookings are confirmed immediately — add the calendar event now
  if (isCounter) {
    const eventId = await createCalendarEvent(booking)
    if (eventId) {
      await supabase.from('bookings').update({ google_event_id: eventId }).eq('id', booking.id)
      booking.google_event_id = eventId
    }
    await supabase.from('calendar_sync_log').insert({
      booking_id:  booking.id,
      event_type:  'booking',
      description: `Added ${booking.service?.name || service_name} — ${customer_name} to calendar`,
      success:     eventId !== null
    })
  }

  res.status(201).json({ booking })
})

// GET /api/bookings/:id — fetch a booking with its payment log
router.get('/:id', async (req, res) => {
  const { data: booking, error } = await supabase
    .from('bookings')
    .select('*, payment_logs(*), service:service_id (name), barber:barber_id (name)')
    .eq('id', req.params.id)
    .single()

  if (error || !booking) return res.status(404).json({ error: 'Booking not found' })
  res.json({ booking })
})

export default router
