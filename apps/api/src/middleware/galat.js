// Memetakan GalatDomain (@civicpulse/core) ke HTTP. Format galat seragam: docs/API.md § Galat.
import { GalatDomain, KODE_GALAT } from '@civicpulse/core'

const HTTP = {
  [KODE_GALAT.VALIDASI]: 400,
  [KODE_GALAT.TIDAK_BERWENANG]: 401,
  [KODE_GALAT.TIDAK_DITEMUKAN]: 404,
  [KODE_GALAT.TRANSISI_TIDAK_SAH]: 409,
  [KODE_GALAT.SUDAH_DUKUNG]: 409,
  [KODE_GALAT.VERIFIKASI_DITOLAK]: 422,
  [KODE_GALAT.BATAS_HARIAN]: 429,
  BELUM_DIIMPLEMENTASI: 501,
}

export function tanganiGalat(err, c) {
  if (err instanceof GalatDomain) {
    return c.json({ error: { kode: err.kode, pesan: err.message, detail: err.detail } }, HTTP[err.kode] ?? 400)
  }
  console.error(err)
  return c.json({ error: { kode: 'INTERNAL', pesan: 'Terjadi kesalahan di server.' } }, 500)
}

export const belumAda = (endpoint) => {
  throw new GalatDomain('BELUM_DIIMPLEMENTASI', `${endpoint} belum diimplementasikan. Lihat docs/API.md.`)
}
