# data/: Dataset Wilayah

> **Kontrak:** [docs/DATA.md](../docs/DATA.md) (baca ini dulu)

```
data/
├── raw/          ✏️ File ASLI dari BNPB/BPS (jangan diedit manual), lihat raw/README.md
├── scripts/
│   ├── build.js     ✏️ raw → processed (belum diimplementasikan)
│   └── validate.js  cek processed/wilayah.json (jalan di CI)
├── schema/       skema JSON wilayah
└── processed/    wilayah.json, dipakai web & api (saat ini DATA ILUSTRASI)
```

```bash
npm run data:build      # bangun ulang dari data/raw
npm run data:validate   # wajib lulus sebelum PR
```

## `processed/cctv.json` — CCTV publik resmi pemda

- **`portal`** (39): portal CCTV publik resmi milik pemprov/pemkab/pemkot (`*.go.id`), dipetakan ke `wilayahId` di
  `nasional.json`. `cek` = hasil uji HTTP otomatis 2026-11-10 (200 terbuka; 403 situs ada tetapi menolak klien
  otomatis).
- **`kamera`** (413): nama & titik kamera **yang dibuka sendiri oleh peta publik portal resmi**: Kota Malang (252),
  Kota Semarang (70), Kota Banda Aceh (38), Kota Tasikmalaya (29), Kota Bandung (15), Kota Padang (9). Tanpa tautan
  siaran: petugas membuka portal resminya. Tidak ada data ilustrasi.
- Disajikan **hanya lewat backend** `GET /api/v1/cctv/laporan/:kode` (wajib token petugas, laporan dalam
  yurisdiksi, maks. 5 kamera terdekat). Build mode server tidak menyertakan file ini sama sekali.
- Dipakai di panel "CCTV publik terdekat" (meja kerja petugas, `packages/core/src/cctv.js`): kamera ≤1 km (cadangan
  ≤3 km) + draf permintaan rekaman (waktu laporan ±1 jam). Tidak ditampilkan ke warga; tanpa pengenalan wajah.
- Portal yang ada tetapi tidak terjangkau saat pengecekan (tidak dimasukkan): ATCS Sumedang, CCTV Jombang, CCTV
  Jabar (`cctv.jabarprov.go.id`), CCTV tol PU.

**Uji untuk pengecek:** jalankan `npm run dev`, lalu `npm run uji:cctv` (atau `npm run uji:cctv -- --lihat` untuk
menonton di Chrome). Skrip `scripts/uji-cctv.js` membuat laporan uji ±150 m dari kamera nyata di Kota Bandung, Kota
Malang, dan Kota Semarang, login sebagai admin kota masing-masing, lalu memeriksa panel menampilkan kamera ≤1 km dan
draf permintaan rekaman memuat kode laporan.
