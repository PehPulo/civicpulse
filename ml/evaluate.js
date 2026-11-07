// PEMILIK: Ezra · KONTRAK: docs/MLOPS.md
// Evaluasi model AI CivicPulse di Node dengan model, dtype, dan label yang SAMA dengan browser (ml/models.json).
//
//   node ml/evaluate.js                 # evaluasi CLIP pada ml/eval (akurasi, confusion matrix, latensi)
//   node ml/evaluate.js --percobaan 10  # + N percobaan ujung ke ujung: foto → CLIP → Qwen → pengaman angka
//
// Keluaran: ml/reports/<versi-vision>.md + .json, ml/reports/percobaan.json (dipakai ml/video/buat-video.js)
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { pipeline, RawImage, env } from '@huggingface/transformers'
import { angkaTerjamin } from '../apps/web/src/ai/pengaman.js'
import { draftDeskripsi } from '../apps/web/src/ai/deskripsi.js'

env.allowLocalModels = false
const akar = (p) => fileURLToPath(new URL(p, import.meta.url))
const registry = JSON.parse(readFileSync(akar('./models.json'), 'utf8'))
const wilayahData = JSON.parse(readFileSync(akar('../data/processed/wilayah.json'), 'utf8'))
const VISION = registry.aktif.vision
const LLM = registry.aktif.llm
const cfgV = registry.model[VISION]
const cfgL = registry.model[LLM]
const argPercobaan = process.argv.indexOf('--percobaan')
const N_PERCOBAAN = argPercobaan > 0 ? Number(process.argv[argPercobaan + 1] ?? 10) : 0

const baris = readFileSync(akar('./eval/labels.csv'), 'utf8').trim().split(/\r?\n/).slice(1)
const sampel = baris.map((b) => {
  const [file, label] = b.split(',')
  return { file, label }
})
const KATEGORI = Object.keys(cfgV.label.klasifikasi)
const PROMPT = Object.values(cfgV.label.klasifikasi)

console.log(`Memuat ${cfgV.hfId} (${cfgV.dtype})…`)
const clf = await pipeline(cfgV.pipeline, cfgV.hfId, { dtype: cfgV.dtype })

async function klasifikasi(path) {
  const img = await RawImage.read(path)
  const t0 = performance.now()
  const out = await clf(img, PROMPT)
  const ms = performance.now() - t0
  const peringkat = out.map((o) => ({ kategoriId: KATEGORI[PROMPT.indexOf(o.label)], yakin: o.score }))
  return { img, peringkat, ms }
}

async function detail(img, kategoriId) {
  const daftar = cfgV.label.detail[kategoriId] ?? []
  if (!daftar.length) return []
  const out = await clf(
    img,
    daftar.map((d) => d.prompt),
  )
  return out.map((o) => ({ ...daftar.find((d) => d.prompt === o.label), yakin: o.score }))
}

// 1. Evaluasi klasifikasi
const hasil = []
for (const s of sampel) {
  const { peringkat, ms } = await klasifikasi(akar(`./eval/images/${s.file}`))
  hasil.push({ ...s, prediksi: peringkat[0].kategoriId, yakin: peringkat[0].yakin, top3: peringkat.slice(0, 3), ms })
  process.stdout.write(peringkat[0].kategoriId === s.label ? '.' : 'x')
}
console.log()

const kelas = KATEGORI.filter((k) => sampel.some((s) => s.label === k))
const benar = hasil.filter((h) => h.prediksi === h.label).length
const top3 = hasil.filter((h) => h.top3.some((t) => t.kategoriId === h.label)).length
const matriks = Object.fromEntries(kelas.map((a) => [a, Object.fromEntries(KATEGORI.map((b) => [b, 0]))]))
for (const h of hasil) matriks[h.label][h.prediksi]++
const perKelas = kelas.map((k) => {
  const tp = matriks[k][k]
  const n = hasil.filter((h) => h.label === k).length
  const prediksiK = hasil.filter((h) => h.prediksi === k).length
  return { kelas: k, n, recall: tp / n, presisi: prediksiK ? tp / prediksiK : 0 }
})
const latensi = hasil.map((h) => h.ms).sort((a, b) => a - b)
const median = latensi[Math.floor(latensi.length / 2)]
const ringkas = {
  model: VISION,
  hfId: cfgV.hfId,
  dtype: cfgV.dtype,
  tanggal: new Date().toISOString().slice(0, 10),
  jumlahFoto: hasil.length,
  akurasiTop1: benar / hasil.length,
  akurasiTop3: top3 / hasil.length,
  latensiMedianMs: Math.round(median),
  gerbang: 0.75,
  lulus: benar / hasil.length >= 0.75,
  perKelas,
  matriks,
}
const pct = (x) => `${(x * 100).toFixed(1)}%`
mkdirSync(akar('./reports'), { recursive: true })
writeFileSync(akar(`./reports/${VISION}.json`), JSON.stringify({ ...ringkas, hasil }, null, 2) + '\n')
const md = [
  `# Laporan evaluasi ${VISION}`,
  '',
  `> Dibuat otomatis oleh \`node ml/evaluate.js\` pada ${ringkas.tanggal}. Model \`${cfgV.hfId}\` (${cfgV.dtype}), label dari \`ml/models.json\`.`,
  `> Dataset: ${hasil.length} foto asli berlisensi bebas dari Wikimedia Commons, dikurasi manual (atribusi: \`ml/eval/sumber.csv\`).`,
  ...(cfgV.$catatan ? ['', `> Catatan: ${cfgV.$catatan}`] : []),
  '',
  '| Metrik | Nilai |',
  '| :-- | --: |',
  `| Akurasi top-1 | **${pct(ringkas.akurasiTop1)}** (${benar}/${hasil.length}) |`,
  `| Akurasi top-3 | ${pct(ringkas.akurasiTop3)} |`,
  `| Latensi median per foto (CPU Node, tanpa unduh model) | ${ringkas.latensiMedianMs} ms |`,
  `| Gerbang rilis (top-1 ≥ 75%) | ${ringkas.lulus ? '✅ lulus' : '❌ belum lulus'} |`,
  '',
  '## Per kelas',
  '',
  '| Kelas | Foto | Recall | Presisi |',
  '| :-- | --: | --: | --: |',
  ...perKelas.map((p) => `| ${p.kelas} | ${p.n} | ${pct(p.recall)} | ${pct(p.presisi)} |`),
  '',
  '## Confusion matrix (baris = label asli, kolom = prediksi)',
  '',
  `| | ${KATEGORI.join(' | ')} |`,
  `| :-- | ${KATEGORI.map(() => '--:').join(' | ')} |`,
  ...kelas.map((k) => `| **${k}** | ${KATEGORI.map((b) => matriks[k][b]).join(' | ')} |`),
  '',
  '## Salah klasifikasi',
  '',
  '| Foto | Label | Prediksi | Yakin |',
  '| :-- | :-- | :-- | --: |',
  ...hasil
    .filter((h) => h.prediksi !== h.label)
    .map((h) => `| ${h.file} | ${h.label} | ${h.prediksi} | ${pct(h.yakin)} |`),
  '',
].join('\n')
writeFileSync(akar(`./reports/${VISION}.md`), md)
console.log(
  `CLIP top-1 ${pct(ringkas.akurasiTop1)} · top-3 ${pct(ringkas.akurasiTop3)} · median ${ringkas.latensiMedianMs} ms`,
)

// 2. Percobaan ujung ke ujung: CLIP (kategori + kondisi) → Qwen menulis ringkasan laporan → pengaman angka
if (N_PERCOBAAN > 0) {
  console.log(`Memuat ${cfgL.hfId} (${cfgL.dtype.wasm}, CPU)…`)
  const gen = await pipeline(cfgL.pipeline, cfgL.hfId, { dtype: cfgL.dtype.wasm })
  const label = {
    drainase: 'Drainase tersumbat',
    banjir: 'Banjir/genangan',
    jalan: 'Jalan rusak',
    longsor: 'Longsor',
    lainnya: 'Fasilitas umum rusak',
  }
  const bahaya = { drainase: 'banjir', banjir: 'banjir', jalan: 'jalan', longsor: 'longsor', lainnya: 'jalan' }
  // Ambil foto berselang-seling antarkelas agar percobaan mewakili semua kategori.
  const urut = kelas.flatMap((k, i) => sampel.filter((s) => s.label === k).map((s, j) => ({ ...s, kunci: j * 10 + i })))
  const pilih = urut.sort((a, b) => a.kunci - b.kunci).slice(0, N_PERCOBAAN)
  const percobaan = []
  for (const [i, s] of pilih.entries()) {
    const w = wilayahData.wilayah[i % wilayahData.wilayah.length]
    const { img, peringkat, ms } = await klasifikasi(akar(`./eval/images/${s.file}`))
    const kat = peringkat[0].kategoriId
    const t1 = performance.now()
    const det = await detail(img, kat)
    const msDetail = performance.now() - t1
    const draf = draftDeskripsi({ kategoriLabel: label[kat], detail: det.slice(0, 2), wilayah: w })
    const fakta = [
      `- Jenis masalah menurut AI foto: ${label[kat]} (keyakinan ${Math.round(peringkat[0].yakin * 100)}%)`,
      `- Kondisi terlihat: ${det
        .slice(0, 2)
        .map((d) => d.kalimat.toLowerCase())
        .join('; ')}`,
      `- Lokasi: Kecamatan ${w.kecamatan}, ${w.kabupaten}`,
      `- Risiko ${bahaya[kat]} wilayah: ${w.risiko[bahaya[kat]]} dari 100 (BNPB)`,
      `- Penduduk miskin ${w.kabupaten}: ${String(w.miskin).replace('.', ',')}% (BPS)`,
    ].join('\n')
    const t2 = performance.now()
    const out = await gen(
      [
        { role: 'system', content: cfgL.prompt.laporan },
        { role: 'user', content: `Fakta laporan:\n${cfgL.prompt.contohLaporan.fakta}\n\nRingkasan untuk instansi:` },
        { role: 'assistant', content: cfgL.prompt.contohLaporan.jawaban },
        { role: 'user', content: `Fakta laporan:\n${fakta}\n\nRingkasan untuk instansi:` },
      ],
      cfgL.generasiLaporan,
    )
    const msLlm = performance.now() - t2
    const teks = out[0].generated_text.at(-1).content.trim()
    const aman = angkaTerjamin(teks, fakta)
    percobaan.push({
      no: i + 1,
      file: s.file,
      labelAsli: s.label,
      prediksi: kat,
      benar: kat === s.label,
      top3: peringkat.slice(0, 3),
      detail: det.slice(0, 2).map((d) => ({ kalimat: d.kalimat, yakin: d.yakin })),
      draf,
      wilayah: { kecamatan: w.kecamatan, kabupaten: w.kabupaten },
      fakta,
      llm: teks,
      angkaAman: aman,
      ms: { clip: Math.round(ms), detail: Math.round(msDetail), llm: Math.round(msLlm) },
    })
    console.log(
      `#${i + 1} ${s.file}: ${s.label} → ${kat} · LLM ${aman ? 'aman' : 'DITOLAK pengaman'} (${Math.round(msLlm)} ms)`,
    )
  }
  const lolos = percobaan.filter((p) => p.angkaAman).length
  writeFileSync(
    akar('./reports/percobaan.json'),
    JSON.stringify(
      {
        tanggal: new Date().toISOString().slice(0, 10),
        vision: VISION,
        llm: LLM,
        catatan:
          'Lokasi tiap percobaan diambil bergiliran dari kecamatan pilot (data wilayah asli) untuk menguji LLM; foto tidak berasal dari lokasi tersebut.',
        ringkasan: {
          jumlah: percobaan.length,
          clipBenar: percobaan.filter((p) => p.benar).length,
          llmLolosPengaman: lolos,
        },
        percobaan,
      },
      null,
      2,
    ) + '\n',
  )
  console.log(
    `Percobaan: CLIP benar ${percobaan.filter((p) => p.benar).length}/${percobaan.length} · LLM lolos pengaman ${lolos}/${percobaan.length}`,
  )
}
