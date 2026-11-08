// PEMILIK: Ezra (AI) · KONTRAK: docs/AI.md § Worker
//
// Web Worker AI: semua model berjalan di sini agar UI tidak macet.
//   masuk  { id, tugas: 'pemanasan' | 'klasifikasi' | 'detail' | 'verifikasi', payload }
//   keluar { id, hasil } | { id, error }  ·  { tipe: 'progres', model, persen, status }  (broadcast unduhan)
//
// Model, label prompt, dan konfigurasi dibaca dari ml/models.json (registry MLOps, dikelola Ezra).
import { pipeline, RawImage } from '@huggingface/transformers'
import registry from '../../../../ml/models.json'

const VISION = registry.aktif.vision
const cfgVision = registry.model[VISION]

// Progres per file (satu model terdiri dari beberapa file); UI menjumlahkan loaded/total untuk menampilkan MB.
const progres = (model) => (p) => {
  if (p.status === 'progress' || p.status === 'ready' || p.status === 'done')
    self.postMessage({
      tipe: 'progres',
      model,
      status: p.status,
      persen: Math.round(p.progress ?? 100),
      file: p.file,
      loaded: p.loaded,
      total: p.total,
    })
}

// Pipeline dimuat sekali (lazy) lalu dipakai ulang; file model di-cache browser (Cache Storage).
let visionP = null

function muatVision() {
  visionP ??= pipeline(cfgVision.pipeline, cfgVision.hfId, {
    dtype: cfgVision.dtype,
    progress_callback: progres('vision'),
  }).catch((e) => {
    visionP = null
    throw e
  })
  return visionP
}

async function klasifikasi({ file }) {
  const clf = await muatVision()
  const label = cfgVision.label.klasifikasi
  const kategori = Object.keys(label)
  const out = await clf(await RawImage.fromBlob(file), Object.values(label))
  const peringkat = out.map((o) => ({ kategoriId: kategori[Object.values(label).indexOf(o.label)], yakin: o.score }))
  return { ...peringkat[0], top3: peringkat.slice(0, 3), modelVersi: VISION }
}

// Detail kondisi di foto untuk kategori terpilih ⇒ bahan draf deskripsi (docs/AI.md § Draf deskripsi).
async function detail({ file, kategoriId }) {
  const clf = await muatVision()
  const daftar = cfgVision.label.detail?.[kategoriId] ?? []
  if (!daftar.length) return { detail: [], modelVersi: VISION }
  const out = await clf(
    await RawImage.fromBlob(file),
    daftar.map((d) => d.prompt),
  )
  const peringkat = out.map((o) => {
    const d = daftar.find((x) => x.prompt === o.label)
    return { id: d.id, kalimat: d.kalimat, yakin: o.score }
  })
  return { detail: peringkat, modelVersi: VISION }
}

async function verifikasi({ file, kategoriId }) {
  const clf = await muatVision()
  const { beres, belum } = cfgVision.label.verifikasi[kategoriId] ?? cfgVision.label.verifikasi.lainnya
  const out = await clf(await RawImage.fromBlob(file), [beres, belum])
  const skorBeres = out.find((o) => o.label === beres).score
  return { beres: skorBeres >= 0.5, yakin: Math.max(skorBeres, 1 - skorBeres), modelVersi: VISION }
}

const TUGAS = {
  pemanasan: async () => {
    await muatVision()
    return { siap: true }
  },
  klasifikasi,
  detail,
  verifikasi,
}

self.onmessage = async ({ data: { id, tugas, payload } }) => {
  try {
    const fn = TUGAS[tugas]
    if (!fn) throw new Error(`Tugas AI tidak dikenal: ${tugas}`)
    self.postMessage({ id, hasil: await fn(payload) })
  } catch (e) {
    self.postMessage({ id, error: e?.message ?? String(e) })
  }
}
