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
import { keluaranAman } from '../apps/web/src/ai/pengaman.js'
import { draftDeskripsi } from '../apps/web/src/ai/deskripsi.js'
import { faktaLaporan, pesanLaporan } from '../apps/web/src/ai/pesan.js'

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
const semua = baris.map((b) => {
  const [file, label] = b.split(',')
  return { file, label }
})
// Foto "beres" (beres-<kategori>_*.jpg) hanya dipakai untuk evaluasi verifikasi, bukan klasifikasi.
const sampel = semua.filter((s) => s.label !== 'beres')
const sampelBeres = semua
  .filter((s) => s.label === 'beres')
  .map((s) => ({ ...s, kategori: s.file.split('_')[0].slice(6) }))
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
// 1b. Verifikasi (beres vs belum) dengan pasangan prompt yang sama seperti worker: foto masalah = "belum", foto beres = "beres".
const verifikasi = []
for (const s of [
  ...sampel.map((x) => ({ ...x, kategori: x.label, asli: 'belum' })),
  ...sampelBeres.map((x) => ({ ...x, asli: 'beres' })),
]) {
  const pasangan = cfgV.label.verifikasi[s.kategori] ?? cfgV.label.verifikasi.lainnya
  const out = await clf(await RawImage.read(akar(`./eval/images/${s.file}`)), [pasangan.beres, pasangan.belum])
  const skorBeres = out.find((o) => o.label === pasangan.beres).score
  verifikasi.push({
    file: s.file,
    kategori: s.kategori,
    asli: s.asli,
    prediksi: skorBeres >= 0.5 ? 'beres' : 'belum',
    skorBeres,
  })
}
const vBenar = verifikasi.filter((v) => v.prediksi === v.asli).length
const vKelas = (k) => {
  const xs = verifikasi.filter((v) => v.asli === k)
  return { n: xs.length, benar: xs.filter((v) => v.prediksi === k).length }
}
ringkas.verifikasi = {
  jumlahFoto: verifikasi.length,
  akurasi: vBenar / verifikasi.length,
  beres: vKelas('beres'),
  belum: vKelas('belum'),
  gerbang: 0.7,
  lulus: vBenar / verifikasi.length >= 0.7,
}

const pct = (x) => `${(x * 100).toFixed(1)}%`
mkdirSync(akar('./reports'), { recursive: true })
writeFileSync(
  akar(`./reports/${VISION}.json`),
  JSON.stringify({ ...ringkas, hasil, hasilVerifikasi: verifikasi }, null, 2) + '\n',
)
const rv = ringkas.verifikasi
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
  '## Verifikasi foto bukti (beres vs belum)',
  '',
  `Dipakai untuk tanda \`aiMeragukan\` (AI tidak pernah memutuskan sendiri). ${rv.belum.n} foto masalah (seharusnya "belum") + ${rv.beres.n} foto kondisi beres.`,
  '',
  '| Metrik | Nilai |',
  '| :-- | --: |',
  `| Akurasi | **${pct(rv.akurasi)}** (${vBenar}/${rv.jumlahFoto}) |`,
  `| Foto masalah dikenali "belum" | ${rv.belum.benar}/${rv.belum.n} |`,
  `| Foto beres dikenali "beres" | ${rv.beres.benar}/${rv.beres.n} |`,
  `| Gerbang (≥ 70%) | ${rv.lulus ? '✅ lulus' : '❌ belum lulus'} |`,
  '',
].join('\n')
writeFileSync(akar(`./reports/${VISION}.md`), md)
console.log(
  `CLIP top-1 ${pct(ringkas.akurasiTop1)} · top-3 ${pct(ringkas.akurasiTop3)} · median ${ringkas.latensiMedianMs} ms · verifikasi ${pct(rv.akurasi)} (beres ${rv.beres.benar}/${rv.beres.n}, belum ${rv.belum.benar}/${rv.belum.n})`,
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
    const fakta = faktaLaporan({
      kategoriLabel: label[kat],
      yakin: peringkat[0].yakin,
      detail: det,
      wilayah: w,
      bahaya: bahaya[kat],
    })
    const t2 = performance.now()
    const out = await gen(pesanLaporan(cfgL, fakta), cfgL.generasiLaporan)
    const msLlm = performance.now() - t2
    const teks = out[0].generated_text.at(-1).content.trim()
    const aman = keluaranAman(teks, fakta)
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
