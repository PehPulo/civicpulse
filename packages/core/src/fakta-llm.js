// PEMILIK: Ezra (AI) · KONTRAK: docs/AI.md § LLM
// Fakta untuk fitur LLM tambahan (warga & petugas). Semua angka dihitung DI SINI dari data resmi; LLM hanya
// merangkai kalimat dan keluarannya diperiksa keluaranAman (setiap angka harus ada di fakta).
// Satu baris = satu fakta, ringkas, agar token prompt kecil.
import { kategoriById } from './kategori.js'
import { BOBOT, AMBANG } from './prioritas.js'
import { LABEL_STATUS, STATUS, STATUS_TERBUKA } from './status.js'
import { ATURAN_VERIFIKASI } from './verifikasi.js'
import { TARGET_SLA_HARI, faktaBriefing, kepatuhanSla, slaLaporan } from './instansi.js'
import { rencanaKerja, reguMinimal } from './perencanaan.js'

const labelKategori = (id) => kategoriById(id)?.label ?? id
const namaLok = (w) =>
  !w ? 'wilayah tidak dikenal' : w.ilustrasi ? w.kecamatan : `Kec. ${w.kecamatan}, ${w.kabupaten}`
const cari = (daftarWilayah, id) => daftarWilayah.find((w) => w.id === id)
const jumlahDukungan = (l) => l.jumlahDukungan ?? new Set(l.dukungan ?? []).size
const persenBobot = (f) => Math.round(f.bobot * 100)

/** Penjelasan skor untuk warga di halaman detail laporan. */
export function faktaPenjelasan(laporan, daftarWilayah, sekarang = new Date().toISOString()) {
  const s = slaLaporan(laporan, sekarang)
  const p = laporan.prioritas
  return [
    `Masalah: ${labelKategori(laporan.kategoriId)} di ${namaLok(cari(daftarWilayah, laporan.wilayahId))}.`,
    `Skor prioritas: ${p.skor} dari 100, tingkat ${p.level}.`,
    ...p.faktor.map((f) =>
      f.tersedia === false
        ? `Faktor ${f.label}: data belum tersedia, tidak dihitung.`
        : `Faktor ${f.label} (bobot ${persenBobot(f)}%): ${f.tampil}.`,
    ),
    `Status: ${LABEL_STATUS[laporan.status] ?? laporan.status}. Umur laporan: ${s.umurHari} hari, target penanganan ${s.targetHari} hari.`,
    `Dukungan warga: ${jumlahDukungan(laporan)}.`,
  ].join('\n')
}

// Bahaya utama & langkah aman per kategori (ditulis tim, bukan AI) ⇒ LLM hanya merangkai, tidak mengarang saran.
const BAHAYA_KATEGORI = {
  drainase:
    'air saluran meluap ke jalan dan rumah saat hujan; lubang atau penutup saluran yang terbuka; sampah menumpuk dan sarang nyamuk. Langkah aman: jangan membuang sampah ke saluran, beri tanda pada penutup saluran yang hilang, pindahkan barang berharga dari lantai saat hujan deras.',
  banjir:
    'arus genangan yang bisa menyeret; lubang dan saluran yang tidak terlihat di bawah air; sengatan listrik; air kotor. Langkah aman: jangan berjalan atau berkendara menembus genangan berarus, matikan listrik bila air masuk rumah, cuci tangan dan kaki setelah terkena air banjir.',
  jalan:
    'lubang yang sulit terlihat saat malam atau hujan; pengendara motor terjatuh; kendaraan mengerem mendadak. Langkah aman: kurangi kecepatan, beri tanda di sekitar lubang dengan benda mencolok bila aman, ingatkan anak-anak agar tidak bermain di dekat lubang.',
  longsor:
    'retakan tanah di lereng; tanah bergerak saat hujan deras; rumah atau jalan di bawah lereng. Langkah aman: jauhi lereng yang retak terutama saat hujan, siapkan jalur dan tas siaga untuk mengungsi, segera menjauh bila terdengar suara gemuruh atau pohon miring.',
  lainnya:
    'fasilitas rusak yang bisa roboh atau melukai; kabel atau benda yang menjuntai. Langkah aman: jauhi area fasilitas yang rusak, jangan menyentuh kabel yang menjuntai, beri tanda peringatan bila aman.',
}

/** Tips keselamatan sementara (dicache per kategori + tingkat, jadi sangat hemat token). */
export function faktaTips(kategoriId, level) {
  const k = kategoriById(kategoriId) ?? kategoriById('lainnya')
  return [
    `Jenis masalah: ${k.label}. Tingkat prioritas: ${level}.`,
    `Bahaya utama dan langkah aman: ${BAHAYA_KATEGORI[k.id] ?? BAHAYA_KATEGORI.lainnya}`,
  ].join('\n')
}

/** Ringkasan kondisi satu kecamatan untuk panel wilayah di Peta. */
export function faktaWilayah(semuaLaporan, wilayah, sekarang = new Date().toISOString()) {
  const milik = semuaLaporan.filter((l) => l.wilayahId === wilayah.id)
  const terbuka = milik.filter((l) => STATUS_TERBUKA.includes(l.status))
  const perKategori = {}
  for (const l of terbuka) perKategori[l.kategoriId] = (perKategori[l.kategoriId] ?? 0) + 1
  const kat = Object.entries(perKategori).sort((a, b) => b[1] - a[1])
  const lewat = terbuka.filter((l) => slaLaporan(l, sekarang).lewat).length
  const risiko = Object.entries(wilayah.risiko ?? {}).sort((a, b) => b[1] - a[1])[0]
  const baris = [
    `Wilayah: ${namaLok(wilayah)}${wilayah.ilustrasi ? ' (data ilustrasi)' : ''}.`,
    `Total laporan: ${milik.length}. Masih terbuka: ${terbuka.length}. Lewat target waktu: ${lewat}.`,
    `Sudah terverifikasi beres oleh warga: ${milik.filter((l) => l.status === STATUS.TERVERIFIKASI).length}.`,
  ]
  if (kat.length)
    baris.push(`Masalah terbuka terbanyak: ${kat.map(([id, n]) => `${labelKategori(id)} ${n}`).join(', ')}.`)
  if (terbuka.length)
    baris.push(`Skor prioritas tertinggi yang masih terbuka: ${Math.max(...terbuka.map((l) => l.prioritas.skor))}.`)
  if (risiko) baris.push(`Risiko bencana tertinggi: ${risiko[0]} ${risiko[1]}/100.`)
  if (wilayah.miskin != null) baris.push(`Penduduk miskin: ${wilayah.miskin}%.`)
  return baris.join('\n')
}

/** Saran langkah kerja untuk petugas, satu laporan. Hanya data terstruktur (deskripsi warga TIDAK masuk). */
export function faktaSaranTindakan(laporan, daftarWilayah, sekarang = new Date().toISOString()) {
  const s = slaLaporan(laporan, sekarang)
  const p = laporan.prioritas
  const baris = [
    `Kode: ${laporan.kode}. Masalah: ${labelKategori(laporan.kategoriId)} di ${namaLok(cari(daftarWilayah, laporan.wilayahId))}.`,
    `Status: ${LABEL_STATUS[laporan.status] ?? laporan.status}. Prioritas ${p.level}, skor ${p.skor}.`,
    s.lewat
      ? `Sudah lewat target waktu: umur ${s.umurHari} hari, target ${s.targetHari} hari.`
      : `Umur ${s.umurHari} hari dari target ${s.targetHari} hari${s.mendekati ? ' (mendekati batas)' : ''}.`,
    `Faktor terbesar: ${[...p.faktor].sort((a, b) => b.kontribusi - a.kontribusi)[0]?.label ?? '-'}.`,
    `Dukungan warga: ${jumlahDukungan(laporan)}.`,
  ]
  if (laporan.ai?.kategoriSaran && laporan.ai.kategoriSaran !== laporan.kategoriId)
    baris.push(`AI foto menyarankan kategori lain: ${labelKategori(laporan.ai.kategoriSaran)}.`)
  if (laporan.riwayat?.some((e) => e.status === STATUS.DIBUKA_ULANG))
    baris.push('Pernah dibuka ulang karena warga menyatakan belum beres.')
  if (laporan.status === STATUS.KLAIM_SELESAI)
    baris.push(`Menunggu ${ATURAN_VERIFIKASI.target} verifikasi warga dalam ${ATURAN_VERIFIKASI.batasHari} hari.`)
  return baris.join('\n')
}

/**
 * Catatan supervisi (provinsi/pusat) dari agregat peringkat wilayah bawahan.
 * @param {{nama: string, skor: number|null, terbuka: number, lewatSla: number, persenTepat: number|null}[]} baris
 */
export function faktaSupervisi(baris, { cakupan, satuan = 'wilayah' } = {}) {
  const ada = baris.filter((b) => b.skor != null)
  const urut = [...ada].sort((a, b) => a.skor - b.skor)
  const tampil = (b) =>
    `${b.nama} (skor ${b.skor}, ${b.terbuka} terbuka, ${b.lewatSla} lewat target${b.persenTepat != null ? `, ${b.persenTepat}% tepat waktu` : ''})`
  const totalTerbuka = ada.reduce((s, b) => s + b.terbuka, 0)
  const totalLewat = ada.reduce((s, b) => s + b.lewatSla, 0)
  const out = [
    `Cakupan: ${cakupan}. ${satuan} dengan laporan: ${ada.length} dari ${baris.length}.`,
    `Total terbuka: ${totalTerbuka}. Total lewat target: ${totalLewat}.`,
  ]
  if (urut.length) {
    out.push(`Kinerja terendah: ${urut.slice(0, 3).map(tampil).join('; ')}.`)
    out.push(`Kinerja tertinggi: ${urut.slice(-3).reverse().map(tampil).join('; ')}.`)
  }
  return out.join('\n')
}

/** Narasi rekap & rencana kerja untuk dokumen dinas. */
export function faktaRekap(semuaLaporan, sekarang = new Date().toISOString(), { regu = 3, kapasitas = 2 } = {}) {
  const perStatus = {}
  for (const l of semuaLaporan) perStatus[l.status] = (perStatus[l.status] ?? 0) + 1
  const terbuka = semuaLaporan.filter((l) => STATUS_TERBUKA.includes(l.status))
  const perKategori = {}
  for (const l of semuaLaporan) perKategori[l.kategoriId] = (perKategori[l.kategoriId] ?? 0) + 1
  const sla = kepatuhanSla(semuaLaporan)
  const rk = rencanaKerja(semuaLaporan, { regu, kapasitas, sekarang })
  const minimal = reguMinimal(semuaLaporan, { kapasitas, sekarang })
  return [
    `Total laporan: ${semuaLaporan.length}. Terbuka: ${terbuka.length}. Terverifikasi beres: ${perStatus[STATUS.TERVERIFIKASI] ?? 0}.`,
    `Per status: ${Object.entries(perStatus)
      .map(([s, n]) => `${LABEL_STATUS[s] ?? s} ${n}`)
      .join(', ')}.`,
    `Per kategori: ${Object.entries(perKategori)
      .sort((a, b) => b[1] - a[1])
      .map(([k, n]) => `${labelKategori(k)} ${n}`)
      .join(', ')}.`,
    `Kepatuhan target waktu: ${sla.persen}% (${sla.tepat} dari ${sla.dinilai} klaim tepat waktu).`,
    `Rencana kerja dengan ${rk.regu} regu x ${rk.kapasitas} laporan/hari: selesai dalam ${rk.hari} hari, ${rk.terlambat} laporan terlambat (${rk.sudahLewat} sudah lewat sejak awal).`,
    minimal
      ? `Regu minimal agar tidak ada keterlambatan baru: ${minimal}.`
      : 'Regu minimal tidak tercapai dengan batas 30 regu.',
  ].join('\n')
}

/** Fakta ringkas untuk asisten tanya-data petugas (sengaja pendek ⇒ token kecil). */
export function faktaTanyaData(ringkasan, daftarWilayah) {
  const kat = Object.entries(ringkasan.perKategori ?? {})
    .sort((a, b) => b[1] - a[1])
    .map(([k, n]) => `${labelKategori(k)} ${n}`)
    .join(', ')
  return [
    `Total laporan: ${ringkasan.total}.`,
    faktaBriefing(ringkasan, daftarWilayah),
    kat && `Laporan terbuka per kategori: ${kat}.`,
  ]
    .filter(Boolean)
    .join('\n')
}

/** Fakta metodologi untuk "Tanya Metodologi" (statis ⇒ cache sangat efektif). */
export function faktaMetodologi() {
  const b = (k) => `${Math.round(BOBOT[k] * 100)}%`
  return [
    `Skor prioritas 0 sampai 100 dari 4 faktor: risiko wilayah ${b('risiko')} (IRBI BNPB), riwayat kejadian ${b('riwayat')} (DIBI BNPB), kerentanan sosial ${b('kemiskinan')} (persen penduduk miskin BPS), laporan serupa ${b('serupa')} (warga lain dalam radius 500 m, 30 hari).`,
    `Tingkat: Tinggi bila skor minimal ${AMBANG.tinggi}, Sedang bila minimal ${AMBANG.sedang}, selain itu Rendah.`,
    'Faktor yang datanya belum tersedia tidak dihitung dan bobotnya dibagi ulang ke faktor lain.',
    'Jumlah dukungan warga menambah faktor laporan serupa. AI tidak pernah mengubah skor atau status.',
    `Target penanganan: Tinggi ${TARGET_SLA_HARI.Tinggi} hari, Sedang ${TARGET_SLA_HARI.Sedang} hari, Rendah ${TARGET_SLA_HARI.Rendah} hari.`,
    `Laporan selesai bila minimal ${ATURAN_VERIFIKASI.target} warga mengirim foto berlokasi dalam radius ${ATURAN_VERIFIKASI.radiusMeter} m yang menyatakan beres; tanpa itu dalam ${ATURAN_VERIFIKASI.batasHari} hari laporan dibuka ulang.`,
    'Pelaporan tanpa akun dan tanpa unduhan aplikasi. Foto untuk AI dianalisis di server lalu dibuang.',
  ].join('\n')
}

/** Rapikan teks bebas dari pengguna (pertanyaan, draf laporan) sebelum masuk prompt. */
export const bersihkanTeksBebas = (teks, maks) =>
  String(teks ?? '')
    .replace(/[<>`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maks)
