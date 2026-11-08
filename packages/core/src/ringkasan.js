// Bahan & fakta ringkasan dasbor untuk LLM, plus pengaman keluarannya (docs/AI.md § LLM).
// Dipakai BERSAMA oleh web (frontend) dan api (server) agar fakta yang dilihat LLM identik.
//
// Keamanan: klien hanya mengirim "bahan" berupa ANGKA dan id wilayah, tidak pernah teks bebas.
// Nama kecamatan & tingkat risiko diambil server dari data resmi, jadi bahan tidak bisa dipakai
// untuk menyelipkan perintah (prompt injection) atau menjadikan endpoint chatbot gratis.
import { GalatDomain, KODE_GALAT } from './galat.js'

const fmt = (x) => (x == null ? '-' : x.toLocaleString('id-ID'))
const nama = (w) => `${w.kecamatan} (${w.kabupaten})`
const risikoMaks = (w) => Math.max(...Object.values(w.risiko))

/** Ambil bahan minimal dari keluaran statistik() untuk dikirim ke server. */
export function bahanDasbor(stat) {
  const atas = stat.perluPerhatian[0]
  return {
    total: stat.total,
    persenTerverifikasi: stat.persenTerverifikasi,
    medianHariTangani: stat.medianHariTangani,
    perluPerhatian: atas ? { wilayahId: atas.wilayahId, terbuka: atas.terbuka } : null,
    senyap: stat.wilayahSenyap.slice(0, 2).map((w) => ({
      wilayahId: w.wilayahId,
      laporan30h: w.laporan30h,
      rataLaporan30h: w.rataLaporan30h,
    })),
  }
}

/** Ubah bahan menjadi daftar fakta. Hanya teks ini yang dilihat LLM. */
export function faktaDasbor(bahan, daftarWilayah) {
  const cari = (id) => daftarWilayah.find((w) => w.id === id)
  const baris = [
    `- Total laporan: ${fmt(bahan.total)}`,
    `- Persen laporan yang terverifikasi warga dari yang diklaim selesai: ${fmt(bahan.persenTerverifikasi)}%`,
    `- Median waktu dari laporan masuk sampai terverifikasi: ${fmt(bahan.medianHariTangani)} hari`,
  ]
  const atas = bahan.perluPerhatian && cari(bahan.perluPerhatian.wilayahId)
  if (atas)
    baris.push(
      `- Wilayah paling perlu perhatian: ${nama(atas)}, ${fmt(bahan.perluPerhatian.terbuka)} laporan belum selesai, risiko bencana ${fmt(risikoMaks(atas))} dari 100`,
    )
  for (const s of bahan.senyap) {
    const w = cari(s.wilayahId)
    if (w)
      baris.push(
        `- Wilayah senyap: ${nama(w)}, risiko ${fmt(risikoMaks(w))} dari 100 tetapi hanya ${fmt(s.laporan30h)} laporan dalam 30 hari (rata-rata wilayah ${fmt(s.rataLaporan30h)})`,
      )
  }
  return baris.join('\n')
}

const BATAS_ANGKA = 1_000_000
function angkaSah(x, { bulat = false, maks = BATAS_ANGKA } = {}) {
  const ok = typeof x === 'number' && Number.isFinite(x) && x >= 0 && x <= maks && (!bulat || Number.isInteger(x))
  if (!ok) throw new GalatDomain(KODE_GALAT.VALIDASI, 'Bahan ringkasan tidak valid.')
  return x
}

/**
 * Validasi ketat bahan dari klien (server WAJIB memanggil ini). Hanya field yang dikenal yang diambil;
 * id wilayah harus ada di data resmi. Melempar GalatDomain VALIDASI bila tidak sah.
 */
export function validasiBahanDasbor(input, daftarWilayah) {
  const idSah = (id) => {
    if (typeof id !== 'string' || !daftarWilayah.some((w) => w.id === id))
      throw new GalatDomain(KODE_GALAT.VALIDASI, 'Wilayah tidak dikenal.')
    return id
  }
  if (!input || typeof input !== 'object') throw new GalatDomain(KODE_GALAT.VALIDASI, 'Bahan ringkasan kosong.')
  const { total, persenTerverifikasi, medianHariTangani, perluPerhatian, senyap } = input
  if (!Array.isArray(senyap) || senyap.length > 2)
    throw new GalatDomain(KODE_GALAT.VALIDASI, 'Bahan ringkasan tidak valid.')
  return {
    total: angkaSah(total, { bulat: true }),
    persenTerverifikasi: angkaSah(persenTerverifikasi, { maks: 100 }),
    medianHariTangani: angkaSah(medianHariTangani, { maks: 3650 }),
    perluPerhatian:
      perluPerhatian == null
        ? null
        : { wilayahId: idSah(perluPerhatian.wilayahId), terbuka: angkaSah(perluPerhatian.terbuka, { bulat: true }) },
    senyap: senyap.map((s) => ({
      wilayahId: idSah(s?.wilayahId),
      laporan30h: angkaSah(s?.laporan30h, { bulat: true }),
      rataLaporan30h: angkaSah(s?.rataLaporan30h),
    })),
  }
}

// ── Pengaman keluaran LLM ─────────────────────────────────────────────────────

const DIGIT_KATA = { nol: 0, satu: 1, dua: 2, tiga: 3, empat: 4, lima: 5, enam: 6, tujuh: 7, delapan: 8, sembilan: 9 }
const KATA_ANGKA = [
  ...Object.keys(DIGIT_KATA),
  'sepuluh',
  'sebelas',
  'seratus',
  'seribu',
  'belas',
  'puluh',
  'ratus',
  'ribu',
  'juta',
]
const KATA = `(?:${KATA_ANGKA.join('|')})`
// Hanya kata utuh: "kedua"/"satu-satunya" tidak dianggap angka.
const POLA_KATA_ANGKA = new RegExp(String.raw`(?<![\p{L}-])${KATA}(?:\s+${KATA})*(?![\p{L}-])`, 'giu')

function nilaiKata(frasa) {
  let total = 0
  let ratusan = 0
  let d = 0
  for (const k of frasa.toLowerCase().split(/\s+/)) {
    if (k in DIGIT_KATA) {
      ratusan += d
      d = DIGIT_KATA[k]
    } else if (k === 'sepuluh') ratusan += 10
    else if (k === 'sebelas') ratusan += 11
    else if (k === 'seratus') ratusan += 100
    else if (k === 'seribu') total += 1000
    else if (k === 'belas') ((ratusan += 10 + d), (d = 0))
    else if (k === 'puluh') ((ratusan += d * 10), (d = 0))
    else if (k === 'ratus') ((ratusan += d * 100), (d = 0))
    else if (k === 'ribu') ((total += (ratusan + d || 1) * 1000), (ratusan = 0), (d = 0))
    else if (k === 'juta') ((total = (total + ratusan + d || 1) * 1_000_000), (ratusan = 0), (d = 0))
  }
  return total + ratusan + d
}

/**
 * Ubah angka yang ditulis dengan huruf menjadi digit ("dua puluh empat" → "24", "dua puluh persen" → "20%"),
 * agar LLM tidak bisa lolos dari pemeriksaan angka dengan mengeja angka karangan.
 */
export const kataKeAngka = (teks) =>
  teks.replace(POLA_KATA_ANGKA, (m) => String(nilaiKata(m))).replace(/(\d)\s*persen\b/gi, '$1%')

// Angka beserta tanda persennya: "73 dari 100" → ["73", "100"], "6,19%" → ["6.19%"].
// Dengan begitu "100%" TIDAK dianggap sama dengan "100 dari 100". Angka berhuruf ikut dihitung.
const angka = (teks) =>
  [...kataKeAngka(teks).matchAll(/(\d+(?:[.,]\d+)?)(\s?%)?/g)].map((m) => m[1].replace(',', '.') + (m[2] ? '%' : ''))

/** true bila setiap angka (dan satuan persennya) di keluaran LLM juga ada di fakta. Mencegah angka karangan. */
export function angkaTerjamin(keluaran, fakta) {
  const sah = new Set(angka(fakta))
  return angka(keluaran).every((a) => sah.has(a))
}

/**
 * true bila keluaran LLM berupa kalimat wajar, bukan keluaran rusak: tidak menyalin format prompt ("Fakta ..."),
 * tidak mengulang frasa 3 kata lebih dari 2 kali, dan cukup panjang. Angka diperiksa terpisah oleh angkaTerjamin.
 */
export function keluaranWajar(keluaran) {
  const teks = keluaran.trim()
  if (teks.length < 30 || /fakta\s*(laporan|dasbor)|ringkasan\s*:/i.test(teks)) return false
  const kata = teks.toLowerCase().match(/[\p{L}\d]+/gu) ?? []
  const hitung = new Map()
  for (let i = 0; i + 2 < kata.length; i++) {
    const f = kata.slice(i, i + 3).join(' ')
    hitung.set(f, (hitung.get(f) ?? 0) + 1)
    if (hitung.get(f) > 2) return false
  }
  return true
}

/** Keluaran LLM boleh ditampilkan sebagai "Ditulis AI" hanya bila wajar DAN semua angkanya ada di fakta. */
export const keluaranAman = (keluaran, fakta) => keluaranWajar(keluaran) && angkaTerjamin(keluaran, fakta)
