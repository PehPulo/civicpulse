// Galat domain dengan kode stabil. apps/api memetakannya ke HTTP status (docs/API.md § Galat).
export class GalatDomain extends Error {
  constructor(kode, pesan, detail) {
    super(pesan)
    this.name = 'GalatDomain'
    this.kode = kode
    this.detail = detail
  }
}

export const KODE_GALAT = {
  VALIDASI: 'VALIDASI', // 400
  TIDAK_BERWENANG: 'TIDAK_BERWENANG', // 401 / 403
  TIDAK_DITEMUKAN: 'TIDAK_DITEMUKAN', // 404
  TRANSISI_TIDAK_SAH: 'TRANSISI_TIDAK_SAH', // 409
  SUDAH_DUKUNG: 'SUDAH_DUKUNG', // 409
  VERIFIKASI_DITOLAK: 'VERIFIKASI_DITOLAK', // 422
  BATAS_HARIAN: 'BATAS_HARIAN', // 429
  DILARANG: 'DILARANG', // 403 (login sah, tetapi di luar wewenang/yurisdiksi)
}
