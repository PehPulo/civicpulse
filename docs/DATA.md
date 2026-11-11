# Kontrak Data Publik & Pipeline

> Folder: [`data/`](../data)

## Pipeline

```
data/raw/*.csv ──► data/scripts/build.js ──► data/processed/wilayah.json ──► npm run data:validate (CI)
 (asli, tak diedit)   (bersihkan, normalisasi, gabung)     (dipakai web & api)
```

## Sumber (terimpor 2026-11-07)

| Data | Instansi | Tingkat | Periode | Dipakai untuk | Status |
| :-- | :-- | :-- | :-- | :-- | :-: |
| Buku Risiko Bencana Indonesia (jiwa terpapar per kelas risiko) | BNPB | kab/kota | 2023 | `risiko` | ✅ |
| IRBI (indeks total) | BNPB | kab/kota | 2021–2023 | konteks (`konteks.*.irbi2023`) | ✅ |
| Persentase penduduk miskin | BPS | kab/kota | Maret 2024 | `miskin` | ✅ |
| Koordinat kecamatan | OpenStreetMap | kecamatan | diakses Nov 2026 | `lat,lng` | ✅ |
| DIBI (kejadian bencana) | BNPB | kab/kota | 5 tahun terakhir | `kejadian5th` | ⏳ unduh manual, lihat `data/raw/README.md` |

URL persis tiap angka tercatat per baris di `data/raw/*.csv` dan di `sumber` pada `wilayah.json`.

## Wilayah pilot

Bandung Raya: Kota Bandung (Coblong, Sukajadi), Kab. Bandung (Dayeuhkolot, Baleendah, Bojongsoang), Kab. Bandung Barat (Lembang, Cisarua), Kota Cimahi (Cimahi Selatan).

## Cakupan nasional (`npm run data:geo`)

- Batas: geoBoundaries IDN ADM1 (34 provinsi, OSM, ODbL) & ADM2 (BPS 2020, CC BY 3.0 IGO). Mentah di `data/raw/geo/` (tidak di-commit, 14 MB). Unduh:
  `https://github.com/wmgeolab/geoBoundaries/raw/main/releaseData/gbOpen/IDN/ADM{1,2}/geoBoundaries-IDN-ADM{1,2}.geojson`
  lalu simpan sebagai `data/raw/geo/IDN-ADM1.geojson` dan `IDN-ADM2.geojson`.
- `data/scripts/build-geo.js`: menyederhanakan (Douglas–Peucker), menetapkan provinsi tiap kab/kota (titik-dalam-
  poligon), membuang 5 fitur bukan kab/kota (waduk/danau/hutan) ⇒ 514 kab/kota.
- Keluaran: `data/processed/nasional.json` (daftar provinsi & kab/kota + titik pusat), `apps/web/public/geo/provinsi.json`,
  `apps/web/public/geo/kabkota/<provinsi>.json` (untuk peta wilayah admin).
- Data pilot (8 kecamatan Bandung Raya) tetap asli. Kab/kota lain diwakili satu wilayah **ilustrasi** dengan profil
  risiko deterministik (`gabungWilayah`) dan laporan demo berlabel ilustrasi. Bukan data BNPB/BPS.

## Aturan transformasi (implementasi: `data/scripts/build.js`)

| Field | Aturan |
| :-- | :-- |
| `penduduk` (konteks) | total jiwa terpapar **gempabumi** pada tabel RBI yang sama (seluruh penduduk kab/kota terpapar gempa), jadi penyebut dan pembilang berasal dari satu sumber |
| `risiko.banjir`, `risiko.longsor` | `paparan = (jiwa risiko sedang + tinggi) / penduduk`, lalu `round(100 × paparan / paparan tertinggi antarwilayah pilot)` (0–100, relatif) |
| `risiko.jalan` | proksi: `round((risiko.banjir + risiko.longsor) / 2)`. IRBI tidak punya bahaya jalan; ditulis terang-terangan di Metodologi |
| `kejadian5th` | jumlah kejadian DIBI 5 tahun terakhir per bahaya; `jalan = banjir + longsor`. **`null` selama `dibi.csv` belum ada**: skor lalu mengeluarkan faktor riwayat dan membagi ulang bobotnya (`packages/core`, VERSI_RUMUS 1.1) |
| `miskin` | % penduduk miskin kab/kota (BPS), 2 desimal sesuai rilis |
| `lat,lng` | koordinat objek OSM (batas administratif atau kantor kecamatan) |

Hasil saat ini:

| Kab/kota | Penduduk (RBI) | Terpapar banjir | Terpapar longsor | risiko banjir / longsor / jalan | Miskin |
| :-- | --: | --: | --: | :-: | --: |
| Kab. Bandung | 3.619.360 | 37,4% | 14,3% | 100 / 48 / 74 | 6,19% |
| Kab. Bandung Barat | 1.733.185 | 3,4% | 29,5% | 9 / 100 / 55 | 10,49% |
| Kota Bandung | 2.518.260 | 27,4% | 2,0% | 73 / 7 / 40 | 3,87% |
| Kota Cimahi | 560.512 | 17,5% | 1,2% | 47 / 4 / 26 | 4,39% |

## Batasan yang wajib ditampilkan di halaman Metodologi

1. IRBI, DIBI, dan BPS tersedia per **kabupaten/kota**. Kecamatan dalam satu kab/kota memakai nilai yang sama untuk faktor tersebut.
2. DIBI publik tidak mencakup kejadian terbaru; periode yang dipakai ditulis eksplisit.
3. Skor risiko bersifat relatif antarwilayah pilot (bukan peringkat nasional).
4. Tanpa Supabase, laporan warga di server pengembangan adalah **laporan contoh** (`DEMO_SEED`); data wilayahnya asli.

## Definisi selesai

- [x] File mentah di `data/raw/` dengan URL per baris
- [x] `npm run data:build` menghasilkan `wilayah.json` dengan `ilustrasi: false`
- [x] `npm run data:validate` lulus
- [x] Angka dicek manual: penduduk hasil RBI cocok dengan BPS (Kab. Bandung ±3,6 jt, Kota Bandung ±2,5 jt)
- [ ] `dibi.csv` (unduh manual)
