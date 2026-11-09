// Server lokal untuk development: `npm run dev:api` ⇒ http://localhost:8787/api/v1/health
import { serve } from '@hono/node-server'
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

serve({ fetch: buatApp().fetch, port: config.port }, (info) => {
  console.log(`CivicPulse API berjalan di http://localhost:${info.port}/api/v1`)
  // Panaskan model computer vision saat server menyala, agar warga pertama tidak menunggu.
  muatVision()
    .then(() => console.log('Model computer vision siap.'))
    .catch((e) => console.warn('Model computer vision gagal dimuat:', e.message))
})
