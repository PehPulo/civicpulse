# packages/core: Aturan Bisnis CivicPulse

> Aturan bisnis bersama yang dipakai web dan API. Setiap perubahan wajib disertai unit test.

Semua aturan bisnis ada di sini dan dipakai bersama oleh `apps/web` dan `apps/api`, sehingga hasilnya selalu sama.

| File | Isi | Kontrak |
| :-- | :-- | :-- |
| `prioritas.js` | Rumus skor 0–100 + kalimat alasan | [SCORING.md](../../docs/SCORING.md) |
| `status.js` | State machine status laporan | [STATUS.md](../../docs/STATUS.md) |
| `verifikasi.js` | Aturan verifikasi warga (radius, waktu, 3 suara) | [STATUS.md](../../docs/STATUS.md) |
| `laporan.js` | Membuat laporan, laporan serupa, proyeksi publik | [DATA-MODEL.md](../../docs/DATA-MODEL.md) |
| `analitik.js` | KPI dasbor, Perlu Perhatian, Wilayah Senyap | [SCORING.md](../../docs/SCORING.md) |
| `kategori.js`, `geo.js`, `galat.js` | Daftar kategori, jarak, kode galat | |

Setiap perubahan **wajib** disertai unit test di `test/` (`npm test`).
