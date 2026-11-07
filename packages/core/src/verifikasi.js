// Kontrak: docs/STATUS.md § Verifikasi warga
import { jarakMeter } from './geo.js'
import { STATUS, waktuKlaimTerakhir } from './status.js'

export const ATURAN_VERIFIKASI = {
  target: 3, // minimal verifikasi sah "beres"
  radiusMeter: 200, // foto harus diambil dalam radius ini dari titik laporan
  batasHari: 14, // tanpa cukup verifikasi setelah klaim ⇒ dibuka ulang
  ambangAi: 0.6, // keyakinan AI minimum untuk memberi tanda (flag)
}

/** Verifikasi milik siklus klaim aktif saja (setelah klaim selesai terakhir). */
export function verifikasiSiklusAktif(laporan) {
  const klaim = waktuKlaimTerakhir(laporan)
  if (!klaim) return []
  return (laporan.verifikasi ?? []).filter((v) => v.waktu >= klaim)
}

/**
 * Periksa satu verifikasi sebelum disimpan.
 * @returns {{ sah: boolean, lokasiOk: boolean, waktuOk: boolean, aiMeragukan: boolean, alasan: string[] }}
 */
export function periksaVerifikasi(laporan, v) {
  const alasan = []
  if (laporan.status !== STATUS.KLAIM_SELESAI)
    alasan.push('Verifikasi hanya dibuka setelah instansi mengklaim selesai.')
  if (v.deviceId && v.deviceId === laporan.pelaporId)
    alasan.push('Pelapor tidak boleh memverifikasi laporannya sendiri.')
  if (verifikasiSiklusAktif(laporan).some((x) => x.deviceId === v.deviceId))
    alasan.push('Kamu sudah memverifikasi laporan ini.')

  const adaLokasi = Number.isFinite(v.lat) && Number.isFinite(v.lng)
  const jarak = adaLokasi ? jarakMeter(v.lat, v.lng, laporan.lat, laporan.lng) : Infinity
  const lokasiOk = jarak <= ATURAN_VERIFIKASI.radiusMeter
  if (!lokasiOk) alasan.push(`Foto harus diambil dalam radius ${ATURAN_VERIFIKASI.radiusMeter} m dari lokasi laporan.`)

  const klaim = waktuKlaimTerakhir(laporan)
  const waktuOk = Boolean(klaim && v.waktuFoto && v.waktuFoto >= klaim)
  if (!waktuOk) alasan.push('Foto harus diambil setelah tanggal klaim selesai.')

  // AI hanya memberi tanda, tidak menggugurkan verifikasi (docs/AI.md § Prinsip).
  const ai = v.ai
  const aiMeragukan = Boolean(ai && v.beres && ai.beres === false && ai.yakin >= ATURAN_VERIFIKASI.ambangAi)

  return { sah: alasan.length === 0, lokasiOk, waktuOk, aiMeragukan, alasan }
}

/**
 * Transisi otomatis oleh sistem setelah ada verifikasi baru atau saat dicek berkala.
 * @returns {'terverifikasi' | 'dibuka_ulang' | null}
 */
export function evaluasiVerifikasi(laporan, sekarang = new Date().toISOString()) {
  if (laporan.status !== STATUS.KLAIM_SELESAI) return null
  const { beres, belum, total } = ringkasVerifikasi(laporan)
  const { target, batasHari } = ATURAN_VERIFIKASI

  if (beres >= target && beres > belum) return STATUS.TERVERIFIKASI
  if (total >= target && belum > beres) return STATUS.DIBUKA_ULANG

  const umurHari = (Date.parse(sekarang) - Date.parse(waktuKlaimTerakhir(laporan))) / 86400000
  if (umurHari > batasHari) return STATUS.DIBUKA_ULANG
  return null
}

export function ringkasVerifikasi(laporan) {
  const sah = verifikasiSiklusAktif(laporan).filter((v) => v.sah)
  const beres = sah.filter((v) => v.beres).length
  return { beres, belum: sah.length - beres, total: sah.length, target: ATURAN_VERIFIKASI.target }
}
