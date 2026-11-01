import { WILAYAH } from './wilayah.js'
import { hitungPrioritas } from '../lib/priority.js'

// Laporan contoh (ilustrasi) agar halaman detail dan landing terisi.
const byId = (id) => WILAYAH.find((w) => w.id === id)

const CONTOH = [
  {
    kode: 'CP-2026-0417', kategori: 'drainase', wilayahId: 'dayeuhkolot',
    judul: 'Saluran air tersumbat sampah di depan pasar',
    deskripsi: 'Saluran di Jl. Raya Dayeuhkolot tertutup sampah dan lumpur. Saat hujan sore air meluap ke jalan dan masuk ke rumah warga.',
    dibuat: '2026-10-12',
    status: [
      { kunci: 'diterima', tanggal: '2026-10-12', catatan: 'Laporan masuk dan diperkaya data wilayah.' },
      { kunci: 'diproses', tanggal: '2026-10-14', catatan: 'Diteruskan ke Dinas PUTR, dijadwalkan pengerukan.' },
      { kunci: 'klaim', tanggal: '2026-10-20', catatan: 'Instansi menyatakan saluran sudah dikeruk.' },
    ],
    tanggapan: 'Pengerukan saluran sepanjang ±120 m telah dilakukan pada 20 Oktober 2026 bersama petugas kebersihan kecamatan.',
    verifikasi: { ya: 1, tidak: 0, target: 3 },
  },
  {
    kode: 'CP-2026-0388', kategori: 'jalan', wilayahId: 'lembang',
    judul: 'Jalan berlubang di tanjakan menuju sekolah',
    deskripsi: 'Lubang sedalam ±20 cm di tikungan tanjakan, sudah dua kali pengendara motor jatuh.',
    dibuat: '2026-10-05',
    status: [
      { kunci: 'diterima', tanggal: '2026-10-05', catatan: 'Laporan masuk dan diperkaya data wilayah.' },
      { kunci: 'diproses', tanggal: '2026-10-09', catatan: 'Survei lapangan oleh UPT jalan.' },
    ],
    tanggapan: null,
    verifikasi: { ya: 0, tidak: 0, target: 3 },
  },
]

export function lengkapiLaporan(lap) {
  const wilayah = byId(lap.wilayahId)
  return { ...lap, wilayah, prioritas: hitungPrioritas(wilayah, lap.kategori) }
}

const KUNCI_SIMPAN = 'civicpulse-laporan'

export function laporanTersimpan() {
  try {
    return JSON.parse(localStorage.getItem(KUNCI_SIMPAN) || '[]')
  } catch {
    return []
  }
}

export function simpanLaporan(lap) {
  try {
    localStorage.setItem(KUNCI_SIMPAN, JSON.stringify([lap, ...laporanTersimpan()].slice(0, 20)))
  } catch {
    // penyimpanan lokal tidak tersedia; laporan tetap tampil di sesi ini
  }
}

export function cariLaporan(kode) {
  const semua = [...laporanTersimpan(), ...CONTOH]
  const lap = semua.find((l) => l.kode.toUpperCase() === kode.toUpperCase())
  return lap ? lengkapiLaporan(lap) : null
}

export const LAPORAN_CONTOH = CONTOH.map(lengkapiLaporan)
