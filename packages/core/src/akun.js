// PEMILIK: Ezra · KONTRAK: docs/USERS.md § Akun instansi
// Akun admin instansi (username + password) per wilayah, menggantikan PIN per tingkat.
// Satu akun = satu wilayah kerja: admin.pusat, admin.<provinsi>, admin.<kabkota>. Hash password dikerjakan
// server (apps/api/src/repositories/akun.js); di sini hanya data akun, validasi, dan aturan siapa melihat siapa.
import { GalatDomain, KODE_GALAT } from './galat.js'
import { TINGKAT } from './nasional.js'

export const POLA_USERNAME = /^[a-z0-9][a-z0-9.-]{2,59}$/
export const ATURAN_SANDI = { min: 8, maks: 72 }

/**
 * Username bawaan untuk satu wilayah. Kab/kota yang id-nya sama dengan provinsinya (mis. Kab. Gorontalo di
 * Provinsi Gorontalo) memakai awalan "kab-" agar tidak bentrok dengan akun provinsi.
 */
export function usernameWilayah(tingkat, id, provinsiId) {
  if (tingkat === TINGKAT.PUSAT) return 'admin.pusat'
  if (tingkat === TINGKAT.KABKOTA && id === provinsiId) return `admin.kab-${id}`
  return `admin.${id}`
}

const namaProvinsi = (nasional, id) => nasional.provinsi.find((p) => p.id === id)?.nama ?? id

/**
 * Akun demo: 1 pusat, 1 per provinsi, 1 per kab/kota. Profil bersifat jabatan generik (bukan orang sungguhan);
 * pemilik akun mengubahnya sendiri di halaman Profil.
 * @returns {{username, tingkat, provinsiId, kabkotaId, nama, unit, jabatan, wilayahNama}[]}
 */
export function akunDemo(nasional) {
  const pusat = {
    username: usernameWilayah(TINGKAT.PUSAT),
    tingkat: TINGKAT.PUSAT,
    provinsiId: null,
    kabkotaId: null,
    nama: 'Admin Pusat',
    unit: 'Pemantau Nasional',
    jabatan: '',
    wilayahNama: 'Indonesia',
  }
  const provinsi = nasional.provinsi.map((p) => ({
    username: usernameWilayah(TINGKAT.PROVINSI, p.id),
    tingkat: TINGKAT.PROVINSI,
    provinsiId: p.id,
    kabkotaId: null,
    nama: `Koordinator ${p.nama}`,
    unit: `Dinas PU Provinsi ${p.nama}`,
    jabatan: '',
    wilayahNama: p.nama,
  }))
  const kabkota = nasional.kabkota.map((k) => ({
    username: usernameWilayah(TINGKAT.KABKOTA, k.id, k.provinsiId),
    tingkat: TINGKAT.KABKOTA,
    provinsiId: k.provinsiId,
    kabkotaId: k.id,
    nama: `Petugas ${k.nama}`,
    unit: `Dinas PU ${k.nama}`,
    jabatan: '',
    wilayahNama: k.nama,
    provinsiNama: namaProvinsi(nasional, k.provinsiId),
  }))
  return [pusat, ...provinsi, ...kabkota]
}

/** Rapikan & validasi username dari form login. */
export function rapikanUsername(username) {
  const u = String(username ?? '')
    .trim()
    .toLowerCase()
  return POLA_USERNAME.test(u) ? u : null
}

/** Validasi password baru (dipakai saat ganti password). */
export function validasiSandiBaru(sandi, lama) {
  if (typeof sandi !== 'string' || sandi.length < ATURAN_SANDI.min || sandi.length > ATURAN_SANDI.maks)
    throw new GalatDomain(KODE_GALAT.VALIDASI, `Password baru ${ATURAN_SANDI.min}–${ATURAN_SANDI.maks} karakter.`)
  if (!/[A-Za-z]/.test(sandi) || !/\d/.test(sandi))
    throw new GalatDomain(KODE_GALAT.VALIDASI, 'Password baru harus memuat huruf dan angka.')
  if (sandi === lama) throw new GalatDomain(KODE_GALAT.VALIDASI, 'Password baru harus berbeda dari yang lama.')
  return sandi
}

/** Yurisdiksi dari akun. */
export const aksesAkun = (a) => ({ tingkat: a.tingkat, provinsiId: a.provinsiId, kabkotaId: a.kabkotaId })

/** Nama tampilan petugas di tanggapan publik: "Nama · Unit". */
export const namaPetugasAkun = (a) => [a.nama, a.unit].filter(Boolean).join(' · ')

/**
 * Admin bawahan yang boleh dilihat: pusat ⇒ semua admin provinsi; provinsi ⇒ admin kab/kota di provinsinya;
 * kab/kota ⇒ tidak ada (melempar DILARANG). Hanya profil publik (tanpa hash password).
 */
export function adminBawahan(semuaAkun, akses) {
  if (akses?.tingkat === TINGKAT.PUSAT) return semuaAkun.filter((a) => a.tingkat === TINGKAT.PROVINSI).map(profilPublik)
  if (akses?.tingkat === TINGKAT.PROVINSI)
    return semuaAkun.filter((a) => a.tingkat === TINGKAT.KABKOTA && a.provinsiId === akses.provinsiId).map(profilPublik)
  throw new GalatDomain(KODE_GALAT.DILARANG, 'Daftar admin hanya untuk admin provinsi dan pusat.')
}

/** Profil akun tanpa rahasia. */
export function profilPublik(a) {
  return {
    username: a.username,
    tingkat: a.tingkat,
    provinsiId: a.provinsiId,
    kabkotaId: a.kabkotaId,
    wilayahNama: a.wilayahNama,
    nama: a.nama,
    unit: a.unit,
    jabatan: a.jabatan ?? '',
    terakhirMasuk: a.terakhirMasuk ?? null,
    sandiDiganti: Boolean(a.sandiDiganti),
  }
}
