// Server Node CivicPulse.
//   Pengembangan: `npm run dev:api` ⇒ API di http://localhost:8787/api/v1 (web dari Vite :5173).
//   Produksi (NODE_ENV=production, mis. server Jetson): SATU proses menyajikan web hasil build (apps/web/dist) di `/`
//   dan API di `/api/v1`, mendengarkan hanya di HOST (bawaan 127.0.0.1) ⇒ dibuka ke internet lewat reverse proxy /
//   terowongan (lihat deploy/README.md). Web memanggil `/api/v1` di domain yang sama (services/server.js).
import { existsSync } from 'node:fs'
import { relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { buatApp } from './app.js'
import { config } from './config.js'
import { muatVision } from './ai/vision.js'
import { buatSeed } from '@civicpulse/core'
import { W } from './lib/wilayah.js'
import { _resetMemori } from './repositories/laporan.js'

// Tanpa Supabase (laptop/demo): isi penyimpanan memori dengan data demo (buatSeed di core).
// Data memori hilang saat server dimatikan. Matikan dengan DEMO_SEED=false.
if (!(config.supabaseUrl && config.supabaseServiceKey) && process.env.DEMO_SEED !== 'false') {
  _resetMemori(buatSeed(W))
  console.log('Mode memori: data demo dimuat (tanpa Supabase).')
}

const api = buatApp()
const DIST = fileURLToPath(new URL('../../web/dist', import.meta.url))
const sajikanWeb = config.sajikanWeb && existsSync(`${DIST}/index.html`)

/** Web statis + fallback SPA (rute React seperti /peta, /instansi/...) dengan header keamanan. */
function buatWeb() {
  const akar = relative(process.cwd(), DIST) || '.'
  const web = new Hono()
  web.use('*', async (c, next) => {
    await next()
    c.header('X-Content-Type-Options', 'nosniff')
    c.header('X-Frame-Options', 'DENY')
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin')
    c.header('Permissions-Policy', 'camera=(self), geolocation=(self), microphone=(), payment=()')
    c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    c.header('Cross-Origin-Opener-Policy', 'same-origin')
    if (c.req.path.startsWith('/assets/')) c.header('Cache-Control', 'public, max-age=31536000, immutable')
  })
  web.use('*', serveStatic({ root: akar }))
  web.get('*', serveStatic({ path: `${akar}/index.html` }))
  return web
}

const web = sajikanWeb ? buatWeb() : null
const fetch = (req, ...env) =>
  web && !new URL(req.url).pathname.startsWith('/api/') ? web.fetch(req, ...env) : api.fetch(req, ...env)

serve({ fetch, port: config.port, hostname: config.host }, (info) => {
  console.log(`CivicPulse API berjalan di http://${config.host}:${info.port}/api/v1`)
  if (sajikanWeb) console.log(`Web disajikan dari ${DIST} di http://${config.host}:${info.port}/`)
  else if (config.sajikanWeb) console.warn(`Web belum di-build (${DIST}). Jalankan: npm run build`)
  // Panaskan model computer vision saat server menyala, agar warga pertama tidak menunggu.
  muatVision()
    .then(() => console.log('Model computer vision siap.'))
    .catch((e) => console.warn('Model computer vision gagal dimuat:', e.message))
})
