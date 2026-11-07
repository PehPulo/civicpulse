// PEMILIK: Ezra (AI) · KONTRAK: docs/AI.md § LLM
// Pengaman anti-halusinasi angka untuk keluaran LLM. Fungsi murni tanpa dependensi (dipakai juga oleh ml/evaluate.js).

// Angka beserta tanda persennya: "73 dari 100" → ["73", "100"], "6,19%" → ["6.19%"].
// Dengan begitu "100%" TIDAK dianggap sama dengan "100 dari 100".
const angka = (teks) =>
  [...teks.matchAll(/(\d+(?:[.,]\d+)?)(\s?%)?/g)].map((m) => m[1].replace(',', '.') + (m[2] ? '%' : ''))

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
