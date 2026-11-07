// Kontrak: docs/STATUS.md
import { GalatDomain, KODE_GALAT } from './galat.js'

export const STATUS = {
  DITERIMA: 'diterima',
  DIPROSES: 'diproses',
  KLAIM_SELESAI: 'klaim_selesai',
  TERVERIFIKASI: 'terverifikasi',
  DIBUKA_ULANG: 'dibuka_ulang',
}

export const PERAN = { PUBLIK: 'publik', WARGA: 'warga', INSTANSI: 'instansi', SISTEM: 'sistem' }

export const LABEL_STATUS = {
  diterima: 'Diterima',
  diproses: 'Diproses instansi',
  klaim_selesai: 'Klaim selesai',
  terverifikasi: 'Terverifikasi warga',
  dibuka_ulang: 'Dibuka ulang',
}

// Satu-satunya transisi yang sah. Selain ini ⇒ TRANSISI_TIDAK_SAH (HTTP 409).
export const TRANSISI = [
  { dari: STATUS.DITERIMA, ke: STATUS.DIPROSES, oleh: PERAN.INSTANSI },
  { dari: STATUS.DIPROSES, ke: STATUS.KLAIM_SELESAI, oleh: PERAN.INSTANSI },
  { dari: STATUS.KLAIM_SELESAI, ke: STATUS.TERVERIFIKASI, oleh: PERAN.SISTEM },
  { dari: STATUS.KLAIM_SELESAI, ke: STATUS.DIBUKA_ULANG, oleh: PERAN.SISTEM },
  { dari: STATUS.DIBUKA_ULANG, ke: STATUS.DIPROSES, oleh: PERAN.INSTANSI },
]

// Status yang masih menunggu tindakan instansi.
export const STATUS_TERBUKA = [STATUS.DITERIMA, STATUS.DIPROSES, STATUS.DIBUKA_ULANG]

export const bisaTransisi = (dari, ke, oleh) => TRANSISI.some((t) => t.dari === dari && t.ke === ke && t.oleh === oleh)

export const transisiBerikutnya = (dari, oleh) =>
  TRANSISI.filter((t) => t.dari === dari && t.oleh === oleh).map((t) => t.ke)

/** Mengembalikan laporan BARU (immutable) dengan status & riwayat diperbarui. */
export function terapkanTransisi(
  laporan,
  ke,
  { oleh, catatan = '', buktiUrl = null, waktu = new Date().toISOString() },
) {
  if (!bisaTransisi(laporan.status, ke, oleh)) {
    throw new GalatDomain(
      KODE_GALAT.TRANSISI_TIDAK_SAH,
      `Transisi ${laporan.status} → ${ke} oleh ${oleh} tidak diizinkan.`,
    )
  }
  const event = { status: ke, waktu, oleh, catatan, buktiUrl }
  return { ...laporan, status: ke, riwayat: [...laporan.riwayat, event] }
}

/** Waktu klaim selesai terakhir (awal siklus verifikasi aktif), atau null. */
export function waktuKlaimTerakhir(laporan) {
  const klaim = [...laporan.riwayat].reverse().find((e) => e.status === STATUS.KLAIM_SELESAI)
  return klaim ? klaim.waktu : null
}

/** Waktu laporan mencapai status tertentu (event terakhir), atau null. */
export function waktuStatus(laporan, status) {
  const e = [...laporan.riwayat].reverse().find((x) => x.status === status)
  return e ? e.waktu : null
}
