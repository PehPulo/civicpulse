// PEMILIK: Ezra · KONTRAK: docs/DATA-MODEL.md § Wilayah nasional, docs/USERS.md § Tingkat admin
// Struktur nasional: pusat → provinsi → kab/kota. Data pilot (kecamatan Bandung Raya, data asli BNPB/BPS) tetap
// murni; kab/kota lain diwakili satu "wilayah ilustrasi" dengan profil risiko DETERMINISTIK berlabel ilustrasi.
// Yurisdiksi admin ditegakkan dengan dalamAkses(): server memakainya untuk membatasi baca & tulis.
import { GalatDomain, KODE_GALAT } from './galat.js'
import { STATUS, STATUS_TERBUKA } from './status.js'
import { slaLaporan } from './instansi.js'

export const TINGKAT = { PUSAT: 'pusat', PROVINSI: 'provinsi', KABKOTA: 'kabkota' }
export const LABEL_TINGKAT = { pusat: 'Admin Pusat', provinsi: 'Admin Provinsi', kabkota: 'Admin Kab/Kota' }

/** Kab/kota yang kecamatannya ada di data pilot (wilayah.json). */
export const KABKOTA_PILOT = {
  'Kab. Bandung': 'bandung',
  'Kab. Bandung Barat': 'bandung-barat',
  'Kota Bandung': 'kota-bandung',
  'Kota Cimahi': 'kota-cimahi',
}
export const PROVINSI_PILOT = 'jawa-barat'

// Hash string → [0,1) deterministik (FNV-1a), agar profil ilustrasi sama di web, api, dan tes.
function acakDari(s) {
  let h = 2166136261
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return ((h >>> 0) % 10000) / 10000
}

/**
 * Daftar wilayah lengkap untuk aturan bisnis: kecamatan pilot (asli) + satu wilayah ilustrasi per kab/kota lain.
 * Bentuk tiap entri sama (docs/DATA-MODEL.md), ditambah provinsiId, kabkotaId, dan ilustrasi.
 */
export function gabungWilayah(pilot, nasional) {
  const asli = pilot.map((w) => ({
    ...w,
    provinsiId: PROVINSI_PILOT,
    kabkotaId: KABKOTA_PILOT[w.kabupaten] ?? null,
    ilustrasi: false,
  }))
  const tercakup = new Set(asli.map((w) => w.kabkotaId))
  const ilustrasi = nasional.kabkota
    .filter((k) => !tercakup.has(k.id))
    .map((k) => {
      const r = (kunci, min, maks) => Math.round(min + acakDari(`${k.id}:${kunci}`) * (maks - min))
      return {
        id: `kk-${k.id}`,
        kecamatan: k.nama, // nama tampilan (kab/kota) — lihat namaLokasi()
        kabupaten: k.nama,
        provinsiId: k.provinsiId,
        kabkotaId: k.id,
        lat: k.lat,
        lng: k.lng,
        miskin: r('miskin', 30, 160) / 10,
        risiko: { banjir: r('banjir', 15, 95), longsor: r('longsor', 5, 90), jalan: r('jalan', 20, 85) },
        kejadian5th: null,
        ilustrasi: true,
      }
    })
  return [...asli, ...ilustrasi]
}

/** "Kec. Coblong" untuk kecamatan pilot, "Kota Surabaya" untuk wilayah ilustrasi tingkat kab/kota. */
export const namaLokasi = (w) => (!w ? '-' : w.ilustrasi ? w.kecamatan : `Kec. ${w.kecamatan}`)

/** Lokasi administratif laporan (laporan lama tanpa field ⇒ diambil dari wilayahnya). */
export function lokasiLaporan(l, indeksWilayah) {
  const w = indeksWilayah.get(l.wilayahId)
  return { provinsiId: l.provinsiId ?? w?.provinsiId ?? null, kabkotaId: l.kabkotaId ?? w?.kabkotaId ?? null }
}

/**
 * Validasi akses admin dari login. Pusat: seluruh Indonesia. Provinsi: satu provinsi. Kab/Kota: satu kab/kota.
 * @returns {{tingkat: string, provinsiId: string|null, kabkotaId: string|null}}
 */
export function validasiAkses({ tingkat, provinsiId, kabkotaId } = {}, nasional) {
  const pv = nasional.provinsi.find((p) => p.id === provinsiId)
  const kk = nasional.kabkota.find((k) => k.id === kabkotaId)
  if (tingkat === TINGKAT.PUSAT) return { tingkat, provinsiId: null, kabkotaId: null }
  if (tingkat === TINGKAT.PROVINSI && pv) return { tingkat, provinsiId: pv.id, kabkotaId: null }
  if (tingkat === TINGKAT.KABKOTA && kk) return { tingkat, provinsiId: kk.provinsiId, kabkotaId: kk.id }
  throw new GalatDomain(KODE_GALAT.VALIDASI, 'Tingkat admin atau wilayah tidak dikenal.')
}

/** Apakah laporan berada dalam yurisdiksi admin. */
export function dalamAkses(l, akses, indeksWilayah) {
  if (!akses || akses.tingkat === TINGKAT.PUSAT) return true
  const lok = lokasiLaporan(l, indeksWilayah)
  if (akses.tingkat === TINGKAT.PROVINSI) return lok.provinsiId === akses.provinsiId
  if (akses.tingkat === TINGKAT.KABKOTA) return lok.kabkotaId === akses.kabkotaId
  return false
}

/** Hanya admin kab/kota yang menangani laporan (ubah status). Provinsi & pusat mengawasi + memberi catatan supervisi. */
export const bolehUbahStatus = (akses) => !akses?.tingkat || akses.tingkat === TINGKAT.KABKOTA
export const bolehSupervisi = (akses) => akses?.tingkat === TINGKAT.PROVINSI || akses?.tingkat === TINGKAT.PUSAT

/**
 * Agregat laporan per provinsi atau per kab/kota (untuk peta 3D & peringkat).
 * @param {'provinsiId'|'kabkotaId'} kunci
 * @returns {Map<string, {id, total, terbuka, lewatSla, terverifikasi, klaim, tepat, dinilai, persenTepat, persenTerverifikasi, skorMaks}>}
 */
export function agregatWilayah(semuaLaporan, kunci, indeksWilayah, sekarang = new Date().toISOString()) {
  const hasil = new Map()
  for (const l of semuaLaporan) {
    const id = lokasiLaporan(l, indeksWilayah)[kunci]
    if (!id) continue
    const a = hasil.get(id) ?? {
      id,
      total: 0,
      terbuka: 0,
      lewatSla: 0,
      terverifikasi: 0,
      klaim: 0,
      tepat: 0,
      dinilai: 0,
      skorMaks: 0,
    }
    const s = slaLaporan(l, sekarang)
    a.total += 1
    if (STATUS_TERBUKA.includes(l.status)) {
      a.terbuka += 1
      if (s.lewat) a.lewatSla += 1
      a.skorMaks = Math.max(a.skorMaks, l.prioritas.skor)
    }
    if (l.status === STATUS.TERVERIFIKASI) a.terverifikasi += 1
    if (l.riwayat?.some((e) => e.status === STATUS.KLAIM_SELESAI)) {
      a.klaim += 1
      a.dinilai += 1
      if (s.selesai ? !s.lewat : slaKlaim(l)) a.tepat += 1
    }
    hasil.set(id, a)
  }
  for (const a of hasil.values()) {
    a.persenTepat = a.dinilai ? Math.round((a.tepat / a.dinilai) * 100) : null
    a.persenTerverifikasi = a.klaim ? Math.round((a.terverifikasi / a.klaim) * 100) : null
  }
  return hasil
}

// Laporan yang sempat diklaim lalu dibuka ulang: nilai ketepatan dari klaim pertamanya.
function slaKlaim(l) {
  const klaim = l.riwayat.find((e) => e.status === STATUS.KLAIM_SELESAI)
  const hari = (Date.parse(klaim.waktu) - Date.parse(l.dibuat)) / 86_400_000
  return hari <= slaLaporan(l).targetHari
}

/**
 * Skor kinerja wilayah 0–100 untuk peringkat (docs/SCORING.md § Peringkat wilayah):
 *   50% klaim tepat waktu + 30% klaim yang diverifikasi warga + 20% (100 − % laporan terbuka yang lewat target).
 * Komponen tanpa data (mis. belum ada klaim) tidak dihitung dan bobotnya dibagi ulang ke komponen lain.
 * @returns {number|null} null bila wilayah belum punya laporan.
 */
export function skorKinerjaWilayah(a) {
  if (!a?.total) return null
  const komponen = [
    [0.5, a.persenTepat],
    [0.3, a.persenTerverifikasi],
    [0.2, a.terbuka ? 100 - Math.round((a.lewatSla / a.terbuka) * 100) : 100],
  ].filter(([, v]) => v != null)
  const bobot = komponen.reduce((s, [w]) => s + w, 0)
  return Math.round(komponen.reduce((s, [w, v]) => s + w * v, 0) / bobot)
}
