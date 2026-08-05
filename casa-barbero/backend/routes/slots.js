import { Router } from 'express'
import supabase from '../database.js'

const router = Router()

function timeToMin(t) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function minToTime(total) {
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// Build every 15-minute start time for the day, excluding slots that would
// run past closing or overlap the lunch break.
// Working hours come from barber_working_hours; defaults to 09:00–19:00 with 13:00–14:00 break.
function generateAllSlots(durationMin, hours = {}) {
  const OPEN    = (hours.open_min    ?? 9  * 60)
  const CLOSE   = (hours.close_min   ?? 19 * 60)
  const LUNCH_S = (hours.break_start ?? 13 * 60)
  const LUNCH_E = (hours.break_end   ?? 14 * 60)
  const STEP    = 15

  const slots = []
  for (let t = OPEN; t + durationMin <= CLOSE; t += STEP) {
    const end = t + durationMin
    if (t < LUNCH_E && end > LUNCH_S) continue
    slots.push(minToTime(t))
  }
  return slots
}

function parseTime(t) {
  if (!t) return null
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

// GET /api/available-slots?barber=<UUID>&date=<YYYY-MM-DD>&duration=<minutes>
router.get('/', async (req, res) => {
  const { barber, date, duration } = req.query

  if (!barber || !date || !duration) {
    return res.status(400).json({ error: 'barber, date, and duration query params are required' })
  }

  const durationMin = parseInt(duration, 10)
  if (isNaN(durationMin) || durationMin < 10 || durationMin > 240) {
    return res.status(400).json({ error: 'duration must be between 10 and 240 minutes' })
  }

  // Non-UUID barber IDs are no longer supported; return empty rather than error
  if (!/^[0-9a-f-]{36}$/i.test(barber)) {
    return res.json({ slots: [], date, barber, duration: durationMin })
  }

  // Load barber's working hours for the requested day
  let hours = {}
  const dayOfWeek = (new Date(date).getDay() + 6) % 7 // 0=Mon…6=Sun
  const { data: wh } = await supabase
    .from('barber_working_hours')
    .select('is_open, open_time, close_time, break_start, break_end')
    .eq('barber_id', barber)
    .eq('day_of_week', dayOfWeek)
    .single()

  if (wh) {
    if (!wh.is_open) return res.json({ slots: [], date, barber, duration: durationMin })
    hours = {
      open_min:    parseTime(wh.open_time),
      close_min:   parseTime(wh.close_time),
      break_start: parseTime(wh.break_start),
      break_end:   parseTime(wh.break_end)
    }
  }

  // Fetch non-cancelled bookings for this barber+date
  const { data: existing } = await supabase
    .from('bookings')
    .select('booked_at, duration_min')
    .eq('barber_id', barber)
    .neq('booking_status', 'cancelled')
    .gte('booked_at', `${date}T00:00:00+08:00`)
    .lt('booked_at',  `${date}T24:00:00+08:00`)

  const booked = (existing || []).map(b => {
    const d = new Date(b.booked_at)
    const start = d.getHours() * 60 + d.getMinutes()
    return { start, end: start + (b.duration_min || durationMin) }
  })

  const allSlots = generateAllSlots(durationMin, hours)
  const available = allSlots.filter(slot => {
    const s = timeToMin(slot)
    const e = s + durationMin
    return !booked.some(b => s < b.end && e > b.start)
  })

  res.json({ slots: available, date, barber, duration: durationMin })
})

export default router
