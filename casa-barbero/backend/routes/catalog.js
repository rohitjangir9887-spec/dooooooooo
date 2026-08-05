import { Router } from 'express'
import supabase from '../database.js'

const router = Router()

// GET /api/catalog — public; returns active barbers and services
router.get('/', async (_req, res) => {
  const [{ data: barbersData, error: bErr }, { data: servicesData, error: sErr }] = await Promise.all([
    supabase.from('barbers').select('id, name, role, tag_colors (hex)').eq('is_active', true).order('created_at'),
    supabase.from('services').select('id, name, duration_min, price').eq('is_active', true).order('name')
  ])

  if (bErr || sErr) {
    return res.status(500).json({ error: 'Failed to load catalog' })
  }

  const barbers = (barbersData || []).map((b) => ({
    id: b.id,
    name: b.name,
    role: b.role,
    initials: b.name.split(' ').map((w) => w[0]).join('').toUpperCase()
  }))

  const services = (servicesData || []).map((s) => ({
    id: s.id,
    name: s.name,
    duration: s.duration_min,
    price: s.price
  }))

  res.json({ barbers, services })
})

export default router
