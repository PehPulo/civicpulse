// Fakta & pengaman untuk ringkasan LLM (docs/AI.md § LLM). Fungsi murni, diuji di apps/web/test/ringkasan.test.js.
import { wilayahById } from '../lib/peta.js'

const fmt = (x) => (x == null ? '-' : x.toLocaleString('id-ID'))
const nama = (w) => `${w.kecamatan} (${w.kabupaten})`

/** Ubah statistik menjadi daftar fakta ringkas. Hanya ini yang dilihat LLM. */
export function faktaDasbor(stat) {
  const baris = [
    `- Total laporan: ${fmt(stat.total)}`,
    `- Persen laporan yang terverifikasi warga dari yang diklaim selesai: ${fmt(stat.persenTerverifikasi)}%`,
    `- Median waktu dari laporan masuk sampai terverifikasi: ${fmt(stat.medianHariTangani)} hari`,
  ]
  const atas = stat.perluPerhatian[0]
  if (atas)
    baris.push(
      `- Wilayah paling perlu perhatian: ${nama(atas)}, ${fmt(atas.terbuka)} laporan belum selesai, risiko bencana ${fmt(atas.risikoMaks)} dari 100`,
    )
  for (const w of stat.wilayahSenyap.slice(0, 2)) {
    const lengkap = wilayahById(w.wilayahId) ?? w
    baris.push(
      `- Wilayah senyap: ${nama(lengkap)}, risiko ${fmt(w.risikoMaks)} dari 100 tetapi hanya ${fmt(w.laporan30h)} laporan dalam 30 hari (rata-rata wilayah ${fmt(w.rataLaporan30h)})`,
    )
  }
  return baris.join('\n')
}

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

export { angkaTerjamin, keluaranAman, keluaranWajar } from './pengaman.js'
