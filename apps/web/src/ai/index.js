// PEMILIK: Ezra (AI) · KONTRAK: docs/AI.md
//
// Antarmuka publik modul AI. UI hanya memanggil fungsi di file ini.
// Prinsip (WAJIB):
//   1. AI hanya memberi SARAN/TANDA. Tidak pernah mengubah skor prioritas atau status.
//   2. Setiap fungsi mengembalikan `null` bila AI mati, gagal, atau melebihi batas waktu ⇒ UI tetap jalan.
//   3. Model berjalan di browser (Web Worker + Transformers.js) ⇒ gratis, tanpa API key, data tidak keluar perangkat.
import { ATURAN_VERIFIKASI } from '@civicpulse/core'
import { faktaDasbor, ringkasanTemplate, angkaTerjamin } from './ringkasan.js'

export const AI_AKTIF = import.meta.env.VITE_FEATURE_AI !== 'false'
export const AMBANG_SARAN = 0.6
export const AMBANG_VERIFIKASI = ATURAN_VERIFIKASI.ambangAi
// Batas waktu sudah termasuk unduhan pertama model (vision ±90 MB, LLM ±400 MB).
export const BATAS_WAKTU_MS = { vision: 120000, llm: 600000 }

let worker = null
let urut = 0
const menunggu = new Map()
const pendengarProgres = new Set()

/** Berlangganan progres unduhan model: fn({ model: 'vision'|'llm', persen, status }). */
export function onProgresAI(fn) {
  pendengarProgres.add(fn)
  return () => pendengarProgres.delete(fn)
}

function dapatkanWorker() {
  if (worker) return worker
  worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' })
  worker.onmessage = ({ data }) => {
    if (data.tipe === 'progres') return pendengarProgres.forEach((fn) => fn(data))
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
  if (hasil?.ringkasan && angkaTerjamin(hasil.ringkasan, fakta)) {
    return { ringkasan: hasil.ringkasan, sumber: 'ai', modelVersi: hasil.modelVersi }
  }
  return { ringkasan: ringkasanTemplate(stat), sumber: 'template', modelVersi: null }
}

/** Mulai unduh & muat model lebih awal. model: 'vision' | 'llm'. */
export const pemanasan = (model = 'vision') => panggil('pemanasan', { model }, model)

/** Info perangkat untuk menampilkan peringatan ukuran unduhan. */
export const dukungWebGpu = () => typeof navigator !== 'undefined' && 'gpu' in navigator
