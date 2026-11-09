// PEMILIK: Ezra · KONTRAK: docs/USERS.md § Arahan berjenjang
// Arahan atasan berjenjang mengikuti struktur pemerintahan:
//   Pusat ──arahan──▶ Provinsi ──arahan──▶ Kab/Kota (yang menangani laporan)
// Setiap catatan supervisi menyimpan `tingkat` (pengirim) dan `untuk` (penerima). Catatan lama tanpa `untuk`
// disimpulkan dari pengirimnya. Provinsi dianggap sudah menindaklanjuti arahan pusat bila mengirim arahannya
// sendiri (ke kab/kota) setelah arahan pusat terakhir.
import { TINGKAT } from './nasional.js'
import { STATUS_TERBUKA } from './status.js'

/** Penerima arahan dari tingkat pengirim: pusat ⇒ provinsi, provinsi ⇒ kab/kota. */
export const tujuanArahanDari = (tingkat) => (tingkat === TINGKAT.PUSAT ? TINGKAT.PROVINSI : TINGKAT.KABKOTA)

/** Penerima satu catatan supervisi. */
export const tujuanArahan = (s) => s?.untuk ?? tujuanArahanDari(s?.tingkat)

/** Arahan yang ditujukan ke `tingkat` pada satu laporan (urut waktu). */
export const arahanUntuk = (laporan, tingkat) => (laporan?.supervisi ?? []).filter((s) => tujuanArahan(s) === tingkat)

/** Arahan yang dikirim oleh `tingkat` pada satu laporan (urut waktu). */
export const arahanDari = (laporan, tingkat) => (laporan?.supervisi ?? []).filter((s) => s.tingkat === tingkat)

/**
 * Apakah laporan ini punya arahan yang menunggu tindak lanjut `tingkat`?
 * - Kab/kota: laporan masih terbuka dan ada arahan dari provinsi.
 * - Provinsi: laporan masih terbuka dan arahan pusat terakhir belum diikuti arahan provinsi ke kab/kota.
 * - Pusat: tidak menerima arahan.
 */
export function arahanMenunggu(laporan, tingkat) {
  if (!laporan || !STATUS_TERBUKA.includes(laporan.status)) return false
  const masuk = arahanUntuk(laporan, tingkat)
  if (!masuk.length) return false
  if (tingkat === TINGKAT.PROVINSI) {
    const keluar = arahanDari(laporan, TINGKAT.PROVINSI).at(-1)
    return !keluar || Date.parse(keluar.waktu) < Date.parse(masuk.at(-1).waktu)
  }
  return tingkat === TINGKAT.KABKOTA
}

/** Catatan supervisi baru dengan pengirim & penerima yang benar. */
export function buatArahan({ tingkat, oleh, catatan, waktu = new Date().toISOString() }) {
  return { tingkat, untuk: tujuanArahanDari(tingkat), oleh: oleh ?? 'Admin', catatan, waktu }
}
