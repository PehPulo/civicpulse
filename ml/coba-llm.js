// PEMILIK: Ezra · Coba LLM (Groq) sekali jalan, dengan prompt, fakta, dan pengaman yang SAMA dengan server.
//
//   npm run ai:llm            # statistik dari data demo hari ini
//   npm run ai:llm -- 14      # statistik 14 hari ke depan (data berbeda ⇒ ringkasan berbeda)
//
// Memakai 1 panggilan (±700 token) dari kuota gratis Groq. Kunci dibaca dari .env (GROQ_API_KEY), tidak dicetak.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { bahanDasbor, faktaDasbor, keluaranAman, statistik } from '@civicpulse/core'
import { buatSeed } from '../apps/web/src/services/seed.js'
import { konfigLlm, tulisRingkasan } from '../apps/api/src/ai/groq.js'

const W = JSON.parse(
  readFileSync(fileURLToPath(new URL('../data/processed/wilayah.json', import.meta.url)), 'utf8'),
).wilayah
const geser = Number(process.argv[2] ?? 0)
const T0 = Date.parse('2026-11-07T08:00:00.000Z')
const stat = statistik(buatSeed(W, T0), W, new Date(T0 + geser * 86400000).toISOString())
const fakta = faktaDasbor(bahanDasbor(stat), W)
const cfg = konfigLlm()

console.log(`Model: ${cfg.versi} (${cfg.modelId} di Groq)\n\nFakta yang dilihat LLM:\n${fakta}\n`)
try {
  const r = await tulisRingkasan(fakta, { apiKey: process.env.GROQ_API_KEY })
  const aman = keluaranAman(r.teks, fakta)
  console.log(`Ringkasan AI (${r.ms} ms, ${r.token} token):\n${r.teks}\n`)
  console.log(
    aman
      ? '✅ Lolos pengaman: semua angka ada di fakta.'
      : '❌ Ditolak pengaman ⇒ aplikasi menampilkan ringkasan berbasis aturan.',
  )
} catch (e) {
  console.log(`Gagal memanggil Groq: ${e.message}\nAplikasi akan menampilkan ringkasan berbasis aturan.`)
}
