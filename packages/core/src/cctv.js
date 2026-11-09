// PEMILIK: Ezra · DATA: data/processed/cctv.json (CCTV publik resmi pemda)
// CCTV publik di sekitar lokasi laporan, untuk petugas: mencari rekaman pendukung (mis. kapan jalan mulai
// berlubang atau saluran tersumbat). Hanya kamera yang titiknya dibuka sendiri oleh portal resmi pemda; tidak ada
// pengenalan wajah dan tidak ditampilkan ke warga. Rekaman diminta resmi ke pengelola lewat surat/permintaan.
import { jarakMeter } from './geo.js'

export const ATURAN_CCTV = {
  radiusMeter: 1000,
  /** Bila tak ada kamera dalam radius utama, tampilkan yang terdekat hingga radius ini (ditandai lebih jauh). */
  radiusCadanganMeter: 3000,
  maksKamera: 5,
  /** Jendela rekaman yang diminta: waktu laporan ± jam ini. */
  jendelaJam: 1,
  /** Umumnya rekaman CCTV pemda tersimpan 7–30 hari sebelum tertimpa. */
  simpanHari: { min: 7, maks: 30 },
}

/** Arah mata angin (8 arah) dari titik a ke titik b. */
export function arahMataAngin(lat1, lng1, lat2, lng2) {
  const y = Math.sin(((lng2 - lng1) * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180)
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(((lng2 - lng1) * Math.PI) / 180)
  const derajat = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
  return ['utara', 'timur laut', 'timur', 'tenggara', 'selatan', 'barat daya', 'barat', 'barat laut'][
    Math.round(derajat / 45) % 8
  ]
}

/** Kamera terdekat dalam radius, urut jarak: [{...kamera, jarakM, arah}]. */
export function cctvTerdekat(
  titik,
  kamera,
  { radiusMeter = ATURAN_CCTV.radiusMeter, maks = ATURAN_CCTV.maksKamera } = {},
) {
  if (!Number.isFinite(titik?.lat) || !Number.isFinite(titik?.lng)) return []
  return (kamera ?? [])
    .map((c) => ({ ...c, jarakM: Math.round(jarakMeter(titik.lat, titik.lng, c.lat, c.lng)) }))
    .filter((c) => c.jarakM <= radiusMeter)
    .sort((a, b) => a.jarakM - b.jarakM)
    .slice(0, maks)
    .map((c) => ({ ...c, arah: arahMataAngin(titik.lat, titik.lng, c.lat, c.lng) }))
}

/** Portal CCTV resmi yang relevan untuk wilayah laporan: kab/kota dulu, lalu provinsi. */
export function portalCctv(wilayah, portal) {
  const daftar = portal ?? []
  return [
    ...daftar.filter((p) => p.tingkat === 'kabkota' && p.wilayahId === wilayah?.kabkotaId),
    ...daftar.filter((p) => p.tingkat === 'provinsi' && p.wilayahId === wilayah?.provinsiId),
  ]
}

const fmt = (d) =>
  new Date(d).toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

/** Draf permintaan rekaman resmi ke pengelola CCTV (petugas menyalin & mengirim lewat jalur dinas). */
export function drafPermintaanRekaman({ laporan, kamera, portal, lokasi, petugas }) {
  const t = Date.parse(laporan.dibuat)
  const j = ATURAN_CCTV.jendelaJam * 3600_000
  const jendela = Number.isFinite(t) ? `${fmt(t - j)} s.d. ${fmt(t + j)} WIB` : '(isi rentang waktu)'
  const daftar = kamera.length
    ? kamera.map((c, i) => `${i + 1}. ${c.nama} (±${c.jarakM} m arah ${c.arah} dari titik laporan)`).join('\n')
    : '(sebutkan kamera di sekitar lokasi)'
  return [
    `Kepada Yth. Pengelola ${portal?.nama ?? 'CCTV publik'}`,
    '',
    `Mohon bantuan salinan rekaman CCTV untuk menindaklanjuti laporan warga ${laporan.kode} (${laporan.judul}).`,
    `Lokasi: ${lokasi ?? '-'} (${laporan.lat?.toFixed?.(5)}, ${laporan.lng?.toFixed?.(5)})`,
    `Rentang waktu: ${jendela}`,
    'Kamera:',
    daftar,
    '',
    'Rekaman hanya dipakai untuk memastikan kondisi/waktu kejadian, tidak untuk identifikasi orang, dan tidak dipublikasikan.',
    `Mengingat rekaman umumnya tersimpan ${ATURAN_CCTV.simpanHari.min}–${ATURAN_CCTV.simpanHari.maks} hari, mohon diamankan secepatnya.`,
    '',
    `Hormat kami,\n${petugas ?? 'Petugas'}`,
  ].join('\n')
}

/**
 * Hasil lengkap untuk satu laporan (dipakai server & adapter lokal): kamera ≤ radius utama; bila kosong, kamera
 * terdekat hingga radius cadangan (`jauh: true`); plus portal resmi wilayahnya.
 * @param {{lat:number,lng:number}} laporan
 * @param {{kabkotaId?:string, provinsiId?:string}} wilayah
 * @param {{kamera:object[], portal:object[]}} data  isi data/processed/cctv.json
 */
export function cctvUntukLaporan(laporan, wilayah, data) {
  const dekat = cctvTerdekat(laporan, data?.kamera)
  const jauh = dekat.length === 0
  const kamera = jauh
    ? cctvTerdekat(laporan, data?.kamera, { radiusMeter: ATURAN_CCTV.radiusCadanganMeter, maks: 3 })
    : dekat
  const portalById = new Map((data?.portal ?? []).map((p) => [p.id, p]))
  return {
    kamera: kamera.map(({ nama, lat, lng, jarakM, arah, portal }) => ({
      nama,
      lat,
      lng,
      jarakM,
      arah,
      portal: portalById.get(portal) ?? null,
    })),
    jauh: jauh && kamera.length > 0,
    portal: portalCctv(wilayah, data?.portal),
  }
}
