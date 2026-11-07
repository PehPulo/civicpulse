// PEMILIK: Ezra · KONTRAK: docs/DATA.md
//
// Membangun data/processed/wilayah.json dari file mentah di data/raw/:
//   data/raw/irbi.csv       indeks risiko per kab/kota per jenis bahaya
//   data/raw/dibi.csv       daftar kejadian bencana (tanggal, kab/kota, jenis)
//   data/raw/bps-miskin.csv persentase penduduk miskin per kab/kota
//   data/raw/wilayah-pilot.csv  daftar kecamatan pilot + koordinat centroid + kab/kota induk
//
// Langkah:
//   1. baca & bersihkan tiap CSV (nama kab/kota dinormalisasi, mis. "KAB. BANDUNG" → "Kab. Bandung")
//   2. normalisasi IRBI ke 0–100 (min–max nasional, simpan rumusnya di docs/DATA.md)
//   3. hitung kejadian5th per jenis bahaya (periode dicatat di sumber.dibi.periode)
//   4. gabungkan ke tiap kecamatan pilot lewat kab/kota induk
//   5. tulis processed/wilayah.json dengan ilustrasi=false dan sumber{tahun,url}
//   6. jalankan `npm run data:validate`
console.error('data/scripts/build.js belum diimplementasikan. Lihat docs/DATA.md.')
process.exit(1)
