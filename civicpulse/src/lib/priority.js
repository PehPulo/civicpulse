import { kategoriById } from '../data/kategori.js'

// Bobot faktor skor prioritas (draft, akan dikalibrasi).
export const BOBOT = { risiko: 0.35, riwayat: 0.25, kemiskinan: 0.2, serupa: 0.2 }

const clamp = (x, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, x))

export function tingkat(skor) {
  if (skor >= 70) return 'Tinggi'
  if (skor >= 40) return 'Sedang'
  return 'Rendah'
}

function kelasRisiko(nilai) {
  if (nilai >= 70) return 'tinggi'
  if (nilai >= 40) return 'sedang'
  return 'rendah'
}

const kapital = (s) => s.charAt(0).toUpperCase() + s.slice(1)

export function hitungPrioritas(wilayah, kategoriId) {
  const kat = kategoriById(kategoriId)
  const risiko = wilayah.risiko[kat.bahaya]
  const kejadian = wilayah.kejadian5th[kat.bahaya]
  const serupa = wilayah.serupa30h[kategoriId] ?? 0
  const miskin = wilayah.miskin.toLocaleString('id-ID')

  const faktor = [
    {
      kunci: 'risiko', label: 'Risiko wilayah', sumber: 'IRBI · BNPB',
      nilai: risiko,
      tampil: `${kapital(kelasRisiko(risiko))} (${risiko}/100)`,
      alasan: `wilayah berisiko ${kat.namaBahaya} ${kelasRisiko(risiko)}`,
    },
    {
      kunci: 'riwayat', label: 'Riwayat kejadian', sumber: 'DIBI · BNPB',
      nilai: clamp((kejadian / 5) * 100),
      tampil: `${kejadian} kejadian / 5 tahun`,
      alasan: `${kejadian} kejadian ${kat.namaBahaya} tercatat dalam 5 tahun`,
    },
    {
      kunci: 'kemiskinan', label: 'Kerentanan sosial', sumber: 'Kemiskinan · BPS',
      nilai: clamp(((wilayah.miskin - 3) / (12 - 3)) * 100),
      tampil: `${miskin}% penduduk miskin`,
      alasan: `${miskin}% penduduk ${wilayah.kabupaten} tergolong miskin`,
    },
    {
      kunci: 'serupa', label: 'Laporan serupa', sumber: 'Laporan warga',
      nilai: clamp((serupa / 10) * 100),
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

  return { skor, level, faktor, penjelasan }
}

function gabung(daftar) {
  if (daftar.length <= 1) return daftar.join('')
  return `${daftar.slice(0, -1).join(', ')}, dan ${daftar[daftar.length - 1]}`
}

export function buatKodeLacak() {
  const n = Math.floor(1000 + Math.random() * 9000)
  return `CP-2026-${n}`
}
