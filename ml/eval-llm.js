// PEMILIK: Ezra · KONTRAK: docs/MLOPS.md § Gerbang rilis (LLM: lolos pengaman keluaranAman ≥ 80% pada 10 statistik berbeda)
// Menguji ringkasan Dasbor lewat Groq dengan kode, prompt, dan pengaman yang SAMA dengan server (apps/api/src/ai).
//
//   node --env-file=.env ml/eval-llm.js                          # model aktif di ml/models.json
//   node --env-file=.env ml/eval-llm.js groq-gpt-oss-20b-v1 ...  # bandingkan beberapa versi
//
// Keluaran: ml/reports/ringkasan-<versi>.md + .json. Memakai ±10 panggilan (±5–10 ribu token) per model.
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { bahanDasbor, faktaDasbor, keluaranAman, statistik } from '@civicpulse/core'
import { buatSeed } from '../apps/web/src/services/seed.js'
import { konfigLlm, tulisRingkasan } from '../apps/api/src/ai/groq.js'

const akar = (p) => fileURLToPath(new URL(p, import.meta.url))
const registry = JSON.parse(readFileSync(akar('./models.json'), 'utf8'))
const W = JSON.parse(readFileSync(akar('../data/processed/wilayah.json'), 'utf8')).wilayah
const HARI = 86400000
const T0 = Date.parse('2026-11-07T08:00:00.000Z')
const versiDiuji = process.argv.slice(2).length ? process.argv.slice(2) : [registry.aktif.llm]

// 10 statistik berbeda: subset laporan berbeda (60–96%) dan waktu pengamatan bergeser 0–27 hari.
let s = 7
const acak = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
const semua = buatSeed(W, T0)
const skenario = Array.from({ length: 10 }, (_, i) => {
  const simpan = 0.6 + 0.04 * i
  const laporan = semua.filter(() => acak() < simpan)
  return statistik(laporan, W, new Date(T0 + i * 3 * HARI).toISOString())
})

for (const versi of versiDiuji) {
  const cfg = konfigLlm(versi)
  console.log(`\n== ${versi} (${cfg.modelId})`)
  const hasil = []
  for (const [i, stat] of skenario.entries()) {
    const fakta = faktaDasbor(bahanDasbor(stat), W)
    try {
      const r = await tulisRingkasan(fakta, { apiKey: process.env.GROQ_API_KEY, versi })
      const aman = keluaranAman(r.teks, fakta)
      hasil.push({ no: i + 1, fakta, ringkasan: r.teks, aman, token: r.token, ms: r.ms })
      console.log(`#${i + 1} ${aman ? 'lolos' : 'DITOLAK'} · ${r.token} token · ${r.ms} ms`)
    } catch (e) {
      hasil.push({ no: i + 1, fakta, ringkasan: null, aman: false, galat: e.message })
      console.log(`#${i + 1} GAGAL: ${e.message}`)
    }
  }
  const lolos = hasil.filter((h) => h.aman).length
  const token = hasil.reduce((a, h) => a + (h.token ?? 0), 0)
  const msMedian = hasil
    .map((h) => h.ms)
    .filter(Boolean)
    .sort((a, b) => a - b)[Math.floor(hasil.length / 2)]
  const ringkas = {
    model: versi,
    modelId: cfg.modelId,
    tanggal: new Date().toISOString().slice(0, 10),
    jumlah: hasil.length,
    lolos,
    gerbang: 0.8,
    lulus: lolos / hasil.length >= 0.8,
    tokenTotal: token,
    tokenRata: Math.round(token / hasil.length),
    latensiMedianMs: msMedian ?? null,
  }
  writeFileSync(akar(`./reports/ringkasan-${versi}.json`), JSON.stringify({ ...ringkas, hasil }, null, 2) + '\n')
  writeFileSync(
    akar(`./reports/ringkasan-${versi}.md`),
    [
      `# Evaluasi ringkasan Dasbor · ${versi}`,
      '',
      `> Dibuat otomatis oleh \`node --env-file=.env ml/eval-llm.js\` pada ${ringkas.tanggal}. Model Groq \`${cfg.modelId}\`, 10 statistik berbeda dari data demo, pengaman \`keluaranAman\` (sama dengan server).`,
      '',
      `**Lolos pengaman: ${lolos}/${hasil.length}** (gerbang ≥ 80%: ${ringkas.lulus ? '✅ lulus' : '❌ belum lulus'}) · rata-rata ${ringkas.tokenRata} token/ringkasan · latensi median ${ringkas.latensiMedianMs} ms. Yang ditolak otomatis diganti ringkasan template di aplikasi.`,
      '',
      ...hasil.flatMap((h) => [
        `## #${h.no} · ${h.aman ? '✅ lolos' : '❌ ditolak'}${h.ms ? ` · ${h.ms} ms · ${h.token} token` : ''}`,
        '',
        '```',
        h.fakta,
        '```',
        '',
        `> ${h.ringkasan ? h.ringkasan.replace(/\n+/g, ' ') : `(gagal: ${h.galat})`}`,
        '',
      ]),
    ].join('\n'),
  )
  console.log(`${versi}: lolos ${lolos}/${hasil.length} · ${ringkas.tokenRata} token/ringkasan · median ${msMedian} ms`)
}
