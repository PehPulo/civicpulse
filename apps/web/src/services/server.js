// Alamat backend CivicPulse (apps/api). Semua data, login, dan AI SELALU lewat backend; tidak ada mode lokal.
//   VITE_API_URL terisi ⇒ dipakai apa adanya (mis. https://civicpulse.example.id/api/v1).
//   Kosong ⇒ pengembangan: http://localhost:8787/api/v1 · produksi: /api/v1 di domain yang sama
//   (web & API di belakang reverse proxy yang sama, mis. nginx/Cloudflare Tunnel di server Jetson).
const bawaan = import.meta.env.DEV ? 'http://localhost:8787/api/v1' : '/api/v1'
const rapikan = (u) => u.trim().replace(/\/$/, '')

export const URL_API = rapikan(import.meta.env.VITE_API_URL || bawaan)
/** Server AI: VITE_AI_URL bila AI dipisah ke mesin lain, selain itu backend yang sama. */
export const URL_AI = rapikan(import.meta.env.VITE_AI_URL || URL_API)
