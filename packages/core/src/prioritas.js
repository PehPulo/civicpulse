// Kontrak: docs/SCORING.md. Mengubah bobot atau normalisasi ⇒ WAJIB menaikkan VERSI_RUMUS.
import { kategoriById } from './kategori.js'

export const VERSI_RUMUS = '1.0'
export const BOBOT = { risiko: 0.35, riwayat: 0.25, kemiskinan: 0.2, serupa: 0.2 }
export const AMBANG = { tinggi: 70, sedang: 40 }
export const NORMALISASI = { kejadianMaks: 5, miskinMin: 3, miskinMaks: 12, serupaMaks: 10 }

const clamp = (x, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, x))
const kapital = (s) => s.charAt(0).toUpperCase() + s.slice(1)

export function tingkat(skor) {
  if (skor >= AMBANG.tinggi) return 'Tinggi'
  if (skor >= AMBANG.sedang) return 'Sedang'
  return 'Rendah'
}

function kelasRisiko(nilai) {
  if (nilai >= 70) return 'tinggi'
  if (nilai >= 40) return 'sedang'
  return 'rendah'
}

/**
 * Hitung skor prioritas 0–100 yang bisa dijelaskan.
 * @param {object} wilayah  entitas Wilayah (docs/DATA-MODEL.md)
 * @param {string} kategoriId
 * @param {number} serupa   pelapor unik lain, kategori sama, radius 500 m, 30 hari terakhir
 */
export function hitungPrioritas(wilayah, kategoriId, serupa = 0) {
  const kat = kategoriById(kategoriId)
  if (!kat) throw new Error(`Kategori tidak dikenal: ${kategoriId}`)
  const { kejadianMaks, miskinMin, miskinMaks, serupaMaks } = NORMALISASI
  const risiko = wilayah.risiko[kat.bahaya]
  const kejadian = wilayah.kejadian5th[kat.bahaya]
  const miskin = wilayah.miskin.toLocaleString('id-ID')

  const faktor = [
    {
      kunci: 'risiko',
      label: 'Risiko wilayah',
      sumber: 'IRBI · BNPB',
      nilai: risiko,
      tampil: `${kapital(kelasRisiko(risiko))} (${risiko}/100)`,
      alasan: `wilayah berisiko ${kat.namaBahaya} ${kelasRisiko(risiko)}`,
    },
    {
      kunci: 'riwayat',
      label: 'Riwayat kejadian',
      sumber: 'DIBI · BNPB',
      nilai: clamp((kejadian / kejadianMaks) * 100),
      tampil: `${kejadian} kejadian / 5 tahun`,
      alasan: `${kejadian} kejadian ${kat.namaBahaya} tercatat dalam 5 tahun`,
    },
    {
      kunci: 'kemiskinan',
      label: 'Kerentanan sosial',
      sumber: 'Kemiskinan · BPS',
      nilai: clamp(((wilayah.miskin - miskinMin) / (miskinMaks - miskinMin)) * 100),
      tampil: `${miskin}% penduduk miskin`,
      alasan: `${miskin}% penduduk ${wilayah.kabupaten} tergolong miskin`,
    },
    {
      kunci: 'serupa',
      label: 'Laporan serupa',
      sumber: 'Laporan warga',
      nilai: clamp((serupa / serupaMaks) * 100),
      tampil: `${serupa} warga lain (±500 m)`,
      alasan: `${serupa} warga lain melapor hal serupa`,
    },
  ].map((f) => ({ ...f, bobot: BOBOT[f.kunci], kontribusi: f.nilai * BOBOT[f.kunci] }))

  const skor = Math.round(faktor.reduce((s, f) => s + f.kontribusi, 0))
  const level = tingkat(skor)
  const utama = [...faktor]
    .filter((f) => f.nilai > 0)
    .sort((a, b) => b.kontribusi - a.kontribusi)
    .slice(0, 3)
    .map((f) => f.alasan)

  const penjelasan = utama.length
    ? `Prioritas ${level.toLowerCase()}: ${gabung(utama)}.`
    : `Prioritas ${level.toLowerCase()}: belum ada faktor risiko menonjol di wilayah ini.`

  return { skor, level, faktor, penjelasan, versiRumus: VERSI_RUMUS }
}

function gabung(daftar) {
  if (daftar.length <= 1) return daftar.join('')
  return `${daftar.slice(0, -1).join(', ')}, dan ${daftar[daftar.length - 1]}`
}
