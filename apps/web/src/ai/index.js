// PEMILIK: Ezra (AI) · KONTRAK: docs/AI.md
//
// Antarmuka publik modul AI. UI hanya memanggil fungsi di file ini.
// Prinsip (WAJIB):
//   1. AI hanya memberi SARAN/TANDA. Tidak pernah mengubah skor prioritas atau status.
//   2. Setiap fungsi mengembalikan `null` bila AI mati, gagal, atau melebihi batas waktu ⇒ UI tetap jalan.
//   3. AI SELALU berjalan di SERVER kita (services/server.js) ⇒ perangkat warga tidak mengunduh model (0 MB).
//      Computer vision: foto dianalisis di memori server lalu dibuang. LLM (Groq): klien hanya mengirim angka.
import { ATURAN_VERIFIKASI, bahanDasbor } from '@civicpulse/core'
import { kompresFoto } from '../lib/foto.js'
import { ringkasanTemplate } from './ringkasan.js'
import { sesiHabis, sesiInstansi } from '../services/identitas.js'
import { URL_AI } from '../services/server.js'

export const AI_AKTIF = import.meta.env.VITE_FEATURE_AI !== 'false'
export const AMBANG_SARAN = 0.6
export const AMBANG_VERIFIKASI = ATURAN_VERIFIKASI.ambangAi
// AI di server (kecuali dimatikan VITE_FEATURE_AI=false). Bila server AI sibuk/mati, fungsi mengembalikan null.
export const AI_DI_SERVER = AI_AKTIF
export const LLM_TERSEDIA = AI_AKTIF

// Foto dikompres sekali per File (≤ 960 px, JPEG, tanpa EXIF) sebelum dikirim ke server.
const fotoKecil = new WeakMap()
async function siapkanFoto(file) {
  if (!fotoKecil.has(file))
    fotoKecil.set(
      file,
      kompresFoto(file).then((url) => fetch(url).then((r) => r.blob())),
    )
  return fotoKecil.get(file)
}

/** Computer vision di server: POST /ai/foto. null bila gagal/sibuk/terlalu sering ⇒ UI tetap jalan tanpa saran. */
async function panggilServer(tugas, { file, kategoriId }) {
  try {
    const form = new FormData()
    form.append('file', await siapkanFoto(file), 'foto.jpg')
    form.append('tugas', tugas)
    if (kategoriId) form.append('kategoriId', kategoriId)
    const res = await fetch(`${URL_AI}/ai/foto`, { method: 'POST', body: form, signal: AbortSignal.timeout(30000) })
    if (!res.ok) return null
    return (await res.json()).data ?? null
  } catch (e) {
    console.warn('[ai]', tugas, e.message)
    return null
  }
}

const panggil = (tugas, payload) => (AI_AKTIF ? panggilServer(tugas, payload) : null)

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

// ── Panel petugas instansi (butuh token instansi; semuanya lewat server) ──

async function panggilPetugas(path, { method = 'POST', body } = {}) {
  if (!AI_DI_SERVER) return null
  const token = sesiInstansi()?.token
  if (!token) return null
  try {
    const res = await fetch(`${URL_AI}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, ...(body && { 'Content-Type': 'application/json' }) },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(20000),
    })
    const json = await res.json().catch(() => null)
    if (res.status === 401) sesiHabis()
    if (res.status === 429) return { sumber: 'template', alasan: 'terlalu-sering' }
    return res.ok ? (json?.data ?? null) : null
  } catch (e) {
    console.warn('[ai]', path, e.message)
    return null
  }
}

/** Ambil foto laporan (data URL, /demo/…, atau https) sebagai Blob agar bisa dianalisis. null bila gagal. */
export async function fotoDariUrl(url) {
  if (!url) return null
  try {
    const res = await fetch(url)
    return res.ok ? await res.blob() : null
  } catch {
    return null
  }
}

/**
 * Computer vision untuk petugas: peringkat lengkap kategori (tanpa ambang) + detail kondisi untuk kategori laporan.
 * @returns {Promise<{ top3: {kategoriId, yakin}[], kategoriId, yakin, detail: {id, kalimat, yakin}[], ms: number, modelVersi } | null>}
 */
export async function analisisFoto(file, kategoriLaporan) {
  const kelas = await panggil('klasifikasi', { file })
  if (!kelas) return null
  const det = await panggil('detail', { file, kategoriId: kategoriLaporan || kelas.kategoriId })
  return { ...kelas, detail: det?.detail?.slice(0, 3) ?? [], ms: (kelas.ms ?? 0) + (det?.ms ?? 0) }
}

/** LLM · briefing antrean untuk petugas. Server menghitung fakta dari antrean dalam yurisdiksi (dipersempit
 *  cakupan {provinsiId?, kabkotaId?}). null bila server gagal. */
export const briefingAntrean = (cakupan = {}) =>
  panggilPetugas('/ai/briefing-antrean', {
    body: { provinsiId: cakupan.provinsiId ?? undefined, kabkotaId: cakupan.kabkotaId ?? undefined },
  })

/** LLM · draf tanggapan publik. Petugas WAJIB membaca & menyunting sebelum disimpan. null bila server gagal. */
export const drafTanggapan = (kode, ke, catatan = '') =>
  panggilPetugas('/ai/draf-tanggapan', { body: { kode, ke, catatan: catatan.slice(0, 280) } })

/** Meteran pemakaian AI hari ini (token, panggilan, cache, analisis foto). null bila server gagal. */
export const pemakaianAi = () => panggilPetugas('/ai/pemakaian', { method: 'GET' })

/** Pesan ramah untuk alasan teks AI tidak tampil. */
export const PESAN_ALASAN_AI = {
  'ai-mati': 'AI belum aktif di server.',
  'ditolak-pengaman': 'Teks AI ditolak pengaman karena memuat angka di luar fakta.',
  'plafon-harian': 'Kuota AI hari ini sudah habis.',
  'kuota-groq': 'Layanan AI sedang penuh.',
  'terlalu-sering': 'Terlalu sering meminta. Coba lagi sebentar.',
  gagal: 'AI tidak dapat dihubungi.',
}

// ── Tugas LLM tambahan (POST /ai/tulis/:tugas). Fakta disusun server; klien hanya mengirim ID/teks pendek. ──
const TUGAS_PETUGAS = new Set(['saran-tindakan', 'supervisi', 'rekap', 'tanya-data'])

/**
 * Minta teks LLM untuk satu tugas. Tidak pernah melempar: gagal ⇒ { teks: null, sumber: 'template', alasan }.
 * @returns {Promise<{teks: string|null, sumber: 'ai'|'template', alasan?: string, pesan?: string, model?: string,
 *   fakta?: string, saran?: {judul: string, deskripsi: string}, cache?: boolean, prompt?: string}>}
 */
export async function tulisAi(tugas, body = {}, { segar = false } = {}) {
  if (!LLM_TERSEDIA) return { teks: null, sumber: 'template', alasan: 'ai-mati' }
  const headers = { 'Content-Type': 'application/json' }
  if (TUGAS_PETUGAS.has(tugas)) {
    const token = sesiInstansi()?.token
    if (!token) return { teks: null, sumber: 'template', alasan: 'gagal' }
    headers.Authorization = `Bearer ${token}`
  }
  try {
    const res = await fetch(`${URL_AI}/ai/tulis/${tugas}${segar ? '?segar=1' : ''}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(25000),
    })
    const json = await res.json().catch(() => null)
    if (res.status === 401 && headers.Authorization) sesiHabis()
    if (res.status === 429) return { teks: null, sumber: 'template', alasan: 'terlalu-sering' }
    if (!res.ok) return { teks: null, sumber: 'template', alasan: 'gagal', pesan: json?.error?.pesan }
    return json?.data ?? { teks: null, sumber: 'template', alasan: 'gagal' }
  } catch (e) {
    console.warn('[ai]', tugas, e.message)
    return { teks: null, sumber: 'template', alasan: 'gagal' }
  }
}
