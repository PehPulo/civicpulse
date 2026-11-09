// Adapter LOKAL: mengimplementasikan kontrak docs/API.md di atas localStorage.
// Dipakai saat VITE_API_URL kosong: development, demo offline, dan cadangan saat final.
import wilayahData from '@civicpulse/data/wilayah.json'
import nasionalData from '@civicpulse/data/nasional.json'
import { INDEKS_WILAYAH, WILAYAH } from '../../lib/peta.js'
import {
  GalatDomain,
  KODE_GALAT,
  ATURAN_LAPORAN,
  PERAN,
  STATUS,
  buatKodeLacak,
  buatLaporan,
  evaluasiVerifikasi,
  hitungUlangPrioritas,
  periksaVerifikasi,
  statistik as hitungStatistik,
  tampilanPublik,
  terapkanTransisi,
  validasiProfilPetugas,
  TINGKAT,
  bolehSupervisi,
  bolehUbahStatus,
  dalamAkses,
  adminBawahan,
  agregatWilayah,
  akunDemo,
  aksesAkun,
  namaPetugasAkun,
  rapikanUsername,
  skorKinerjaWilayah,
  validasiSandiBaru,
} from '@civicpulse/core'
import { VERSI_SEED, buatSeed } from '../seed.js'
import { sesiInstansi } from '../identitas.js'

// Nama petugas pada tanggapan publik mengikuti profil sesi (sama seperti server: "Nama · Unit").
const petugasSesi = () => sesiInstansi()?.petugas ?? 'Dinas PUTR'
// Mode demo lokal (tanpa server): akun sama dengan server, password demo sama. Profil & password yang diganti
// hanya tersimpan di memori tab ini. Ini BUKAN keamanan sungguhan (semua berjalan di browser).
export const SANDI_DEMO_LOKAL = 'civicpulse2026'
let akunLokal = null
const daftarAkun = () => (akunLokal ??= new Map(akunDemo(nasionalData).map((a) => [a.username, { ...a }])))
const akunSesi = (token) => {
  aksesSesi(token)
  const a = daftarAkun().get(sesiInstansi()?.username)
  if (!a) throw new GalatDomain(KODE_GALAT.TIDAK_BERWENANG, 'Sesi lama tidak berlaku lagi. Silakan masuk ulang.')
  return a
}
const sesiDariAkun = (a) => ({
  token: TOKEN_DEMO,
  username: a.username,
  petugas: namaPetugasAkun(a),
  nama: a.nama,
  unit: a.unit,
  jabatan: a.jabatan ?? '',
  ...aksesAkun(a),
  wilayahNama: a.wilayahNama,
  sandiDiganti: Boolean(a.sandiDiganti),
})
/** Akses dari sesi lokal (mode demo). Token salah ⇒ 401. */
function aksesSesi(token) {
  if (token !== TOKEN_DEMO) throw new GalatDomain(KODE_GALAT.TIDAK_BERWENANG, 'Sesi instansi tidak valid.')
  const s = sesiInstansi()
  return {
    tingkat: s?.tingkat ?? 'kabkota',
    provinsiId: s?.provinsiId ?? 'jawa-barat',
    kabkotaId: s?.kabkotaId ?? 'kota-bandung',
  }
}

const KUNCI = 'civicpulse:db'
const TOKEN_DEMO = 'demo-instansi'
const W = WILAYAH

let db = null

function muat() {
  if (db) return db
  try {
    const tersimpan = JSON.parse(localStorage.getItem(KUNCI) || 'null')
    if (tersimpan?.versiSeed === VERSI_SEED) db = tersimpan
  } catch {
    // data rusak / storage diblokir ⇒ seed ulang
  }
  db ??= { versiSeed: VERSI_SEED, laporan: buatSeed(W) }
  jalankanEvaluasiBerkala()
  simpan()
  return db
}

function simpan() {
  try {
    localStorage.setItem(KUNCI, JSON.stringify(db))
  } catch {
    // Kuota penuh: buang foto dari laporan lama, coba sekali lagi.
    db.laporan.slice(5).forEach((l) => (l.fotoUrl = null))
    try {
      localStorage.setItem(KUNCI, JSON.stringify(db))
    } catch {
      // tetap berjalan di memori untuk sesi ini
    }
  }
}

// Peran "sistem": transisi otomatis verifikasi (pada server ini dijalankan cron).
function jalankanEvaluasiBerkala() {
  const sekarang = new Date().toISOString()
  db.laporan = db.laporan.map((l) => {
    const ke = evaluasiVerifikasi(l, sekarang)
    return ke ? terapkanTransisi(l, ke, { oleh: PERAN.SISTEM, catatan: catatanSistem(ke), waktu: sekarang }) : l
  })
}

const catatanSistem = (ke) =>
  ke === STATUS.TERVERIFIKASI
    ? 'Dikonfirmasi warga sekitar lewat foto berlokasi.'
    : 'Verifikasi warga tidak mendukung klaim selesai. Laporan dibuka ulang.'

const ambil = (kode) => {
  const l = muat().laporan.find((x) => x.kode.toUpperCase() === String(kode).toUpperCase())
  if (!l) throw new GalatDomain(KODE_GALAT.TIDAK_DITEMUKAN, `Laporan ${kode} tidak ditemukan.`)
  return l
}

const ganti = (baru) => {
  db.laporan = db.laporan.map((l) => (l.kode === baru.kode ? baru : l))
  simpan()
  return baru
}

const kodeUnik = () => {
  let kode
  do kode = buatKodeLacak()
  while (db.laporan.some((l) => l.kode === kode))
  return kode
}

const tunda = (x) => new Promise((r) => setTimeout(() => r(structuredClone(x)), 60))
// Respons laporan selalu berupa proyeksi publik, persis seperti dari server.
const publik = (l, ctx) => tampilanPublik(l, ctx?.deviceId)

export const adapterLokal = {
  mode: 'lokal',

  async health() {
    return tunda({ ok: true, mode: 'lokal', versiSeed: VERSI_SEED })
  },

  async daftarWilayah() {
    return tunda({
      ilustrasi: wilayahData.ilustrasi,
      sumber: wilayahData.sumber,
      wilayah: W,
      provinsi: nasionalData.provinsi,
      kabkota: nasionalData.kabkota,
    })
  },

  async daftarLaporan({ kategoriId, status, wilayahId } = {}, ctx) {
    const hasil = muat().laporan.filter(
      (l) =>
        (!kategoriId || l.kategoriId === kategoriId) &&
        (!status || l.status === status) &&
        (!wilayahId || l.wilayahId === wilayahId),
    )
    return tunda(hasil.map((l) => publik(l, ctx)))
  },

  async getLaporan(kode, ctx) {
    return tunda(publik(ambil(kode), ctx))
  },

  async buatLaporan(input, { deviceId }) {
    muat()
    const awalHari = new Date().setHours(0, 0, 0, 0)
    const hariIni = db.laporan.filter((l) => l.pelaporId === deviceId && Date.parse(l.dibuat) >= awalHari).length
    if (hariIni >= ATURAN_LAPORAN.batasHarian)
      throw new GalatDomain(KODE_GALAT.BATAS_HARIAN, `Maksimal ${ATURAN_LAPORAN.batasHarian} laporan per hari.`)
    const laporan = buatLaporan(input, {
      daftarWilayah: W,
      semuaLaporan: db.laporan,
      pelaporId: deviceId,
      kode: kodeUnik(),
    })
    db.laporan = [laporan, ...db.laporan]
    simpan()
    return tunda(publik(laporan, { deviceId }))
  },

  async dukung(kode, { deviceId }) {
    const l = ambil(kode)
    if (l.pelaporId === deviceId || l.dukungan.includes(deviceId))
      throw new GalatDomain(KODE_GALAT.SUDAH_DUKUNG, 'Kamu sudah tercatat mengalami masalah ini.')
    const baru = hitungUlangPrioritas(
      { ...l, dukungan: [...l.dukungan, deviceId] },
      { daftarWilayah: W, semuaLaporan: db.laporan },
    )
    return tunda(publik(ganti(baru), { deviceId }))
  },

  async kirimVerifikasi(kode, data, { deviceId }) {
    const l = ambil(kode)
    const v = { ...data, deviceId, waktu: new Date().toISOString() }
    const cek = periksaVerifikasi(l, v)
    if (!cek.sah) throw new GalatDomain(KODE_GALAT.VERIFIKASI_DITOLAK, cek.alasan[0], cek)
    let baru = { ...l, verifikasi: [...l.verifikasi, { ...v, sah: true, cek }] }
    const ke = evaluasiVerifikasi(baru)
    if (ke) baru = terapkanTransisi(baru, ke, { oleh: PERAN.SISTEM, catatan: catatanSistem(ke) })
    return tunda(publik(ganti(baru), { deviceId }))
  },

  // Mode lokal = demo di satu browser: akun & password demo sama dengan server dev (civicpulse2026).
  async loginInstansi(username, password) {
    const a = daftarAkun().get(rapikanUsername(username))
    if (!a || password !== (a.sandi ?? SANDI_DEMO_LOKAL))
      throw new GalatDomain(KODE_GALAT.TIDAK_BERWENANG, 'Username atau password salah.')
    a.terakhirMasuk = new Date().toISOString()
    return tunda(sesiDariAkun(a))
  },

  async ubahProfil(profil, { token }) {
    const a = akunSesi(token)
    const p = validasiProfilPetugas(profil)
    Object.assign(a, { nama: p.nama, unit: p.unit, jabatan: p.jabatan })
    return tunda(sesiDariAkun(a))
  },

  async ubahSandi({ lama, baru }, { token }) {
    const a = akunSesi(token)
    if (lama !== (a.sandi ?? SANDI_DEMO_LOKAL))
      throw new GalatDomain(KODE_GALAT.TIDAK_BERWENANG, 'Password lama salah.')
    a.sandi = validasiSandiBaru(baru, lama)
    a.sandiDiganti = true
    return tunda({ berhasil: true })
  },

  async daftarAdmin({ provinsiId } = {}, { token }) {
    const akses = aksesSesi(token)
    const lihat =
      akses.tingkat === TINGKAT.PUSAT && provinsiId ? { tingkat: TINGKAT.PROVINSI, provinsiId, kabkotaId: null } : akses
    const daftar = adminBawahan([...daftarAkun().values()], lihat)
    const kunci = lihat.tingkat === TINGKAT.PUSAT ? 'provinsiId' : 'kabkotaId'
    const ag = agregatWilayah(
      muat().laporan.filter((l) => dalamAkses(l, lihat, INDEKS_WILAYAH)),
      kunci,
      INDEKS_WILAYAH,
    )
    return tunda(
      daftar.map((a) => {
        const x = ag.get(a[kunci]) ?? { total: 0, terbuka: 0, lewatSla: 0, persenTepat: null }
        return {
          ...a,
          beban: {
            total: x.total,
            terbuka: x.terbuka,
            lewatSla: x.lewatSla,
            persenTepat: x.persenTepat ?? null,
            skor: skorKinerjaWilayah(x),
          },
        }
      }),
    )
  },

  async supervisi(kode, catatan, { token }) {
    const akses = aksesSesi(token)
    const l = ambil(kode)
    if (!bolehSupervisi(akses) || !dalamAkses(l, akses, INDEKS_WILAYAH))
      throw new GalatDomain(KODE_GALAT.DILARANG, 'Laporan ini di luar wilayah kewenangan Anda.')
    const isi = String(catatan ?? '')
      .replace(/[<>]/g, '')
      .trim()
      .slice(0, 280)
    if (isi.length < 5) throw new GalatDomain(KODE_GALAT.VALIDASI, 'Catatan supervisi minimal 5 karakter.')
    const s = sesiInstansi()
    const baru = {
      ...l,
      supervisi: [
        ...(l.supervisi ?? []),
        { tingkat: akses.tingkat, oleh: s?.petugas, catatan: isi, waktu: new Date().toISOString() },
      ],
    }
    return tunda(publik(ganti(baru), {}))
  },

  async ubahStatus(kode, { ke, catatan, tanggapan, buktiUrl }, { token, deviceId }) {
    const akses = aksesSesi(token)
    if (!bolehUbahStatus(akses) || !dalamAkses(ambil(kode), akses, INDEKS_WILAYAH))
      throw new GalatDomain(KODE_GALAT.DILARANG, 'Laporan ini di luar wilayah kewenangan Anda.')
    let baru = terapkanTransisi(ambil(kode), ke, { oleh: PERAN.INSTANSI, catatan, buktiUrl })
    if (tanggapan)
      baru = {
        ...baru,
        tanggapan: { isi: tanggapan, petugas: petugasSesi(), waktu: new Date().toISOString(), buktiUrl },
      }
    return tunda(publik(ganti(baru), { deviceId }))
  },

  async statistik() {
    return tunda(hitungStatistik(muat().laporan, W))
  },

  // Khusus mode lokal: kembalikan data demo ke kondisi awal.
  async reset() {
    db = { versiSeed: VERSI_SEED, laporan: buatSeed(W) }
    jalankanEvaluasiBerkala()
    simpan()
    return tunda({ ok: true })
  },
}
