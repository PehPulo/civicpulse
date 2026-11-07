# data/raw

File mentah **asli** dari sumber resmi. Jangan diedit manual; semua perhitungan ada di `data/scripts/build.js`.

| File | Isi | Sumber |
| :-- | :-- | :-- |
| `rbi-2023-jiwa-terpapar.csv` | Jiwa terpapar risiko rendah/sedang/tinggi per kab/kota untuk gempabumi, banjir, tanah longsor | BNPB, *Buku Risiko Bencana Indonesia 2023*, tabel "Risiko Bencana … per-Kabupaten/Kota" (URL halaman per baris) |
| `irbi-2023.csv` | Indeks Risiko Bencana Indonesia 2021–2023 + kelas risiko | BNPB, *Buku IRBI 2023* hal. 101 |
| `bps-miskin.csv` | Persentase & jumlah penduduk miskin Maret 2024 | BPS (BRS Kota Bandung; angka kab/kota lain dikutip detikJabar dari BPS) |
| `wilayah-pilot.csv` | Kecamatan pilot, kab/kota induk, koordinat | OpenStreetMap / Nominatim (id objek OSM per baris) |
| `dibi.csv` | **Belum ada.** Riwayat kejadian bencana | BNPB DIBI, lihat di bawah |

## Menambahkan DIBI (±5 menit, manual)

API DIBI hanya bisa diakses lewat sesi peramban, jadi unduh manual:

1. Buka <https://dibi.bnpb.go.id/>, filter **Provinsi: Jawa Barat**, **Kabupaten**: Bandung, Bandung Barat, Kota Bandung, Kota Cimahi, rentang 5 tahun terakhir.
2. Ekspor tabel kejadian (CSV).
3. Simpan sebagai `data/raw/dibi.csv` dengan kolom `tahun,kabkota,jenis,jumlah` (nama kab/kota ditulis sama seperti di file lain: `Kab. Bandung`, `Kab. Bandung Barat`, `Kota Bandung`, `Kota Cimahi`).
4. Jalankan `npm run data:build && npm run data:validate`. Faktor "Riwayat kejadian" otomatis aktif kembali.
