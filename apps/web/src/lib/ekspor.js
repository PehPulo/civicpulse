// PEMILIK: Ezra · KONTRAK: docs/FRONTEND.md § /data
// Ekspor data terbuka. Hanya memproses TAMPILAN PUBLIK laporan (sudah tanpa identitas perangkat, lihat core.tampilanPublik).
import { LABEL_STATUS, kategoriById } from '@civicpulse/core'

/** Kolom CSV laporan publik: kunci, judul kolom, arti (kamus data), dan pengambil nilai. */
export const KOLOM_LAPORAN = [
  { kunci: 'kode', arti: 'Kode lacak laporan', ambil: (l) => l.kode },
  { kunci: 'dibuat', arti: 'Waktu laporan masuk (ISO 8601, UTC)', ambil: (l) => l.dibuat },
  { kunci: 'kategori', arti: 'Jenis masalah', ambil: (l) => kategoriById(l.kategoriId)?.label ?? l.kategoriId },
  { kunci: 'status', arti: 'Status tindak lanjut saat ini', ambil: (l) => LABEL_STATUS[l.status] ?? l.status },
  { kunci: 'kecamatan', arti: 'Kecamatan (dari titik terdekat)', ambil: (l, w) => w?.kecamatan ?? l.wilayahId },
  { kunci: 'kabupaten', arti: 'Kabupaten/kota', ambil: (l, w) => w?.kabupaten ?? '' },
  { kunci: 'lat', arti: 'Lintang titik masalah', ambil: (l) => l.lat },
  { kunci: 'lng', arti: 'Bujur titik masalah', ambil: (l) => l.lng },
  { kunci: 'skor_prioritas', arti: 'Skor prioritas 0–100 (lihat Metodologi)', ambil: (l) => l.prioritas?.skor },
  { kunci: 'level_prioritas', arti: 'Tinggi / Sedang / Rendah', ambil: (l) => l.prioritas?.level },
  { kunci: 'versi_rumus', arti: 'Versi rumus skor yang dipakai', ambil: (l) => l.prioritas?.versiRumus },
  { kunci: 'jumlah_dukungan', arti: 'Warga lain yang menekan +1', ambil: (l) => l.jumlahDukungan ?? 0 },
  {
    kunci: 'verifikasi_beres',
    arti: 'Jumlah verifikasi sah "beres" dari warga',
    ambil: (l) => (l.verifikasi ?? []).filter((v) => v.sah && v.beres).length,
  },
  {
    kunci: 'terakhir_diperbarui',
    arti: 'Waktu perubahan status terakhir',
    ambil: (l) => l.riwayat?.at(-1)?.waktu ?? l.dibuat,
  },
  { kunci: 'judul', arti: 'Judul dari pelapor', ambil: (l) => l.judul },
  { kunci: 'deskripsi', arti: 'Deskripsi dari pelapor', ambil: (l) => l.deskripsi },
  { kunci: 'ada_foto', arti: 'Apakah laporan menyertakan foto', ambil: (l) => (l.fotoUrl ? 'ya' : 'tidak') },
]

const selCsv = (v) => {
  if (v == null) return ''
  const s = String(v)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/**
 * Ubah baris objek menjadi CSV (RFC 4180): koma, kutip, dan baris baru di-escape.
 * @param {object[]} baris
 * @param {{kunci: string, ambil?: (baris: object, ...konteks) => any}[]} kolom
 * @param {(baris: object) => any[]} [konteks] argumen tambahan untuk `ambil`
 */
export function keCsv(baris, kolom, konteks = () => []) {
  const kepala = kolom.map((k) => selCsv(k.kunci)).join(',')
  const isi = baris.map((b) => kolom.map((k) => selCsv(k.ambil ? k.ambil(b, ...konteks(b)) : b[k.kunci])).join(','))
  return [kepala, ...isi].join('\r\n')
}

/** Laporan publik siap ekspor JSON: tanpa foto (data URL besar) dan tanpa field `saya` yang khusus peminta. */
export const laporanUntukJson = (daftar) =>
  daftar.map(({ fotoUrl, saya: _saya, ...l }) => ({ ...l, adaFoto: Boolean(fotoUrl) }))

/** Picu unduhan file di browser. BOM ditambahkan pada CSV agar Excel membaca UTF-8 dengan benar. */
export function unduh(namaFile, isi, tipe) {
  const bom = tipe.startsWith('text/csv') ? '﻿' : ''
  const url = URL.createObjectURL(new Blob([bom + isi], { type: tipe }))
  const a = document.createElement('a')
  a.href = url
  a.download = namaFile
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
