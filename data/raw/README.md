# data/raw

File mentah **asli** dari sumber resmi. Jangan diedit manual; semua perhitungan ada di `data/scripts/build.js`.

| File | Isi | Sumber |
| :-- | :-- | :-- |
| `rbi-2023-jiwa-terpapar.csv` | Jiwa terpapar risiko rendah/sedang/tinggi per kab/kota untuk gempabumi, banjir, tanah longsor | BNPB, *Buku Risiko Bencana Indonesia 2023*, tabel "Risiko Bencana … per-Kabupaten/Kota" (URL halaman per baris) |
| `irbi-2023.csv` | Indeks Risiko Bencana Indonesia 2021–2023 + kelas risiko | BNPB, *Buku IRBI 2023* hal. 101 |
| `bps-miskin.csv` | Persentase & jumlah penduduk miskin Maret 2024 | BPS (BRS Kota Bandung; angka kab/kota lain dikutip detikJabar dari BPS) |
| `wilayah-pilot.csv` | Kecamatan pilot, kab/kota induk, koordinat | OpenStreetMap / Nominatim (id objek OSM per baris) |
| `dibi.csv` | **Belum ada.** Riwayat kejadian bencana | BNPB DIBI, lihat di bawah |

## Menambahkan data kejadian bencana (±3 menit, manual lewat browser)

Situs sumber menolak akses otomatis, jadi file diunduh manual. **Pilih salah satu:**

**A. Open Data Jawa Barat (paling mudah, data 2012–2024)**

1. Buka dua halaman ini di browser dan klik **Unduh → CSV**:
   - <https://opendata.jabarprov.go.id/id/dataset/jumlah-kejadian-bencana-banjir-berdasarkan-kabupatenkota-di-jawa-barat>
   - <https://opendata.jabarprov.go.id/id/dataset/jumlah-kejadian-bencana-tanah-longsor-berdasarkan-kabupatenkota-di-jawa-barat>
2. Simpan **apa adanya** sebagai `data/raw/jabar-banjir.csv` dan `data/raw/jabar-longsor.csv` (tidak perlu diedit).

**B. DIBI BNPB**: buka <https://dibi.bnpb.go.id/>, filter Jawa Barat + 4 kab/kota pilot, ekspor, simpan sebagai `data/raw/dibi.csv` dengan kolom `tahun,kabkota,jenis,jumlah`.

Lalu jalankan:

```bash
npm run data:build && npm run data:validate
```

Faktor "Riwayat kejadian" otomatis aktif kembali (5 tahun terakhir yang ada di file).
