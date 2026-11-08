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
import { securityHeaders } from './middleware/security.js'
import { buatRateLimiter } from './middleware/rate-limiter.js'
import { wilayah } from './routes/wilayah.js'
import { laporan } from './routes/laporan.js'
import { statistik } from './routes/statistik.js'
import { auth } from './routes/auth.js'
import { unggah } from './routes/unggah.js'
import { buatRuteAi } from './routes/ai.js'
import { renderSwaggerUi } from './routes/docs.js'
import openapiSpec from './openapi.json' with { type: 'json' }

export const VERSI_API = '1.0.0'

export function buatApp() {
  const root = new Hono()

  // Redirect root / ke Swagger UI docs
  root.get('/', (c) => c.redirect('/api/v1/docs'))

  const app = new Hono()

  // 1. Logging & Observability
  app.use('*', logger())

  // 2. HTTP Security Hardening (Anti-clickjacking, MIME-sniffing, XSS protection)
  app.use('*', securityHeaders)

  // 3. DDoS / Brute-force IP Rate Limiter (120 req/menit per IP)
  app.use('*', buatRateLimiter({ batas: 120, jendelaMs: 60 * 1000 }))

  // 4. CORS terisolasi
  app.use(
    '*',
    cors({
      origin: config.corsOrigin,
      allowHeaders: ['Content-Type', 'Authorization', 'X-Device-Id'],
      exposeHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
    }),
  )

  app.onError(tanganiGalat)

  // Dokumentasi Swagger UI & OpenAPI Specification
  app.get('/openapi.json', (c) => c.json(openapiSpec))
  app.get('/docs', (c) => c.html(renderSwaggerUi({ title: 'CivicPulse API Docs', specUrl: '/api/v1/openapi.json' })))

  app.get('/health', (c) =>
    c.json({ data: { ok: true, mode: 'server', versi: VERSI_API, waktu: new Date().toISOString() } }),
  )

  app.route('/wilayah', wilayah)
  app.route('/laporan', laporan)
  app.route('/statistik', statistik)
  app.route('/auth', auth)
  app.route('/unggah', unggah)
  app.route('/ai', buatRuteAi())

  // Not found handler di scope /api/v1
  app.notFound((c) => c.json({ error: { kode: 'TIDAK_DITEMUKAN', pesan: 'Endpoint tidak ada.' } }, 404))

  root.route('/api/v1', app)
  root.notFound((c) => c.json({ error: { kode: 'TIDAK_DITEMUKAN', pesan: 'Endpoint tidak ada.' } }, 404))

  return root
}
