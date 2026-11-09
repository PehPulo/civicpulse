// PEMILIK: Ezra · Bahan grafik & analisis di Ringkasan panel instansi (kab/kota, provinsi, pusat).
// Fungsi murni: semua angka dan kalimat analisis dihitung dari laporan, tanpa AI, sehingga bisa diuji dan dicek ulang.
import { kategoriById } from './kategori.js'
import { slaLaporan } from './instansi.js'
import { STATUS, STATUS_TERBUKA } from './status.js'

const HARI = 86_400_000
const URUTAN_STATUS = [
  STATUS.DITERIMA,
  STATUS.DIPROSES,
  STATUS.DIBUKA_ULANG,
  STATUS.KLAIM_SELESAI,
  STATUS.TERVERIFIKASI,
]

/** Laporan dianggap selesai bila sudah diverifikasi warga. Klaim selesai = masih menunggu warga. */
export const sudahSelesai = (l) => l.status === STATUS.TERVERIFIKASI
const persenBulat = (a, b) => (b ? Math.round((a / b) * 100) : 0)

/**
 * Hitung bahan grafik + poin analisis.
 * @param {object[]} laporan  laporan dalam cakupan
 * @param {{kelompok?: (l) => string|null, namaKelompok?: (id: string) => string, labelKelompok?: string,
 *   sekarang?: string, minggu?: number, minimalKelompok?: number}} opsi
 *   kelompok: id wilayah satu tingkat di bawah cakupan (pusat ⇒ provinsi, provinsi ⇒ kab/kota, kab/kota ⇒ kecamatan)
 */
export function analisisGrafik(laporan, opsi = {}) {
  const {
    kelompok = () => null,
    namaKelompok = (id) => id,
    labelKelompok = 'wilayah',
    sekarang = new Date().toISOString(),
    minggu = 12,
    minimalKelompok = 3,
  } = opsi
  const t = Date.parse(sekarang)
  const sla = new Map(laporan.map((l) => [l.kode, slaLaporan(l, sekarang)]))
  const terbuka = (l) => STATUS_TERBUKA.includes(l.status)
  const lewat = (l) => terbuka(l) && sla.get(l.kode)?.lewat

  // ── Tren mingguan (minggu terakhir berakhir hari ini) ──
  const awal = t - minggu * 7 * HARI
  const mingguan = Array.from({ length: minggu }, (_, i) => ({
    mulai: new Date(awal + i * 7 * HARI).toISOString(),
    masuk: 0,
    selesai: 0,
    belum: 0,
  }))
  for (const l of laporan) {
    const i = Math.floor((Date.parse(l.dibuat) - awal) / (7 * HARI))
    if (i < 0 || i >= minggu) continue
    mingguan[i].masuk++
    sudahSelesai(l) ? mingguan[i].selesai++ : mingguan[i].belum++
  }

  // ── Per kategori ──
  const perKategori = new Map()
  for (const l of laporan) {
    const k = perKategori.get(l.kategoriId) ?? {
      id: l.kategoriId,
      label: kategoriById(l.kategoriId)?.label ?? l.kategoriId,
      jumlah: 0,
      terbuka: 0,
      lewat: 0,
    }
    k.jumlah++
    if (terbuka(l)) k.terbuka++
    if (lewat(l)) k.lewat++
    perKategori.set(l.kategoriId, k)
  }
  const kategori = [...perKategori.values()].sort((a, b) => b.jumlah - a.jumlah)

  // ── Per status ──
  const status = URUTAN_STATUS.map((s) => ({ status: s, jumlah: laporan.filter((l) => l.status === s).length }))

  // ── Per wilayah satu tingkat di bawah ──
  const perWilayah = new Map()
  for (const l of laporan) {
    const id = kelompok(l)
    if (!id) continue
    const w = perWilayah.get(id) ?? { id, nama: namaKelompok(id), total: 0, selesai: 0, terbuka: 0, lewat: 0 }
    w.total++
    if (sudahSelesai(l)) w.selesai++
    if (terbuka(l)) w.terbuka++
    if (lewat(l)) w.lewat++
    perWilayah.set(id, w)
  }
  const wilayah = [...perWilayah.values()]
    .map((w) => ({ ...w, laju: persenBulat(w.selesai, w.total) }))
    .sort((a, b) => a.laju - b.laju || b.total - a.total)

  // ── Poin analisis ──
  const total = laporan.length
  const jumlahSelesai = laporan.filter(sudahSelesai).length
  const jumlahTerbuka = laporan.filter(terbuka).length
  const jumlahLewat = laporan.filter(lewat).length
  const menunggu = laporan.filter((l) => l.status === STATUS.KLAIM_SELESAI).length
  const poin = []
  if (!total) return { mingguan, kategori, status, wilayah, poin, total }

  const akhir4 = mingguan.slice(-4).reduce((s, m) => s + m.masuk, 0)
  const sebelum4 = mingguan.slice(-8, -4).reduce((s, m) => s + m.masuk, 0)
  if (sebelum4 && sebelum4 < 5) {
    // Angka kecil: persen menyesatkan (1 ⇒ 3 = "naik 200%"), tampilkan angka apa adanya.
    poin.push({
      jenis: 'netral',
      judul: 'Tren laporan',
      teks: `${akhir4} laporan masuk 4 minggu terakhir (4 minggu sebelumnya ${sebelum4}).`,
    })
  } else if (sebelum4) {
    const ubah = Math.round(((akhir4 - sebelum4) / sebelum4) * 100)
    poin.push({
      jenis: ubah > 10 ? 'waspada' : ubah < -10 ? 'baik' : 'netral',
      judul: 'Tren laporan',
      teks:
        ubah === 0
          ? `Laporan masuk 4 minggu terakhir (${akhir4}) sama dengan 4 minggu sebelumnya.`
          : `Laporan masuk 4 minggu terakhir ${akhir4}, ${ubah > 0 ? 'naik' : 'turun'} ${Math.abs(ubah)}% dari 4 minggu sebelumnya (${sebelum4}).`,
    })
  } else if (akhir4) {
    poin.push({ jenis: 'netral', judul: 'Tren laporan', teks: `${akhir4} laporan masuk dalam 4 minggu terakhir.` })
  }

  const laju = persenBulat(jumlahSelesai, total)
  poin.push({
    jenis: laju >= 50 ? 'baik' : laju >= 25 ? 'netral' : 'waspada',
    judul: 'Penyelesaian',
    teks: `${jumlahSelesai} dari ${total} laporan (${laju}%) sudah selesai dan diverifikasi warga; ${jumlahTerbuka} masih terbuka${menunggu ? `, ${menunggu} menunggu verifikasi warga` : ''}.`,
  })

  if (jumlahTerbuka) {
    const pLewat = persenBulat(jumlahLewat, jumlahTerbuka)
    poin.push({
      jenis: pLewat >= 30 ? 'bahaya' : pLewat > 0 ? 'waspada' : 'baik',
      judul: 'Target waktu',
      teks: jumlahLewat
        ? `${jumlahLewat} dari ${jumlahTerbuka} laporan terbuka (${pLewat}%) sudah lewat target waktu.`
        : 'Semua laporan terbuka masih dalam target waktu.',
    })
  }

  const dominan = kategori[0]
  poin.push({
    jenis: 'netral',
    judul: 'Masalah dominan',
    teks: `${dominan.label} paling banyak dilaporkan: ${dominan.jumlah} laporan (${persenBulat(dominan.jumlah, total)}% dari semua).`,
  })
  const kategoriLewat = [...kategori].sort((a, b) => b.lewat - a.lewat)[0]
  if (kategoriLewat?.lewat) {
    poin.push({
      jenis: 'waspada',
      judul: 'Paling sering terlambat',
      teks: `${kategoriLewat.label} paling banyak lewat target (${kategoriLewat.lewat} laporan).`,
    })
  }

  const layak = wilayah.filter((w) => w.total >= minimalKelompok)
  if (layak.length >= 2) {
    const terendah = layak[0]
    const tertinggi = layak.at(-1)
    poin.push({
      jenis: 'waspada',
      judul: `Perlu perhatian (${labelKelompok})`,
      teks: `${terendah.nama} punya tingkat penyelesaian terendah: ${terendah.laju}% (${terendah.selesai}/${terendah.total}). Tertinggi ${tertinggi.nama} ${tertinggi.laju}%.`,
    })
  }
  const palingLewat = [...wilayah].sort((a, b) => b.lewat - a.lewat)[0]
  if (palingLewat?.lewat && wilayah.length >= 2) {
    poin.push({
      jenis: 'bahaya',
      judul: `Lewat target terbanyak (${labelKelompok})`,
      teks: `${palingLewat.nama}: ${palingLewat.lewat} laporan lewat target dari ${palingLewat.terbuka} yang terbuka.`,
    })
  }

  return { mingguan, kategori, status, wilayah, poin, total, jumlahSelesai, jumlahTerbuka, jumlahLewat, palingLewat }
}
