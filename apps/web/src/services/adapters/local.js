// Adapter LOKAL: mengimplementasikan kontrak docs/API.md di atas localStorage.
// Dipakai saat VITE_API_URL kosong: development, demo offline, dan cadangan saat final.
import wilayahData from '@civicpulse/data/wilayah.json'
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
} from '@civicpulse/core'
import { VERSI_SEED, buatSeed } from '../seed.js'

const KUNCI = 'civicpulse:db'
const PIN_DEMO = '2026'
const TOKEN_DEMO = 'demo-instansi'
const W = wilayahData.wilayah

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
    return tunda({ ilustrasi: wilayahData.ilustrasi, sumber: wilayahData.sumber, wilayah: W })
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

  async loginInstansi(pin) {
    if (pin !== PIN_DEMO) throw new GalatDomain(KODE_GALAT.TIDAK_BERWENANG, 'PIN instansi salah.')
    return tunda({ token: TOKEN_DEMO, petugas: 'Petugas Demo · Dinas PUTR' })
  },

  async ubahStatus(kode, { ke, catatan, tanggapan, buktiUrl }, { token, deviceId }) {
    if (token !== TOKEN_DEMO)
      throw new GalatDomain(KODE_GALAT.TIDAK_BERWENANG, 'Hanya instansi yang dapat mengubah status.')
    let baru = terapkanTransisi(ambil(kode), ke, { oleh: PERAN.INSTANSI, catatan, buktiUrl })
    if (tanggapan)
      baru = {
        ...baru,
        tanggapan: { isi: tanggapan, petugas: 'Dinas PUTR', waktu: new Date().toISOString(), buktiUrl },
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
