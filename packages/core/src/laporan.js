// Kontrak: docs/DATA-MODEL.md § Laporan
import { GalatDomain, KODE_GALAT } from './galat.js'
import { ID_KATEGORI, kategoriById } from './kategori.js'
import { jarakMeter, wilayahTerdekat } from './geo.js'
import { hitungPrioritas } from './prioritas.js'
import { PERAN, STATUS } from './status.js'

export const ATURAN_LAPORAN = {
  deskripsiMin: 10,
  deskripsiMaks: 280,
  judulMaks: 80,
  batasHarian: 5, // laporan per deviceId per hari
  serupaRadiusMeter: 500,
  serupaHari: 30,
}

export const POLA_KODE = /^CP-\d{4}-\d{4}$/

export function buatKodeLacak(tahun = new Date().getFullYear(), acak = Math.random) {
  return `CP-${tahun}-${Math.floor(1000 + acak() * 9000)}`
}

/** Validasi input POST /laporan. Melempar GalatDomain VALIDASI berisi daftar field yang salah. */
export function validasiInputLaporan(input) {
  const galat = {}
  if (!ID_KATEGORI.includes(input.kategoriId)) galat.kategoriId = 'Kategori tidak dikenal.'
  if (!Number.isFinite(input.lat) || !Number.isFinite(input.lng)) galat.lokasi = 'Lokasi wajib diisi.'
  const d = (input.deskripsi ?? '').trim()
  if (d.length < ATURAN_LAPORAN.deskripsiMin || d.length > ATURAN_LAPORAN.deskripsiMaks)
    galat.deskripsi = `Deskripsi ${ATURAN_LAPORAN.deskripsiMin}–${ATURAN_LAPORAN.deskripsiMaks} karakter.`
  if ((input.judul ?? '').length > ATURAN_LAPORAN.judulMaks)
    galat.judul = `Judul maks. ${ATURAN_LAPORAN.judulMaks} karakter.`
  if (Object.keys(galat).length) throw new GalatDomain(KODE_GALAT.VALIDASI, 'Input laporan tidak valid.', galat)
}

/** Jumlah pelapor unik lain dengan kategori sama dalam radius & jendela waktu. */
export function hitungSerupa(semuaLaporan, kriteria) {
  return pelaporSerupa(semuaLaporan, kriteria).size
}

function pelaporSerupa(semuaLaporan, { kategoriId, lat, lng, waktu, pelaporId, kecualiKode }) {
  const batas = Date.parse(waktu) - ATURAN_LAPORAN.serupaHari * 86400000
  const pelapor = new Set()
  for (const l of semuaLaporan) {
    if (l.kode === kecualiKode || l.kategoriId !== kategoriId) continue
    if (Date.parse(l.dibuat) < batas || Date.parse(l.dibuat) > Date.parse(waktu)) continue
    if (jarakMeter(lat, lng, l.lat, l.lng) > ATURAN_LAPORAN.serupaRadiusMeter) continue
    for (const id of [l.pelaporId, ...(l.dukungan ?? [])]) if (id && id !== pelaporId) pelapor.add(id)
  }
  return pelapor
}

/**
 * Bangun entitas Laporan baru: deteksi wilayah, hitung laporan serupa & skor, status awal DITERIMA.
 * Dipakai adapter lokal (web) DAN apps/api agar hasilnya identik.
 */
export function buatLaporan(input, { daftarWilayah, semuaLaporan, pelaporId, kode, waktu = new Date().toISOString() }) {
  validasiInputLaporan(input)
  const wilayah = wilayahTerdekat(daftarWilayah, input.lat, input.lng)
  const serupa = hitungSerupa(semuaLaporan, { ...input, waktu, pelaporId })
  const prioritas = hitungPrioritas(wilayah, input.kategoriId, serupa)
  return {
    kode,
    kategoriId: input.kategoriId,
    wilayahId: wilayah.id,
    lat: input.lat,
    lng: input.lng,
    judul: (input.judul ?? '').trim() || kategoriById(input.kategoriId).label,
    deskripsi: input.deskripsi.trim(),
    fotoUrl: input.fotoUrl ?? null,
    pelaporId,
    dibuat: waktu,
    status: STATUS.DITERIMA,
    prioritas,
    dukungan: [],
    riwayat: [
      { status: STATUS.DITERIMA, waktu, oleh: PERAN.SISTEM, catatan: 'Laporan masuk dan diperkaya data wilayah.' },
    ],
    verifikasi: [],
    tanggapan: null,
    ai: input.ai ?? null,
  }
}

/**
 * Proyeksi PUBLIK laporan untuk respons API (docs/API.md § Laporan publik).
 * Membuang identitas perangkat (pelaporId, deviceId dukungan/verifikasi) dan menambah `saya`
 * yang dihitung dari X-Device-Id peminta.
 */
export function tampilanPublik(laporan, deviceId = null) {
  const { pelaporId, dukungan = [], verifikasi = [], ...sisa } = laporan
  return {
    ...sisa,
    jumlahDukungan: new Set(dukungan).size,
    verifikasi: verifikasi.map(({ deviceId: _d, lat: _lat, lng: _lng, ...v }) => v),
    saya: {
      pelapor: Boolean(deviceId) && pelaporId === deviceId,
      dukung: Boolean(deviceId) && dukungan.includes(deviceId),
      verifikasi: Boolean(deviceId) && verifikasi.some((v) => v.deviceId === deviceId),
    },
  }
}

/** Hitung ulang skor setelah ada +1: warga yang mendukung dihitung sebagai pelapor serupa (tanpa duplikat). */
export function hitungUlangPrioritas(laporan, { daftarWilayah, semuaLaporan, waktu = new Date().toISOString() }) {
  const wilayah = daftarWilayah.find((w) => w.id === laporan.wilayahId)
  const pelapor = pelaporSerupa(semuaLaporan, {
    kategoriId: laporan.kategoriId,
    lat: laporan.lat,
    lng: laporan.lng,
    waktu,
    pelaporId: laporan.pelaporId,
    kecualiKode: laporan.kode,
  })
  for (const id of laporan.dukungan ?? []) if (id !== laporan.pelaporId) pelapor.add(id)
  return { ...laporan, prioritas: hitungPrioritas(wilayah, laporan.kategoriId, pelapor.size) }
}
