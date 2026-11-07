// PEMILIK: Ezra (AI) · KONTRAK: docs/AI.md
//
// Antarmuka publik modul AI. UI hanya memanggil tiga fungsi ini.
// Prinsip (WAJIB):
//   1. AI hanya memberi SARAN/TANDA. Tidak pernah mengubah skor prioritas atau status.
//   2. Setiap fungsi mengembalikan `null` bila AI mati, gagal, atau melebihi batas waktu ⇒ UI tetap jalan.
//   3. Model berjalan di browser (Web Worker, Transformers.js) ⇒ gratis, tanpa API key, foto tidak keluar perangkat.
import { ATURAN_VERIFIKASI } from '@civicpulse/core'

export const AI_AKTIF = import.meta.env.VITE_FEATURE_AI !== 'false'
export const BATAS_WAKTU_MS = 15000
export const AMBANG_SARAN = 0.6
export const AMBANG_VERIFIKASI = ATURAN_VERIFIKASI.ambangAi

let worker = null
let urut = 0
const menunggu = new Map()

function dapatkanWorker() {
  if (worker) return worker
  worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' })
  worker.onmessage = ({ data }) => {
    const p = menunggu.get(data.id)
    if (!p) return
    menunggu.delete(data.id)
    data.error ? p.reject(new Error(data.error)) : p.resolve(data.hasil)
  }
  worker.onerror = () => {
    for (const p of menunggu.values()) p.reject(new Error('Worker AI gagal'))
    menunggu.clear()
    worker = null
  }
  return worker
}

async function panggil(tugas, payload) {
  if (!AI_AKTIF || typeof Worker === 'undefined') return null
  const id = ++urut
  const hasil = new Promise((resolve, reject) => {
    menunggu.set(id, { resolve, reject })
    dapatkanWorker().postMessage({ id, tugas, payload })
  })
  const batas = new Promise((resolve) => setTimeout(() => resolve(null), BATAS_WAKTU_MS))
  try {
    return await Promise.race([hasil, batas])
  } catch (e) {
    console.warn('[ai]', tugas, e.message)
    return null
  } finally {
    menunggu.delete(id)
  }
}

/**
 * Saran kategori dari foto laporan.
 * @param {File|Blob} file
 * @returns {Promise<{kategoriId: string, yakin: number, top3: {kategoriId: string, yakin: number}[], modelVersi: string} | null>}
 */
export async function klasifikasiFoto(file) {
  const hasil = await panggil('klasifikasi', { file })
  return hasil && hasil.yakin >= AMBANG_SARAN ? hasil : null
}

/**
 * Cek apakah foto verifikasi menunjukkan masalah sudah beres.
 * @param {File|Blob} file
 * @param {string} kategoriId
 * @returns {Promise<{beres: boolean, yakin: number, modelVersi: string} | null>}
 */
export function cekVerifikasi(file, kategoriId) {
  return panggil('verifikasi', { file, kategoriId })
}

/**
 * (P2) Ringkasan naratif kumpulan laporan untuk dasbor/instansi.
 * @param {object[]} laporan
 * @returns {Promise<{ringkasan: string, modelVersi: string} | null>}
 */
export function ringkasLaporan(laporan) {
  return panggil('ringkas', {
    laporan: laporan.map(({ judul, kategoriId, wilayahId, status }) => ({ judul, kategoriId, wilayahId, status })),
  })
}

/** Panaskan model lebih awal (mis. saat halaman Lapor dibuka) agar saran muncul lebih cepat. */
export const pemanasan = () => panggil('pemanasan', {})
