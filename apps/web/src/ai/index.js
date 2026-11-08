// PEMILIK: Ezra (AI) · KONTRAK: docs/AI.md
//
// Antarmuka publik modul AI. UI hanya memanggil fungsi di file ini.
// Prinsip (WAJIB):
//   1. AI hanya memberi SARAN/TANDA. Tidak pernah mengubah skor prioritas atau status.
//   2. Setiap fungsi mengembalikan `null` bila AI mati, gagal, atau melebihi batas waktu ⇒ UI tetap jalan.
//   3. Computer vision berjalan di browser (Web Worker + Transformers.js) ⇒ gratis, tanpa API key, foto tidak keluar perangkat.
//   4. LLM (Groq) dipanggil LEWAT SERVER kita (kunci API tidak pernah di browser). Klien hanya mengirim angka.
import { ATURAN_VERIFIKASI, bahanDasbor } from '@civicpulse/core'
import { ringkasanTemplate } from './ringkasan.js'

export const AI_AKTIF = import.meta.env.VITE_FEATURE_AI !== 'false'
export const AMBANG_SARAN = 0.6
export const AMBANG_VERIFIKASI = ATURAN_VERIFIKASI.ambangAi
// Batas waktu sudah termasuk unduhan pertama model computer vision (±90 MB).
export const BATAS_WAKTU_MS = 120000

let worker = null
let urut = 0
const menunggu = new Map()
const pendengarProgres = new Set()

// Progres unduhan dijumlahkan dari semua file model, disimpan di level modul agar komponen yang
// baru tampil di tengah unduhan tetap melihat angka MB yang benar.
const MB = 1024 * 1024
const fileModel = { vision: {} }
const progresTerkini = { vision: null }

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

/** Progres unduhan saat ini: { vision }, { persen, mbTerunduh, mbTotal, selesai } | null. */
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

async function panggil(tugas, payload) {
  if (!AI_AKTIF || typeof Worker === 'undefined') return null
  const id = ++urut
  const hasil = new Promise((resolve, reject) => {
    menunggu.set(id, { resolve, reject })
    dapatkanWorker().postMessage({ id, tugas, payload })
  })
  let timer
  const batas = new Promise((resolve) => (timer = setTimeout(() => resolve(null), BATAS_WAKTU_MS)))
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

// URL server untuk LLM: VITE_AI_URL, atau VITE_API_URL bila backend penuh sudah dipakai. Kosong ⇒ tanpa LLM.
const URL_AI = (import.meta.env.VITE_AI_URL || import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '')
export const LLM_TERSEDIA = AI_AKTIF && Boolean(URL_AI)

/** Ringkasan dasbor berbasis aturan: instan, selalu akurat. Ditampilkan sebelum/tanpa LLM. */
export const ringkasanAturan = (stat) => ringkasanTemplate(stat)

/**
 * LLM · ringkasan naratif dasbor lewat server (POST /ai/ringkasan-dasbor). Server menyusun fakta dari data resmi,
 * memanggil Groq, dan menolak keluaran yang mengarang angka. Tidak pernah melempar galat: bila gagal ⇒ template.
 * @returns {Promise<{ringkasan: string, sumber: 'ai'|'template', model?: string, alasan?: string}>}
 */
export async function ringkasDasbor(stat) {
  const template = { ringkasan: ringkasanTemplate(stat), sumber: 'template' }
  if (!LLM_TERSEDIA) return { ...template, alasan: 'ai-mati' }
  try {
    const res = await fetch(`${URL_AI}/ai/ringkasan-dasbor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bahan: bahanDasbor(stat) }),
      signal: AbortSignal.timeout(20000),
    })
    if (res.status === 429) return { ...template, alasan: 'terlalu-sering' }
    const { data } = await res.json()
    return data?.sumber === 'ai' && data.ringkasan
      ? { ringkasan: data.ringkasan, sumber: 'ai', model: data.model }
      : { ...template, alasan: data?.alasan ?? 'gagal' }
  } catch (e) {
    console.warn('[ai] ringkasan dasbor gagal', e.message)
    return { ...template, alasan: 'gagal' }
  }
}

/** Mulai unduh & muat model computer vision lebih awal. */
export const pemanasan = () => panggil('pemanasan', {})
