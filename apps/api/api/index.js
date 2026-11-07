// Entry Vercel Functions (Root Directory proyek Vercel: apps/api). Lihat docs/DEVOPS.md § Deploy.
import { handle } from 'hono/vercel'
import { buatApp } from '../src/app.js'

export default handle(buatApp())
