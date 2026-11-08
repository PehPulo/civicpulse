// PEMILIK: Ezra · KONTRAK: docs/SCORING.md § Panel instansi
// Hitungan panel instansi: target waktu (SLA), ringkasan antrean, kepatuhan SLA, dan fakta untuk LLM.
// Semua angka di panel instansi berasal dari fungsi di sini (diuji di packages/core/test/instansi.test.js),
// bukan dari input petugas, dan bukan dari LLM. LLM hanya merangkai kalimat dari fakta yang sudah dihitung.
import { GalatDomain, KODE_GALAT } from './galat.js'
import { kategoriById } from './kategori.js'
import { LABEL_STATUS, STATUS, STATUS_TERBUKA, waktuStatus } from './status.js'
import { verifikasiSiklusAktif } from './verifikasi.js'

const HARI = 86_400_000
const bulat1 = (x) => Math.round(x * 10) / 10

/**
 * Target internal penanganan (hari sejak laporan masuk sampai klaim selesai), per level prioritas.
 * Asumsi demo yang bisa diubah instansi; bukan regulasi. Tinggi harus paling cepat.
 */
export const TARGET_SLA_HARI = { Tinggi: 3, Sedang: 7, Rendah: 14 }
/** Sisa waktu ≤ ambang ini (hari) ⇒ "mendekati batas". */
export const AMBANG_MENDEKATI_HARI = 1

/**
 * Status target waktu satu laporan.
 * Untuk laporan terbuka: dihitung sampai `sekarang`. Untuk yang sudah diklaim selesai: sampai waktu klaim pertama.
 * @returns {{ targetHari: number, umurHari: number, sisaHari: number, lewat: boolean, mendekati: boolean, persen: number, selesai: boolean }}
 */
export function slaLaporan(laporan, sekarang = new Date().toISOString()) {
  const targetHari = TARGET_SLA_HARI[laporan.prioritas?.level] ?? TARGET_SLA_HARI.Rendah
  const klaim = laporan.riwayat?.find((e) => e.status === STATUS.KLAIM_SELESAI)
  const selesai = Boolean(klaim) && !STATUS_TERBUKA.includes(laporan.status)
  const akhir = selesai ? Date.parse(klaim.waktu) : Date.parse(sekarang)
  const umurHari = Math.max(0, bulat1((akhir - Date.parse(laporan.dibuat)) / HARI))
  const sisaHari = bulat1(targetHari - umurHari)
  return {
    targetHari,
    umurHari,
    sisaHari,
    lewat: umurHari > targetHari,
    mendekati: !selesai && umurHari <= targetHari && sisaHari <= AMBANG_MENDEKATI_HARI,
    persen: Math.min(100, Math.round((umurHari / targetHari) * 100)),
    selesai,
  }
}

/** Kategori dari AI (saat warga melapor) berbeda dengan kategori yang dipilih warga. */
export const kategoriAiBeda = (l) => Boolean(l.ai?.kategoriSaran) && l.ai.kategoriSaran !== l.kategoriId

/** Jumlah verifikasi siklus aktif yang fotonya diragukan AI (penanda, tetap sah). */
export const jumlahAiMeragukan = (l) => verifikasiSiklusAktif(l).filter((v) => v.cek?.aiMeragukan).length

/** Urutan antrean. 'prioritas' (bawaan) = skor tertinggi dulu, seri ⇒ yang paling lama menunggu. */
export const CARA_URUT = {
  prioritas: (a, b) => b.prioritas.skor - a.prioritas.skor || Date.parse(a.dibuat) - Date.parse(b.dibuat),
  terlama: (a, b) => Date.parse(a.dibuat) - Date.parse(b.dibuat),
  terbaru: (a, b) => Date.parse(b.dibuat) - Date.parse(a.dibuat),
  dukungan: (a, b) => (b.jumlahDukungan ?? 0) - (a.jumlahDukungan ?? 0) || b.prioritas.skor - a.prioritas.skor,
}
export const urutkanAntrean = (daftar, cara = 'prioritas') => [...daftar].sort(CARA_URUT[cara] ?? CARA_URUT.prioritas)

/**
 * Ringkasan antrean untuk beranda petugas. Masukan: laporan (bentuk publik atau lengkap).
 */
export function ringkasanAntrean(semuaLaporan, sekarang = new Date().toISOString()) {
  const terbuka = semuaLaporan.filter((l) => STATUS_TERBUKA.includes(l.status))
  const sla = new Map(semuaLaporan.map((l) => [l.kode, slaLaporan(l, sekarang)]))

  const perStatus = Object.fromEntries(Object.values(STATUS).map((s) => [s, 0]))
  for (const l of semuaLaporan) perStatus[l.status] = (perStatus[l.status] ?? 0) + 1

  const perLevel = { Tinggi: 0, Sedang: 0, Rendah: 0 }
  for (const l of terbuka) perLevel[l.prioritas.level] = (perLevel[l.prioritas.level] ?? 0) + 1

  const lewat = terbuka.filter((l) => sla.get(l.kode).lewat)
  const mendekati = terbuka.filter((l) => sla.get(l.kode).mendekati)
  const umur = terbuka.map((l) => sla.get(l.kode).umurHari)

  const wilayah = new Map()
  for (const l of terbuka) {
    const w = wilayah.get(l.wilayahId) ?? { wilayahId: l.wilayahId, terbuka: 0, lewatSla: 0, skorMaks: 0 }
    w.terbuka += 1
    if (sla.get(l.kode).lewat) w.lewatSla += 1
    w.skorMaks = Math.max(w.skorMaks, l.prioritas.skor)
    wilayah.set(l.wilayahId, w)
  }

  const kategori = {}
  for (const l of terbuka) kategori[l.kategoriId] = (kategori[l.kategoriId] ?? 0) + 1

  return {
    dihitung: sekarang,
    total: semuaLaporan.length,
    terbuka: terbuka.length,
    perStatus,
    perLevel,
    lewatSla: lewat.length,
    mendekatiSla: mendekati.length,
    menungguVerifikasi: perStatus[STATUS.KLAIM_SELESAI],
    dibukaUlang: perStatus[STATUS.DIBUKA_ULANG],
    umurRataHari: umur.length ? bulat1(umur.reduce((s, x) => s + x, 0) / umur.length) : 0,
    umurMaksHari: umur.length ? Math.max(...umur) : 0,
    perWilayah: [...wilayah.values()].sort((a, b) => b.lewatSla - a.lewatSla || b.terbuka - a.terbuka),
    perKategori: kategori,
    teratas: urutkanAntrean(terbuka)
      .slice(0, 5)
      .map((l) => l.kode),
    daftarLewat: urutkanAntrean(lewat).map((l) => l.kode),
    aiKategoriBeda: terbuka.filter(kategoriAiBeda).length,
    aiFotoDiragukan: semuaLaporan.filter((l) => l.status === STATUS.KLAIM_SELESAI && jumlahAiMeragukan(l) > 0).length,
  }
}

/**
 * Kepatuhan target waktu: dari laporan yang sudah pernah diklaim selesai, berapa persen diklaim tepat waktu.
 * @returns {{ dinilai: number, tepat: number, persen: number, perLevel: Record<string, {dinilai: number, tepat: number, persen: number}> }}
 */
export function kepatuhanSla(semuaLaporan) {
  const persen = (t, n) => (n ? Math.round((t / n) * 100) : 0)
  const perLevel = Object.fromEntries(Object.keys(TARGET_SLA_HARI).map((k) => [k, { dinilai: 0, tepat: 0 }]))
  let dinilai = 0
  let tepat = 0
  for (const l of semuaLaporan) {
    const klaim = l.riwayat?.find((e) => e.status === STATUS.KLAIM_SELESAI)
    if (!klaim) continue
    const hari = (Date.parse(klaim.waktu) - Date.parse(l.dibuat)) / HARI
    const ok = hari <= (TARGET_SLA_HARI[l.prioritas.level] ?? TARGET_SLA_HARI.Rendah)
    dinilai += 1
    tepat += ok ? 1 : 0
    const p = perLevel[l.prioritas.level]
    if (p) {
      p.dinilai += 1
      p.tepat += ok ? 1 : 0
    }
  }
  for (const p of Object.values(perLevel)) p.persen = persen(p.tepat, p.dinilai)
  return { dinilai, tepat, persen: persen(tepat, dinilai), perLevel }
}

// ── Fakta untuk LLM (disusun SERVER dari data resmi; klien tidak mengirim teks apa pun) ──

const namaWilayah = (daftarWilayah, id) => {
  const w = daftarWilayah.find((x) => x.id === id)
  return w ? `Kec. ${w.kecamatan}` : id
}

/** Fakta briefing antrean pagi untuk petugas. */
export function faktaBriefing(r, daftarWilayah) {
  const baris = [
    `Laporan terbuka: ${r.terbuka} (prioritas tinggi ${r.perLevel.Tinggi}, sedang ${r.perLevel.Sedang}, rendah ${r.perLevel.Rendah}).`,
    `Lewat target waktu: ${r.lewatSla} laporan. Mendekati batas (≤ ${AMBANG_MENDEKATI_HARI} hari): ${r.mendekatiSla} laporan.`,
    `Menunggu verifikasi warga: ${r.menungguVerifikasi}. Dibuka ulang oleh warga: ${r.dibukaUlang}.`,
    `Rata-rata umur laporan terbuka: ${r.umurRataHari} hari, terlama ${r.umurMaksHari} hari.`,
  ]
  const beban = r.perWilayah.slice(0, 3)
  if (beban.length)
    baris.push(
      `Kecamatan paling mendesak: ${beban
        .map((w) => `${namaWilayah(daftarWilayah, w.wilayahId)} (${w.terbuka} terbuka, ${w.lewatSla} lewat target)`)
        .join('; ')}.`,
    )
  if (r.aiKategoriBeda)
    baris.push(`Laporan yang kategorinya perlu dicek ulang (beda dengan saran AI): ${r.aiKategoriBeda}.`)
  return baris.join('\n')
}

/** Fakta draf tanggapan publik untuk satu laporan. Catatan petugas (opsional, terautentikasi) ikut sebagai fakta. */
export function faktaTanggapan(laporan, ke, daftarWilayah, { catatan = '', sekarang = new Date().toISOString() } = {}) {
  const s = slaLaporan(laporan, sekarang)
  const baris = [
    `Kode laporan: ${laporan.kode}.`,
    `Masalah: ${kategoriById(laporan.kategoriId)?.label ?? laporan.kategoriId} di ${namaWilayah(daftarWilayah, laporan.wilayahId)}.`,
    `Status sekarang: ${LABEL_STATUS[laporan.status]}. Status baru: ${LABEL_STATUS[ke] ?? ke}.`,
    `Prioritas: ${laporan.prioritas.level}. Laporan sudah ${s.umurHari} hari. Dukungan warga: ${laporan.jumlahDukungan ?? new Set(laporan.dukungan ?? []).size}.`,
  ]
  const terakhirDibukaUlang = waktuStatus(laporan, STATUS.DIBUKA_ULANG)
  if (terakhirDibukaUlang) baris.push('Laporan ini pernah dibuka ulang karena warga menyatakan belum beres.')
  const c = String(catatan).replace(/\s+/g, ' ').trim().slice(0, 280)
  if (c) baris.push(`Catatan petugas: ${c}`)
  return baris.join('\n')
}

/** Pengaman tambahan untuk teks tanggapan publik: tanpa tautan/HTML, panjang wajar. */
export const tanggapanWajar = (teks) =>
  typeof teks === 'string' && teks.length >= 30 && teks.length <= 600 && !/https?:\/\/|www\.|<[a-z/]/i.test(teks)

// ── Profil petugas ──
const POLA_TEKS_PROFIL = /^[\p{L}\d .,'()/-]+$/u
const BATAS_PROFIL = { nama: [3, 40], unit: [2, 40], jabatan: [0, 40] }

/**
 * Validasi & rapikan profil petugas. Nama + unit tampil sebagai "petugas" pada tanggapan publik.
 * @returns {{ nama: string, unit: string, jabatan: string, petugas: string }}
 */
export function validasiProfilPetugas(input) {
  const hasil = {}
  for (const [k, [min, maks]] of Object.entries(BATAS_PROFIL)) {
    const v = String(input?.[k] ?? '')
      .replace(/\s+/g, ' ')
      .trim()
    if (v.length < min || v.length > maks || (v && !POLA_TEKS_PROFIL.test(v)))
      throw new GalatDomain(
        KODE_GALAT.VALIDASI,
        `${k[0].toUpperCase() + k.slice(1)} harus ${min ? `${min}–` : 'maks. '}${maks} karakter, tanpa simbol khusus.`,
      )
    hasil[k] = v
  }
  return { ...hasil, petugas: `${hasil.nama} · ${hasil.unit}` }
}
