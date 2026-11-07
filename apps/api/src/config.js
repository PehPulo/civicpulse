// Semua env var backend dibaca DI SINI saja (docs/DEVOPS.md § Environment variable).
const env = (k, bawaan) => process.env[k] ?? bawaan

export const config = {
  corsOrigin: env('CORS_ORIGIN', 'http://localhost:5173').split(','),
  supabaseUrl: env('SUPABASE_URL'),
  supabaseServiceKey: env('SUPABASE_SERVICE_KEY'),
  instansiPin: env('INSTANSI_PIN'),
  jwtSecret: env('JWT_SECRET'),
  port: Number(env('PORT', 8787)),
}
