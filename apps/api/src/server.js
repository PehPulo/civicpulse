// Server lokal untuk development: `npm run dev:api` ⇒ http://localhost:8787/api/v1/health
import { serve } from '@hono/node-server'
import { buatApp } from './app.js'
import { config } from './config.js'

serve({ fetch: buatApp().fetch, port: config.port }, (info) =>
  console.log(`CivicPulse API berjalan di http://localhost:${info.port}/api/v1`),
)
