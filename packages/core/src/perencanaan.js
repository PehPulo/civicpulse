// PEMILIK: Ezra · KONTRAK: docs/SCORING.md § Perencanaan
// Alat perencanaan panel instansi (PUPR & Kemensos): rencana kerja regu, estimasi anggaran, indeks kerentanan sosial.
// Semua angka dihitung di sini dan diuji (packages/core/test/perencanaan.test.js), bukan diisi petugas atau AI.
import { STATUS_TERBUKA } from './status.js'
import { ID_KATEGORI } from './kategori.js'
import { slaLaporan } from './instansi.js'

const HARI = 86_400_000

/**
 * Rencana kerja regu lapangan. Laporan terbuka dijadwalkan "tenggat paling dekat dulu" (Earliest Deadline First,
 * optimal untuk meminimalkan keterlambatan pada kapasitas seragam), seri ⇒ skor prioritas lebih tinggi dulu.
 * Setiap regu menuntaskan `kapasitas` laporan per hari kerja.
 * @param {object[]} laporan
 * @param {{regu?: number, kapasitas?: number, sekarang?: string}} opsi
 */
export function rencanaKerja(laporan, { regu = 3, kapasitas = 2, sekarang = new Date().toISOString() } = {}) {
  const r = Math.max(1, Math.min(50, Math.round(regu)))
  const c = Math.max(1, Math.min(20, Math.round(kapasitas)))
  const t0 = Date.parse(sekarang)
  const antre = laporan
    .filter((l) => STATUS_TERBUKA.includes(l.status))
    .map((l) => {
      const sla = slaLaporan(l, sekarang)
      return { l, sla, tenggat: Date.parse(l.dibuat) + sla.targetHari * HARI }
    })
    .sort((a, b) => a.tenggat - b.tenggat || b.l.prioritas.skor - a.l.prioritas.skor)

  const perHari = r * c
  const tugas = antre.map(({ l, sla, tenggat }, i) => {
    const hari = Math.floor(i / perHari) + 1
    const nomorRegu = Math.floor((i % perHari) / c) + 1
    const rencanaSelesai = t0 + hari * HARI
    return {
      kode: l.kode,
      hari,
      regu: nomorRegu,
      tenggat: new Date(tenggat).toISOString(),
      rencanaSelesai: new Date(rencanaSelesai).toISOString(),
      sudahLewat: sla.lewat,
      terlambat: rencanaSelesai > tenggat,
    }
  })
  const terlambat = tugas.filter((t) => t.terlambat).length
  const sudahLewat = tugas.filter((t) => t.sudahLewat).length
  const perRegu = Array.from({ length: r }, (_, i) => tugas.filter((t) => t.regu === i + 1).length)
  return {
    regu: r,
    kapasitas: c,
    total: tugas.length,
    hari: tugas.length ? tugas.at(-1).hari : 0,
    terlambat,
    sudahLewat,
    // Yang belum lewat tetapi diperkirakan terlambat dengan kapasitas ini (bisa diselamatkan dengan regu tambahan).
    terlambatBaru: terlambat - sudahLewat,
    perRegu,
    tugas,
  }
}

/** Jumlah regu minimal agar tidak ada laporan yang BARU terlambat (yang sudah lewat tidak bisa diselamatkan). */
export function reguMinimal(laporan, { kapasitas = 2, sekarang, maks = 30 } = {}) {
  for (let r = 1; r <= maks; r++)
    if (rencanaKerja(laporan, { regu: r, kapasitas, sekarang }).terlambatBaru === 0) return r
  return null
}

/**
 * ASUMSI biaya satuan per penanganan (Rp) untuk simulasi anggaran. BUKAN HSPK resmi: petugas wajib
 * menggantinya dengan Harga Satuan Pokok Kegiatan daerah masing-masing (dapat diubah di panel).
 */
export const BIAYA_SATUAN_ASUMSI = {
  drainase: 15_000_000,
  banjir: 25_000_000,
  jalan: 40_000_000,
  longsor: 75_000_000,
  lainnya: 10_000_000,
}

/**
 * Estimasi anggaran penanganan laporan terbuka = Σ jumlah laporan terbuka per kategori × biaya satuan.
 * @returns {{baris: {kategoriId, jumlah, biayaSatuan, subtotal}[], jumlah: number, total: number}}
 */
export function estimasiAnggaran(laporan, biaya = BIAYA_SATUAN_ASUMSI) {
  const baris = ID_KATEGORI.map((kategoriId) => {
    const jumlah = laporan.filter((l) => l.kategoriId === kategoriId && STATUS_TERBUKA.includes(l.status)).length
    const biayaSatuan = Math.max(0, Number(biaya[kategoriId]) || 0)
    return { kategoriId, jumlah, biayaSatuan, subtotal: jumlah * biayaSatuan }
  })
  return {
    baris,
    jumlah: baris.reduce((s, b) => s + b.jumlah, 0),
    total: baris.reduce((s, b) => s + b.subtotal, 0),
  }
}

/**
 * Indeks kerentanan sosial 0–100 per unit wilayah (Kemensos: sasaran pendampingan/bantuan):
 *   50% kemiskinan (% penduduk miskin ÷ maksimum di cakupan)
 * + 30% beban laporan terbuka (÷ maksimum di cakupan)
 * + 20% porsi laporan terbuka yang lewat target waktu.
 * Level: Tinggi ≥ 60, Sedang ≥ 35, selain itu Rendah.
 * @param {object[]} daftarWilayah  wilayah (punya id, miskin, provinsiId, kabkotaId)
 * @param {object[]} laporan
 * @param {'id'|'kabkotaId'|'provinsiId'} kunci  satuan agregasi (wilayah, kab/kota, atau provinsi)
 * @returns {{id, miskin, terbuka, lewatSla, skor, level}[]} terurut skor menurun
 */
export function indeksKerentanan(daftarWilayah, laporan, kunci = 'id', sekarang = new Date().toISOString()) {
  const unit = new Map()
  const idUnit = (w) => (kunci === 'id' ? w.id : w[kunci])
  for (const w of daftarWilayah) {
    const id = idUnit(w)
    if (!id) continue
    const u = unit.get(id) ?? { id, miskinList: [], terbuka: 0, lewatSla: 0 }
    if (Number.isFinite(w.miskin)) u.miskinList.push(w.miskin)
    unit.set(id, u)
  }
  const indeks = new Map(daftarWilayah.map((w) => [w.id, w]))
  for (const l of laporan) {
    if (!STATUS_TERBUKA.includes(l.status)) continue
    const w = indeks.get(l.wilayahId)
    const u = w && unit.get(idUnit(w))
    if (!u) continue
    u.terbuka += 1
    if (slaLaporan(l, sekarang).lewat) u.lewatSla += 1
  }
  const hasil = [...unit.values()].map((u) => ({
    id: u.id,
    miskin: u.miskinList.length
      ? Math.round((u.miskinList.reduce((s, x) => s + x, 0) / u.miskinList.length) * 10) / 10
      : null,
    terbuka: u.terbuka,
    lewatSla: u.lewatSla,
  }))
  const maksMiskin = Math.max(0.0001, ...hasil.map((h) => h.miskin ?? 0))
  const maksTerbuka = Math.max(1, ...hasil.map((h) => h.terbuka))
  return hasil
    .map((h) => {
      const skor = Math.round(
        50 * ((h.miskin ?? 0) / maksMiskin) +
          30 * (h.terbuka / maksTerbuka) +
          20 * (h.terbuka ? h.lewatSla / h.terbuka : 0),
      )
      return { ...h, skor, level: skor >= 60 ? 'Tinggi' : skor >= 35 ? 'Sedang' : 'Rendah' }
    })
    .sort((a, b) => b.skor - a.skor)
}
