// GET /statistik
// Kontrak: docs/API.md § GET /statistik & SCORING.md § Analitik
import { Hono } from 'hono'
import { W } from '../lib/wilayah.js'
import { statistik as hitungStatistik } from '@civicpulse/core'
import * as repo from '../repositories/laporan.js'

export const statistik = new Hono().get('/', async (c) => {
  const semuaLaporan = await repo.semua()
  const data = hitungStatistik(semuaLaporan, W)

  c.header('Cache-Control', 'public, max-age=60')
  return c.json({ data })
})
