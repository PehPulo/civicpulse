// PEMILIK: Ezra (AI) · KONTRAK: docs/AI.md § Computer vision · Ditinjau: Albert
// Computer vision (CLIP zero-shot) di SERVER, agar perangkat warga tidak perlu mengunduh model (0 MB).
// Model, label, dan logika SAMA dengan yang dievaluasi di ml/evaluate.js (registry ml/models.json).
// Foto hanya diproses di memori lalu dibuang; tidak disimpan dan tidak dikirim ke layanan pihak ketiga.
import { pipeline, RawImage } from '@huggingface/transformers'
import registry from '../../../../ml/models.json' with { type: 'json' }

export const VISION = registry.aktif.vision
const cfg = registry.model[VISION]

let clfP = null
/** Muat model sekali (lazy) lalu dipakai ulang. File model di-cache di disk server setelah unduhan pertama. */
export function muatVision() {
  clfP ??= pipeline(cfg.pipeline, cfg.hfId, { dtype: cfg.dtype }).catch((e) => {
    clfP = null
    throw e
  })
  return clfP
}

const gambar = (buffer, tipe) => RawImage.fromBlob(new Blob([buffer], { type: tipe }))

export async function klasifikasi(buffer, tipe) {
  const clf = await muatVision()
  const label = cfg.label.klasifikasi
  const kategori = Object.keys(label)
  const out = await clf(await gambar(buffer, tipe), Object.values(label))
  const peringkat = out.map((o) => ({ kategoriId: kategori[Object.values(label).indexOf(o.label)], yakin: o.score }))
  return { ...peringkat[0], top3: peringkat.slice(0, 3), modelVersi: VISION }
}

export async function detail(buffer, tipe, kategoriId) {
  const daftar = cfg.label.detail?.[kategoriId] ?? []
  if (!daftar.length) return { detail: [], modelVersi: VISION }
  const clf = await muatVision()
  const out = await clf(
    await gambar(buffer, tipe),
    daftar.map((d) => d.prompt),
  )
  const peringkat = out.map((o) => {
    const d = daftar.find((x) => x.prompt === o.label)
    return { id: d.id, kalimat: d.kalimat, yakin: o.score }
  })
  return { detail: peringkat, modelVersi: VISION }
}

export async function verifikasi(buffer, tipe, kategoriId) {
  const clf = await muatVision()
  const { beres, belum } = cfg.label.verifikasi[kategoriId] ?? cfg.label.verifikasi.lainnya
  const out = await clf(await gambar(buffer, tipe), [beres, belum])
  const skorBeres = out.find((o) => o.label === beres).score
  return { beres: skorBeres >= 0.5, yakin: Math.max(skorBeres, 1 - skorBeres), modelVersi: VISION }
}

export const KATEGORI_VISION = Object.keys(cfg.label.klasifikasi)
