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
