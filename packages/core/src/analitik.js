// Kontrak: docs/SCORING.md § Analitik dasbor
import { STATUS, STATUS_TERBUKA, waktuStatus } from './status.js'

const HARI = 86400000
const median = (xs) => {
  if (!xs.length) return null
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}
const bulat1 = (x) => (x == null ? null : Math.round(x * 10) / 10)

export const ATURAN_ANALITIK = {
  risikoTinggi: 70,
  senyapRasio: 0.5, // laporan 30 hari < 50% rata-rata wilayah ⇒ senyap
  jendelaHari: 30,
  bobotKesenjangan: { risiko: 0.5, menumpuk: 0.3, lambat: 0.2 },
  menumpukMaks: 10,
  lambatMaksHari: 30,
}

const risikoMaks = (w) => Math.max(...Object.values(w.risiko))

/** Ringkasan per wilayah: dipakai peta kesenjangan, "Perlu Perhatian", dan "Wilayah Senyap". */
export function ringkasWilayah(semuaLaporan, daftarWilayah, sekarang = new Date().toISOString()) {
  const t = Date.parse(sekarang)
  const { jendelaHari, bobotKesenjangan: b, menumpukMaks, lambatMaksHari } = ATURAN_ANALITIK
  return daftarWilayah.map((w) => {
    const milik = semuaLaporan.filter((l) => l.wilayahId === w.id)
    const terbuka = milik.filter((l) => STATUS_TERBUKA.includes(l.status))
    const umur = terbuka.map((l) => (t - Date.parse(l.dibuat)) / HARI)
    const rataUmur = umur.length ? umur.reduce((a, x) => a + x, 0) / umur.length : 0
    const laporan30h = milik.filter((l) => t - Date.parse(l.dibuat) <= jendelaHari * HARI).length
    const risiko = risikoMaks(w)
    const kesenjangan =
      b.risiko * risiko +
      b.menumpuk * Math.min(100, (terbuka.length / menumpukMaks) * 100) +
      b.lambat * Math.min(100, (rataUmur / lambatMaksHari) * 100)
    return {
      wilayahId: w.id,
      kecamatan: w.kecamatan,
      kabupaten: w.kabupaten,
      lat: w.lat,
      lng: w.lng,
      risikoMaks: risiko,
      total: milik.length,
      terbuka: terbuka.length,
      laporan30h,
      rataUmurTerbukaHari: bulat1(rataUmur),
      skorKesenjangan: Math.round(kesenjangan),
    }
  })
}

/** Wilayah risiko tinggi yang laporannya jauh di bawah rata-rata (warganya "senyap"). */
export function wilayahSenyap(ringkasan) {
  const rata = ringkasan.reduce((a, w) => a + w.laporan30h, 0) / (ringkasan.length || 1)
  return ringkasan
    .filter((w) => w.risikoMaks >= ATURAN_ANALITIK.risikoTinggi && w.laporan30h < rata * ATURAN_ANALITIK.senyapRasio)
    .map((w) => ({ ...w, rataLaporan30h: bulat1(rata) }))
    .sort((a, b) => b.risikoMaks - a.risikoMaks)
}

/** Data lengkap GET /statistik. */
export function statistik(semuaLaporan, daftarWilayah, sekarang = new Date().toISOString()) {
  const t = Date.parse(sekarang)
  const perStatus = Object.fromEntries(Object.values(STATUS).map((s) => [s, 0]))
  for (const l of semuaLaporan) perStatus[l.status] = (perStatus[l.status] ?? 0) + 1

  const durasi = semuaLaporan
    .filter((l) => l.status === STATUS.TERVERIFIKASI)
    .map((l) => (Date.parse(waktuStatus(l, STATUS.TERVERIFIKASI)) - Date.parse(l.dibuat)) / HARI)

  const pernahKlaim = semuaLaporan.filter((l) => l.riwayat.some((e) => e.status === STATUS.KLAIM_SELESAI)).length

  const ringkasan = ringkasWilayah(semuaLaporan, daftarWilayah, sekarang)

  const mingguan = Array.from({ length: 8 }, (_, i) => {
    const akhir = t - (7 - i) * 7 * HARI
    const awal = akhir - 7 * HARI
    const dalam = (iso) => iso && Date.parse(iso) > awal && Date.parse(iso) <= akhir
    return {
      mingguBerakhir: new Date(akhir).toISOString().slice(0, 10),
      masuk: semuaLaporan.filter((l) => dalam(l.dibuat)).length,
      terverifikasi: semuaLaporan.filter((l) => dalam(waktuStatus(l, STATUS.TERVERIFIKASI))).length,
    }
  })

  return {
    dihitung: sekarang,
    total: semuaLaporan.length,
    perStatus,
    persenTerverifikasi: pernahKlaim ? Math.round((perStatus[STATUS.TERVERIFIKASI] / pernahKlaim) * 100) : 0,
    medianHariTangani: bulat1(median(durasi)),
    perluPerhatian: [...ringkasan].sort((a, b) => b.skorKesenjangan - a.skorKesenjangan).slice(0, 5),
    wilayahSenyap: wilayahSenyap(ringkasan),
    perWilayah: ringkasan,
    mingguan,
  }
}
