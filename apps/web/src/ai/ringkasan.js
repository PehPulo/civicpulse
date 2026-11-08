// Fakta & ringkasan cadangan dasbor (docs/AI.md § LLM). Fungsi murni, diuji di apps/web/test/ringkasan.test.js.
import { bahanDasbor, faktaDasbor as faktaCore } from '@civicpulse/core'
import { WILAYAH } from '../lib/peta.js'

const fmt = (x) => (x == null ? '-' : x.toLocaleString('id-ID'))
const nama = (w) => `${w.kecamatan} (${w.kabupaten})`

/** Daftar fakta untuk LLM (disusun di core agar sama persis dengan yang disusun server). */
export const faktaDasbor = (stat) => faktaCore(bahanDasbor(stat), WILAYAH)

/** Ringkasan cadangan tanpa AI. Selalu akurat karena disusun langsung dari angka. */
export function ringkasanTemplate(stat) {
  const atas = stat.perluPerhatian[0]
  const senyap = stat.wilayahSenyap[0]
  const kalimat = [
    `Dari ${fmt(stat.total)} laporan, ${fmt(stat.persenTerverifikasi)}% klaim selesai sudah dibuktikan warga dengan median ${fmt(stat.medianHariTangani)} hari.`,
  ]
  if (atas) kalimat.push(`${nama(atas)} paling perlu perhatian dengan ${fmt(atas.terbuka)} laporan belum selesai.`)
  if (senyap)
    kalimat.push(
      `${senyap.kecamatan} berisiko tinggi (${fmt(senyap.risikoMaks)}) namun hanya ${fmt(senyap.laporan30h)} laporan dalam 30 hari; disarankan penjangkauan langsung ke warga.`,
    )
  return kalimat.join(' ')
}

export { angkaTerjamin, keluaranAman, keluaranWajar } from '@civicpulse/core'
