// PEMILIK IMPLEMENTASI: Albert · KONTRAK: docs/API.md, docs/openapi.yaml (dirancang Ezra)
//
// Aturan arsitektur (docs/ARCHITECTURE.md):
//   routes/       → parsing HTTP & validasi bentuk request, TANPA aturan bisnis
//   @civicpulse/core → SEMUA aturan bisnis (skor, status, verifikasi, analitik)
//   repositories/ → akses data (Supabase). Satu-satunya lapisan yang tahu database.
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { config } from './config.js'
import { tanganiGalat } from './middleware/galat.js'
import { wilayah } from './routes/wilayah.js'
import { laporan } from './routes/laporan.js'
import { statistik } from './routes/statistik.js'
import { auth } from './routes/auth.js'
import { unggah } from './routes/unggah.js'

export const VERSI_API = '1.0.0'

export function buatApp() {
  const app = new Hono().basePath('/api/v1')
  app.use('*', logger())
  app.use('*', cors({ origin: config.corsOrigin, allowHeaders: ['Content-Type', 'Authorization', 'X-Device-Id'] }))
  app.onError(tanganiGalat)
  app.notFound((c) => c.json({ error: { kode: 'TIDAK_DITEMUKAN', pesan: 'Endpoint tidak ada.' } }, 404))

  app.get('/health', (c) =>
    c.json({ data: { ok: true, mode: 'server', versi: VERSI_API, waktu: new Date().toISOString() } }),
  )
  app.route('/wilayah', wilayah)
  app.route('/laporan', laporan)
  app.route('/statistik', statistik)
  app.route('/auth', auth)
  app.route('/unggah', unggah)
  return app
}
