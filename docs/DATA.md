# Kontrak Data Publik & Pipeline

> Pemilik kontrak & implementasi: **Ezra** · Folder: [`data/`](../data)

## Pipeline

```
data/raw/*.csv ──► data/scripts/build.js ──► data/processed/wilayah.json ──► npm run data:validate (CI)
 (asli, tak diedit)   (bersihkan, normalisasi, gabung)     (dipakai web & api)
```

## Sumber

| Data | Instansi | Tingkat | Periode | Dipakai untuk |
| :-- | :-- | :-- | :-- | :-- |
| IRBI (Indeks Risiko Bencana Indonesia) | BNPB | kab/kota | edisi terbaru yang tersedia | `risiko` |
| DIBI (Data & Informasi Bencana Indonesia) | BNPB | kab/kota | 5 tahun terakhir yang tersedia (DIBI publik hingga 2021) | `kejadian5th` |
| Persentase penduduk miskin | BPS | kab/kota | rilis terbaru | `miskin` |
| Alokasi anggaran (pengembangan lanjut) | DJPK Kemenkeu | kab/kota | | pembanding |

Isi `sumber.{irbi,dibi,bps}` di `wilayah.json` dengan `tahun/periode` dan `url` **persis** dari tempat mengunduh. CI menolak data asli tanpa URL.

## Wilayah pilot

Bandung Raya: Kota Bandung (Coblong, Sukajadi), Kab. Bandung (Dayeuhkolot, Baleendah, Bojongsoang), Kab. Bandung Barat (Lembang, Cisarua), Kota Cimahi (Cimahi Selatan).

## Aturan transformasi

| Field | Aturan |
| :-- | :-- |
| `risiko.<bahaya>` | IRBI kab/kota untuk bahaya terkait, dinormalisasi **min–max nasional** ke 0–100, dibulatkan. `jalan` memakai proksi yang ditulis di bawah |
| `kejadian5th.<bahaya>` | jumlah kejadian DIBI per kab/kota dalam periode 5 tahun |
| `miskin` | % penduduk miskin kab/kota, 1 desimal |
| `lat,lng` | centroid kecamatan (sumber: OpenStreetMap/BIG, catat) |

**Proksi `jalan`:** IRBI tidak memiliki bahaya "kerusakan jalan". Gunakan rata-rata risiko banjir & longsor kab/kota (dinormalisasi). **Tulis ini terang-terangan** di halaman Metodologi.

## Batasan yang wajib ditampilkan di halaman Metodologi

1. IRBI, DIBI, dan BPS tersedia per **kabupaten/kota**. Kecamatan dalam satu kab/kota memakai nilai yang sama untuk faktor tersebut.
2. DIBI publik tidak mencakup kejadian terbaru; periode yang dipakai ditulis eksplisit.
3. Selama `ilustrasi: true`, UI menampilkan label **"Data ilustrasi"**.

## Definisi selesai

- [ ] File mentah di `data/raw/` + tanggal unduh & URL dicatat di tabel ini
- [ ] `npm run data:build` menghasilkan `wilayah.json` dengan `ilustrasi: false`
- [ ] `npm run data:validate` lulus
- [ ] Angka dicek manual untuk 2 wilayah
