# data/raw

File mentah **asli** dari sumber resmi. Jangan diedit manual; semua pembersihan dilakukan oleh `data/scripts/build.js`.

| File | Sumber | Cara mendapatkan |
| :-- | :-- | :-- |
| `irbi.csv` | BNPB, Indeks Risiko Bencana Indonesia | Unduh dokumen/tabel IRBI terbaru, ambil baris kab/kota pilot |
| `dibi.csv` | BNPB, DIBI | Ekspor kejadian per kab/kota pilot, kolom: tanggal, kab/kota, jenis |
| `bps-miskin.csv` | BPS, Persentase Penduduk Miskin Kab/Kota | Tabel statistik BPS, rilis terbaru |
| `wilayah-pilot.csv` | Disusun tim | id, kecamatan, kab/kota induk, lat, lng |

Catat tanggal unduh dan URL tiap file di `docs/DATA.md`.
