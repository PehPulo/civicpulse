// Kelas warna skor kesenjangan (0–100): satu hue biru terang→gelap (sequential, docs/FRONTEND.md § Grafik).
export const KELAS_KESENJANGAN = [
  { maks: 39, warna: '#c6dbf5', label: '0–39' },
  { maks: 54, warna: '#86b2ea', label: '40–54' },
  { maks: 69, warna: '#2a78d6', label: '55–69' },
  { maks: 100, warna: '#174a8c', label: '70–100' },
]
export const warnaKesenjangan = (skor) =>
  (KELAS_KESENJANGAN.find((k) => skor <= k.maks) ?? KELAS_KESENJANGAN.at(-1)).warna
