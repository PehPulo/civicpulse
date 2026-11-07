// PEMILIK: Ezra (AI) · KONTRAK: docs/AI.md
//
// Antarmuka publik modul AI. UI hanya memanggil fungsi di file ini.
// Prinsip (WAJIB):
//   1. AI hanya memberi SARAN/TANDA. Tidak pernah mengubah skor prioritas atau status.
//   2. Setiap fungsi mengembalikan `null` bila AI mati, gagal, atau melebihi batas waktu ⇒ UI tetap jalan.
//   3. Model berjalan di browser (Web Worker + Transformers.js) ⇒ gratis, tanpa API key, data tidak keluar perangkat.
import { ATURAN_VERIFIKASI } from '@civicpulse/core'
import { faktaDasbor, ringkasanTemplate, keluaranAman } from './ringkasan.js'
import { faktaLaporan } from './pesan.js'

export const AI_AKTIF = import.meta.env.VITE_FEATURE_AI !== 'false'
export const AMBANG_SARAN = 0.6
export const AMBANG_VERIFIKASI = ATURAN_VERIFIKASI.ambangAi
// Batas waktu sudah termasuk unduhan pertama model (vision ±90 MB, LLM ±400 MB).
export const BATAS_WAKTU_MS = { vision: 120000, llm: 600000 }

let worker = null
let urut = 0
const menunggu = new Map()
const pendengarProgres = new Set()

// Progres unduhan dijumlahkan dari semua file model, disimpan di level modul agar komponen yang
// baru tampil di tengah unduhan tetap melihat angka MB yang benar.
const MB = 1024 * 1024
const fileModel = { vision: {}, llm: {} }
const progresTerkini = { vision: null, llm: null }

function catatProgres({ model, status, file, loaded, total }) {
  if (!fileModel[model]) return
  const daftar = fileModel[model]
  if (status === 'progress' && file && total) daftar[file] = { loaded, total }
  if (status === 'done' && daftar[file]) daftar[file].loaded = daftar[file].total
  const semua = Object.values(daftar)
  const terunduh = semua.reduce((s, f) => s + f.loaded, 0)
  const ukuran = semua.reduce((s, f) => s + f.total, 0)
  const selesai = status === 'ready' || (ukuran > 0 && terunduh >= ukuran)
  progresTerkini[model] = {
    persen: selesai ? 100 : ukuran ? Math.round((terunduh / ukuran) * 100) : 0,
    mbTerunduh: Math.round(terunduh / MB),
    mbTotal: Math.round(ukuran / MB),
    selesai,
  }
  pendengarProgres.forEach((fn) => fn({ ...progresTerkini }))
}

/** Progres unduhan saat ini: { vision, llm }, masing-masing { persen, mbTerunduh, mbTotal, selesai } | null. */
export const progresAI = () => ({ ...progresTerkini })

/** Berlangganan perubahan progres unduhan model. fn menerima nilai yang sama dengan progresAI(). */
export function onProgresAI(fn) {
  pendengarProgres.add(fn)
  return () => {
    pendengarProgres.delete(fn)
  }
}

function dapatkanWorker() {
  if (worker) return worker
  worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' })
  worker.onmessage = ({ data }) => {
    if (data.tipe === 'progres') return catatProgres(data)
    const p = menunggu.get(data.id)
    if (!p) return
    menunggu.delete(data.id)
    data.error ? p.reject(new Error(data.error)) : p.resolve(data.hasil)
  }
  worker.onerror = (e) => {
    console.warn('[ai] worker gagal', e.message)
    for (const p of menunggu.values()) p.reject(new Error('Worker AI gagal'))
    menunggu.clear()
    worker = null
  }
  return worker
}

async function panggil(tugas, payload, jenis = 'vision') {
  if (!AI_AKTIF || typeof Worker === 'undefined') return null
  const id = ++urut
  const hasil = new Promise((resolve, reject) => {
    menunggu.set(id, { resolve, reject })
    dapatkanWorker().postMessage({ id, tugas, payload })
  })
  let timer
  const batas = new Promise((resolve) => (timer = setTimeout(() => resolve(null), BATAS_WAKTU_MS[jenis])))
  try {
    return await Promise.race([hasil, batas])
  } catch (e) {
    console.warn('[ai]', tugas, e.message)
    return null
  } finally {
    clearTimeout(timer)
    menunggu.delete(id)
  }
}

/**
 * Computer vision · saran kategori dari foto laporan.
 * @param {File|Blob} file
 * @returns {Promise<{kategoriId: string, yakin: number, top3: {kategoriId: string, yakin: number}[], modelVersi: string} | null>}
 *          null bila AI mati/gagal atau keyakinan < AMBANG_SARAN.
 */
export async function klasifikasiFoto(file) {
  const hasil = await panggil('klasifikasi', { file })
  return hasil && hasil.yakin >= AMBANG_SARAN ? hasil : null
}

/** Ambang keyakinan detail kedua agar ikut masuk draf (detail pertama selalu dipakai bila ada). */
export const AMBANG_DETAIL_KEDUA = 0.25

/**
 * Computer vision · detail kondisi di foto untuk kategori terpilih (bahan draf deskripsi).
 * @returns {Promise<{detail: {id: string, kalimat: string, yakin: number}[], modelVersi: string} | null>}
 *          detail berisi 1–2 butir teratas; null bila AI mati/gagal.
 */
export async function detailFoto(file, kategoriId) {
  const hasil = await panggil('detail', { file, kategoriId })
  if (!hasil?.detail?.length) return null
  const [utama, kedua] = hasil.detail
  return { ...hasil, detail: kedua && kedua.yakin >= AMBANG_DETAIL_KEDUA ? [utama, kedua] : [utama] }
}

/**
 * Computer vision · apakah foto verifikasi menunjukkan masalah sudah beres.
 * @returns {Promise<{beres: boolean, yakin: number, modelVersi: string} | null>}
 */
export function cekVerifikasi(file, kategoriId) {
  return panggil('verifikasi', { file, kategoriId })
}

/**
 * LLM · ringkasan naratif dasbor untuk pembuat kebijakan.
 * Fakta disusun deterministik dari core.statistik(); keluaran LLM DITOLAK bila memuat angka
 * yang tidak ada di fakta (anti-halusinasi) dan diganti ringkasan template.
 * @param {object} stat keluaran api.statistik()
 * @returns {Promise<{ringkasan: string, sumber: 'ai'|'template', modelVersi: string|null}>}
 */
export async function ringkasDasbor(stat) {
  const fakta = faktaDasbor(stat)
  const hasil = await panggil('ringkas', { fakta }, 'llm')
  if (hasil?.ringkasan && keluaranAman(hasil.ringkasan, fakta)) {
    return { ringkasan: hasil.ringkasan, sumber: 'ai', modelVersi: hasil.modelVersi }
  }
  return { ringkasan: ringkasanTemplate(stat), sumber: 'template', modelVersi: null }
}

/**
 * LLM · ringkasan satu laporan untuk instansi teknis, dari hasil computer vision + data wilayah asli.
 * Keluaran DITOLAK bila memuat angka (atau satuan %) yang tidak ada di fakta, lalu diganti draf template.
 * @param {Parameters<typeof faktaLaporan>[0] & { cadangan: string }} p  cadangan = draf deterministik
 * @returns {Promise<{ringkasan: string, sumber: 'ai'|'template', modelVersi: string|null, fakta: string}>}
 */
export async function ringkasLaporan({ cadangan, ...bahan }) {
  const fakta = faktaLaporan(bahan)
  const hasil = await panggil('ringkasLaporan', { fakta }, 'llm')
  if (hasil?.ringkasan && keluaranAman(hasil.ringkasan, fakta)) {
    return { ringkasan: hasil.ringkasan, sumber: 'ai', modelVersi: hasil.modelVersi, fakta }
  }
  console.info('[AI] ringkasan laporan memakai template; keluaran LLM:', hasil?.ringkasan ?? hasil)
  return { ringkasan: cadangan, sumber: 'template', modelVersi: null, fakta }
}

/** Mulai unduh & muat model lebih awal. model: 'vision' | 'llm'. */
export const pemanasan = (model = 'vision') => panggil('pemanasan', { model }, model)

/** Info perangkat untuk menampilkan peringatan ukuran unduhan. */
export const dukungWebGpu = () => typeof navigator !== 'undefined' && 'gpu' in navigator
