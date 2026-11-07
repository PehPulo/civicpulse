// GET /statistik
// Kontrak: docs/API.md § GET /statistik & SCORING.md § Analitik
import { Hono } from 'hono'
import wilayahData from '@civicpulse/data/wilayah.json' with { type: 'json' }
import { statistik as hitungStatistik } from '@civicpulse/core'
import * as repo from '../repositories/laporan.js'

const W = wilayahData.wilayah

export const statistik = new Hono().get('/', async (c) => {
  const semuaLaporan = await repo.semua()
  const data = hitungStatistik(semuaLaporan, W)

  c.header('Cache-Control', 'public, max-age=60')
  return c.json({ data })
})
