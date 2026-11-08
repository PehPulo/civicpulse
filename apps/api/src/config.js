// Semua env var backend dibaca DI SINI saja (docs/DEVOPS.md § Environment variable).
import { randomBytes } from 'node:crypto'

const env = (k, bawaan) => process.env[k] ?? bawaan
const PRODUKSI = env('NODE_ENV') === 'production'

// Rahasia instansi: di produksi WAJIB diisi (server menolak menyala). Di laptop (dev) bila kosong:
// JWT_SECRET acak per proses (tidak pernah konstanta yang diketahui publik), PIN demo '2026'.
function rahasia(k, bawaanDev) {
  const v = env(k)
  if (v) return v
  if (PRODUKSI) throw new Error(`${k} wajib diisi di produksi (lihat docs/DEVOPS.md).`)
  return bawaanDev()
}

export const config = {
  corsOrigin: env('CORS_ORIGIN', 'http://localhost:5173').split(','),
  supabaseUrl: env('SUPABASE_URL'),
  supabaseServiceKey: env('SUPABASE_SERVICE_KEY'),
  instansiPin: rahasia('INSTANSI_PIN', () => '2026'),
  jwtSecret: rahasia('JWT_SECRET', () => randomBytes(32).toString('hex')),
  // true HANYA bila API di belakang reverse proxy tepercaya (Vercel, Tailscale Funnel, nginx) yang mengisi
  // X-Forwarded-For. false ⇒ IP diambil dari koneksi TCP, sehingga header palsu tidak bisa mengakali batas laju.
  percayaProxy: env('PERCAYA_PROXY', process.env.VERCEL ? 'true' : 'false') === 'true',
  // Batas percobaan PIN instansi per IP per 15 menit (anti tebak PIN).
  batasLoginPer15Menit: Number(env('AUTH_BATAS_PER_15_MENIT', 10)),
  port: Number(env('PORT', 8787)),
  // LLM (Groq). Kunci HANYA di server; tanpa kunci ⇒ endpoint AI menjawab "template" (aplikasi tetap jalan).
  groqApiKey: env('GROQ_API_KEY'),
  ai: {
    batasPerMenitPerIp: Number(env('AI_BATAS_PER_MENIT', 5)),
    batasFotoPerMenitPerIp: Number(env('AI_BATAS_FOTO_PER_MENIT', 30)), // 1 laporan ≈ 2–3 analisis foto
    batasTokenHarian: Number(env('AI_BATAS_TOKEN_HARIAN', 150000)), // di bawah kuota gratis Groq (±200 ribu/hari)
    cacheMenit: Number(env('AI_CACHE_MENIT', 15)),
  },
}
