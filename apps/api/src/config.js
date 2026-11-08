// Semua env var backend dibaca DI SINI saja (docs/DEVOPS.md § Environment variable).
const env = (k, bawaan) => process.env[k] ?? bawaan

export const config = {
  corsOrigin: env('CORS_ORIGIN', 'http://localhost:5173').split(','),
  supabaseUrl: env('SUPABASE_URL'),
  supabaseServiceKey: env('SUPABASE_SERVICE_KEY'),
  instansiPin: env('INSTANSI_PIN'),
  jwtSecret: env('JWT_SECRET'),
  port: Number(env('PORT', 8787)),
  // LLM (Groq). Kunci HANYA di server; tanpa kunci ⇒ endpoint AI menjawab "template" (aplikasi tetap jalan).
  groqApiKey: env('GROQ_API_KEY'),
  ai: {
    batasPerMenitPerIp: Number(env('AI_BATAS_PER_MENIT', 5)),
    batasTokenHarian: Number(env('AI_BATAS_TOKEN_HARIAN', 150000)), // di bawah kuota gratis Groq (±200 ribu/hari)
    cacheMenit: Number(env('AI_CACHE_MENIT', 15)),
  },
}
