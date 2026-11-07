// PEMILIK: Ezra · KONTRAK: docs/MLOPS.md § Gerbang rilis (LLM: tingkat lolos pengaman angka ≥ 80% pada 10 statistik berbeda)
// Menguji ringkasan Dasbor (Qwen) pada 10 statistik berbeda dengan prompt & pengaman yang SAMA dengan browser.
//   npx vite-node ml/eval-ringkasan.js   → ml/reports/ringkasan-<versi-llm>.md + .json
// (vite-node dipakai agar alias @civicpulse/* dan impor JSON milik apps/web ter-resolve seperti di aplikasi.)
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { pipeline } from '@huggingface/transformers'
import { statistik } from '@civicpulse/core'
import { pesanRingkasan } from '../apps/web/src/ai/pesan.js'
import { buatSeed } from '../apps/web/src/services/seed.js'
import { angkaTerjamin, faktaDasbor, ringkasanTemplate } from '../apps/web/src/ai/ringkasan.js'

const akar = (p) => fileURLToPath(new URL(p, import.meta.url))
const registry = JSON.parse(readFileSync(akar('./models.json'), 'utf8'))
const W = JSON.parse(readFileSync(akar('../data/processed/wilayah.json'), 'utf8')).wilayah
const LLM = registry.aktif.llm
const cfg = registry.model[LLM]
const HARI = 86400000
const T0 = Date.parse('2026-11-07T08:00:00.000Z')

// 10 statistik berbeda: subset laporan berbeda (60–100%) dan waktu pengamatan bergeser 0–27 hari.
let s = 7
const acak = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
const semua = buatSeed(W, T0)
const skenario = Array.from({ length: 10 }, (_, i) => {
  const simpan = 0.6 + 0.04 * i
  const laporan = semua.filter(() => acak() < simpan)
  return statistik(laporan, W, new Date(T0 + i * 3 * HARI).toISOString())
})

console.log(`Memuat ${cfg.hfId} (${cfg.dtype.wasm}, CPU)…`)
const gen = await pipeline(cfg.pipeline, cfg.hfId, { dtype: cfg.dtype.wasm })
const hasil = []
for (const [i, stat] of skenario.entries()) {
  const fakta = faktaDasbor(stat)
  const t = performance.now()
  const out = await gen(pesanRingkasan(cfg, fakta), cfg.generasi)
  const ms = Math.round(performance.now() - t)
  const teks = out[0].generated_text.at(-1).content.trim()
  const aman = angkaTerjamin(teks, fakta)
  hasil.push({ no: i + 1, fakta, ringkasan: teks, aman, ms, template: aman ? null : ringkasanTemplate(stat) })
  console.log(`#${i + 1} ${aman ? 'lolos' : 'DITOLAK → template'} (${ms} ms)`)
}
const lolos = hasil.filter((h) => h.aman).length
const ringkas = {
  model: LLM,
  tanggal: new Date().toISOString().slice(0, 10),
  jumlah: hasil.length,
  lolos,
  gerbang: 0.8,
  lulus: lolos / hasil.length >= 0.8,
}
writeFileSync(akar(`./reports/ringkasan-${LLM}.json`), JSON.stringify({ ...ringkas, hasil }, null, 2) + '\n')
writeFileSync(
  akar(`./reports/ringkasan-${LLM}.md`),
  [
    `# Evaluasi ringkasan Dasbor · ${LLM}`,
    '',
    `> Dibuat otomatis oleh \`npx vite-node ml/eval-ringkasan.js\` pada ${ringkas.tanggal}. 10 statistik berbeda dari data demo; prompt \`prompt.sistem\` di \`ml/models.json\`.`,
    '',
    `**Lolos pengaman angka: ${lolos}/${hasil.length}** (gerbang ≥ 80%: ${ringkas.lulus ? '✅ lulus' : '❌ belum lulus'}). Yang ditolak otomatis diganti ringkasan template di aplikasi.`,
    '',
    ...hasil.flatMap((h) => [
      `## #${h.no} · ${h.aman ? '✅ lolos' : '❌ ditolak'} · ${h.ms} ms`,
      '',
      '```',
      h.fakta,
      '```',
      '',
      `> ${h.ringkasan.replace(/\n+/g, ' ')}`,
      '',
    ]),
  ].join('\n'),
)
console.log(`Ringkasan Dasbor: lolos ${lolos}/${hasil.length}`)
