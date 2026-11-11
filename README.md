<div align="center">

# 🛰️ CivicPulse: Lapor Berkonteks

**Setiap laporan warga punya konteks, prioritas yang bisa dijelaskan, dan bukti penyelesaian dari warga sendiri.**

### 🌐 [civicpulse.my.id](https://civicpulse.my.id)

Web In Action, Multimedia In Action 2026 · Tema *Designing Digital Futures: Powering Public Transparency*
Subtema **Civic Reporting & Accountability**, didukung **Data-Driven Decision Support**

[![CI](https://github.com/PehPulo/civicpulse/actions/workflows/ci.yml/badge.svg)](https://github.com/PehPulo/civicpulse/actions/workflows/ci.yml)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Hono](https://img.shields.io/badge/Hono-API-E36002?logo=hono&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![CLIP](https://img.shields.io/badge/Computer_Vision-CLIP-0a3d24)
![Groq](https://img.shields.io/badge/LLM-Groq_gpt--oss--20b-F55036)
![License](https://img.shields.io/badge/license-MIT-green)

![Beranda CivicPulse](submission/screenshots/alur/01-beranda.png)

</div>

---

## Masalah yang kami jawab

Pagi ini dinas menerima dua laporan. Jalan berlubang di kompleks ramai, didukung lima puluh orang. Saluran tersumbat di
wilayah langganan banjir, dilaporkan satu orang. Regu cuma satu. Mana duluan?

Aplikasi pelaporan biasa hanya melihat foto dan jumlah dukungan. Status "selesai" juga cukup diklik petugas, tanpa bukti
dari warga. **CivicPulse** menjawabnya dengan tiga hal:

| | Prinsip | Caranya |
| :-: | :-- | :-- |
| 1 | **Konteks wilayah** | Setiap laporan otomatis diperkaya data publik resmi: risiko bencana (IRBI BNPB), riwayat kejadian (DIBI BNPB), dan kemiskinan (BPS) |
| 2 | **Prioritas yang bisa dijelaskan** | Skor 0–100 dari rumus terbuka, lengkap dengan rincian poin tiap faktor dan kalimat "kenapa" |
| 3 | **Selesai dibuktikan warga** | Klaim selesai dari instansi baru sah setelah ≥ 3 warga sekitar memverifikasi dengan foto berlokasi (radius 200 m) |

## 🔑 Coba sekarang

**Situs:** [https://civicpulse.my.id](https://civicpulse.my.id) · **Panel instansi:** [/instansi/masuk](https://civicpulse.my.id/instansi/masuk)

Semua akun admin memakai password **`civicpulse2026`**.

| Peran | Username contoh | Bisa apa |
| :-- | :-- | :-- |
| Admin Kab/Kota | `admin.kota-bandung` | Tangani laporan: proses, klaim selesai, tanggapan publik, rencana kerja regu |
| Admin Provinsi | `admin.jawa-barat` | Awasi kab/kota, teruskan arahan pusat, peringkat & kerentanan |
| Admin Pusat | `admin.pusat` | Pantau 34 provinsi, kirim arahan ke provinsi |

Nama wilayah ditulis huruf kecil dengan tanda hubung, misalnya `admin.kota-malang` atau `admin.jawa-timur`.
Laporan contoh untuk mencoba verifikasi warga: [`/laporan/CP-2026-0417`](https://civicpulse.my.id/laporan/CP-2026-0417).

---

## 📸 Alur lengkap

### 1. Warga: melapor sampai membuktikan selesai

| Beranda | Lapor (3 langkah, AI membaca foto) |
| :-: | :-: |
| ![Beranda](submission/screenshots/alur/01-beranda.png) | ![Lapor](submission/screenshots/alur/02-lapor.png) |
| **Hasil: skor prioritas + alasannya** | **Detail laporan + verifikasi warga** |
| ![Hasil skor](submission/screenshots/alur/03-lapor-hasil-skor.png) | ![Detail](submission/screenshots/alur/04-detail-laporan.png) |
| **Lacak tanpa akun** | **Peta laporan** |
| ![Lacak](submission/screenshots/alur/05-lacak.png) | ![Peta](submission/screenshots/alur/06-peta.png) |
| **Dasbor akuntabilitas publik** | **Metodologi skor (interaktif)** |
| ![Dasbor](submission/screenshots/alur/07-dasbor.png) | ![Metodologi](submission/screenshots/alur/08-metodologi.png) |

<p align="center">
  <img src="submission/screenshots/alur/09-beranda-hp.png" width="240" alt="Beranda di HP">
  &nbsp;&nbsp;
  <img src="submission/screenshots/alur/10-lapor-hp.png" width="240" alt="Lapor di HP">
  <br><em>Dirancang untuk HP warga</em>
</p>

### 2. Admin Kab/Kota: menangani laporan

| Masuk panel instansi | Ringkasan |
| :-: | :-: |
| ![Masuk](submission/screenshots/alur/19-masuk-instansi.png) | ![Ringkasan](submission/screenshots/alur/20-kab-ringkasan.png) |
| **Antrean (urut skor & target waktu)** | **Tindak lanjut: ubah status, tanggapan, CCTV terdekat** |
| ![Antrean](submission/screenshots/alur/21-kab-antrean.png) | ![Tindak lanjut](submission/screenshots/alur/28-kab-tindak-lanjut.png) |
| **Peta tugas** | **Rencana kerja regu** |
| ![Peta tugas](submission/screenshots/alur/22-kab-peta.png) | ![Rencana](submission/screenshots/alur/23-kab-rencana.png) |
| **Arahan atasan** | **Estimasi anggaran** |
| ![Arahan](submission/screenshots/alur/24-kab-supervisi.png) | ![Anggaran](submission/screenshots/alur/25-kab-anggaran.png) |
| **Kinerja & target** | **Rekap & cetak** |
| ![Kinerja](submission/screenshots/alur/26-kab-kinerja.png) | ![Rekap](submission/screenshots/alur/27-kab-rekap.png) |

### 3. Admin Provinsi: mengawasi kab/kota

| Ringkasan provinsi | Pantau laporan |
| :-: | :-: |
| ![Ringkasan](submission/screenshots/alur/40-prov-ringkasan.png) | ![Pantau](submission/screenshots/alur/41-prov-antrean.png) |
| **Peta wilayah** | **Arahan dari pusat** |
| ![Peta](submission/screenshots/alur/42-prov-peta.png) | ![Arahan pusat](submission/screenshots/alur/43-prov-arahan-pusat.png) |
| **Arahan ke kab/kota** | **Admin kab/kota** |
| ![Arahan kab/kota](submission/screenshots/alur/44-prov-supervisi.png) | ![Admin](submission/screenshots/alur/45-prov-admin.png) |
| **Peringkat kab/kota** | **Kerentanan sosial** |
| ![Peringkat](submission/screenshots/alur/46-prov-peringkat.png) | ![Kerentanan](submission/screenshots/alur/47-prov-kerentanan.png) |
| **Kebutuhan anggaran** | **Kinerja provinsi** |
| ![Anggaran](submission/screenshots/alur/48-prov-anggaran.png) | ![Kinerja](submission/screenshots/alur/49-prov-kinerja.png) |

<p align="center"><img src="submission/screenshots/alur/50-prov-rekap.png" width="49%" alt="Rekap provinsi"><br><em>Rekap & cetak</em></p>

### 4. Admin Pusat: seluruh Indonesia dalam satu layar

| Ringkasan nasional | Pantau laporan |
| :-: | :-: |
| ![Ringkasan](submission/screenshots/alur/60-pusat-ringkasan.png) | ![Pantau](submission/screenshots/alur/61-pusat-antrean.png) |
| **Peta wilayah** | **Arahan ke provinsi** |
| ![Peta](submission/screenshots/alur/62-pusat-peta.png) | ![Arahan](submission/screenshots/alur/63-pusat-supervisi.png) |
| **Admin provinsi** | **Peringkat provinsi** |
| ![Admin](submission/screenshots/alur/64-pusat-admin.png) | ![Peringkat](submission/screenshots/alur/65-pusat-peringkat.png) |
| **Kerentanan sosial** | **Kebutuhan anggaran** |
| ![Kerentanan](submission/screenshots/alur/66-pusat-kerentanan.png) | ![Anggaran](submission/screenshots/alur/67-pusat-anggaran.png) |
| **Kinerja nasional** | **Rekap & cetak** |
| ![Kinerja](submission/screenshots/alur/68-pusat-kinerja.png) | ![Rekap](submission/screenshots/alur/69-pusat-rekap.png) |

---

## 🤖 Peran AI: membantu, bukan memutuskan

Semua AI berjalan **lewat server CivicPulse**: HP warga tidak perlu mengunduh model, dan kunci API tidak pernah sampai
ke browser.

| Untuk | Fitur AI | Di mana |
| :-- | :-- | :-- |
| Warga | **Membaca foto**: computer vision (CLIP) menebak jenis masalah dan memeriksa foto bukti verifikasi | Lapor, Verifikasi |
| Warga | **Bantu tulis laporan**: merapikan judul & deskripsi tanpa menambah fakta | Lapor |
| Warga | **Tanya CivicPulse**: chat di pojok kanan bawah | Semua halaman warga |
| Warga | **Penjelasan skor** & **tips keselamatan** sesuai jenis bahaya | Detail laporan |
| Warga | **Ringkasan otomatis** kondisi laporan | Beranda, Peta, Dasbor |
| Petugas | **Saran tindakan** per laporan | Tindak lanjut |
| Petugas | **Catatan supervisi** wilayah | Peringkat (provinsi & pusat) |
| Petugas | **Narasi rekap & rencana kerja** siap salin ke dokumen dinas | Rekap, Rencana kerja |
| Petugas | **Asisten tanya-data** | Semua halaman instansi |

**Pengaman:**

- Skor prioritas dihitung rumus terbuka, bukan AI. Status selesai ditentukan verifikasi warga, bukan AI.
- AI hanya menulis dari fakta yang disusun server. Setiap angka di jawaban dicocokkan dengan data; angka karangan
  membuat jawaban dibuang dan diganti teks template.
- Cache, batas permintaan per IP, dan plafon token harian.

**Hasil evaluasi:** CLIP `clip-v2` top-1 **84,1%** dan top-3 **97,7%** pada 44 foto asli; verifikasi foto bukti
**76,2%** pada 63 foto ([laporan](ml/reports/clip-v2.md)). Ringkasan Groq lolos pengaman angka **10/10**
([laporan](ml/reports/ringkasan-groq-gpt-oss-20b-v1.md)). Detail: [docs/AI.md](docs/AI.md).

### Computer vision, LLM, dan token

- **CLIP** memakai klasifikasi zero-shot: representasi foto dibandingkan dengan deskripsi kategori yang sudah ditentukan. Sistem mengambil label dengan skor tertinggi dan dapat menampilkan tiga kandidat. Ini saran untuk warga; bukan keputusan otomatis.
- **LLM** dipakai untuk membantu menulis dan merangkum. Server menyiapkan fakta dan instruksi yang relevan lalu memanggil model `openai/gpt-oss-20b` lewat Groq. Kunci API tetap di server.
- **Token** adalah potongan teks yang dipakai model untuk membaca masukan dan membentuk jawaban. Token bisa berupa satu kata, bagian kata, angka, atau tanda baca; satu token tidak selalu sama dengan satu kata. Panjang konteks masukan dan keluaran memengaruhi pemakaian token.
- Pengendalian pemakaian mencakup batas token jawaban per tugas, cache, rate limit, serta plafon **150.000 token per hari**. Keluaran angka diperiksa terhadap fakta, dan ringkasan berbasis aturan tetap tersedia jika layanan AI gagal.

Foto diproses oleh model vision yang dimuat di server CivicPulse. Untuk fitur LLM, fakta dikirim dari server CivicPulse ke Groq agar diproses model; foto tidak diperlukan untuk tugas ringkasan. Rincian alur, privasi, dan batas model: [docs/AI.md](docs/AI.md).

## 📊 Rumus prioritas

```
skor = 35% risiko wilayah (IRBI) + 25% riwayat kejadian (DIBI) + 20% kemiskinan (BPS) + 20% laporan serupa (±500 m)
```

Kalau satu sumber data belum tersedia (misalnya DIBI), faktornya dikeluarkan dan bobotnya dibagi ulang ke faktor lain,
dan aplikasi menampilkan keterangan itu.

Bobot, ambang, dan contoh hitung ada di halaman [/metodologi](https://civicpulse.my.id/metodologi) dan
[docs/SCORING.md](docs/SCORING.md).

| Data | Sumber | Dipakai untuk |
| :-- | :-- | :-- |
| Indeks Risiko Bencana Indonesia (IRBI 2023) | BNPB | Faktor risiko wilayah |
| Data dan Informasi Bencana Indonesia (DIBI) | BNPB | Faktor riwayat kejadian |
| Persentase penduduk miskin kab/kota (Maret 2024) | BPS | Faktor kerentanan sosial |
| Batas wilayah & peta | OpenStreetMap | Peta laporan |

> Angka wilayah 8 kecamatan pilot di Bandung Raya berasal dari data asli BNPB & BPS. Laporan warga di versi demo adalah
> **data ilustrasi** dan diberi label di aplikasi. Pipeline: [docs/DATA.md](docs/DATA.md).

## 🛠️ Teknologi

| Bagian | Teknologi |
| :-- | :-- |
| Frontend | React 18, Vite 5, Tailwind CSS 3, React Router 6, Leaflet + OpenStreetMap |
| Aturan bisnis | `packages/core`: JavaScript murni, dipakai web & API, diuji unit test |
| Backend | Hono (Node), Postgres/Supabase atau penyimpanan memori untuk demo |
| AI | CLIP (Transformers.js di server) · LLM `openai/gpt-oss-20b` di Groq |
| Kualitas | ESLint, Prettier, Vitest, GitHub Actions CI, Postman CLI (tes kontrak API) |
| Hosting | Server sendiri (NVIDIA Jetson) + Cloudflare Tunnel di domain `civicpulse.my.id` |

```
apps/web (React)  ─►  services/api.js  ─►  apps/api (Hono)  ─►  Postgres / memori
                                              ├─ /ai  ─►  CLIP · Groq   (ml/models.json)
          keduanya memakai: packages/core (skor · status · verifikasi · analitik)
                            data/processed (IRBI · DIBI · BPS)
```

Arsitektur lengkap: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · Kontrak API: [docs/API.md](docs/API.md) ·
[OpenAPI](docs/openapi.yaml)

### Metode pengembangan dan algoritma

Tim menggunakan pendekatan **iteratif berbasis kebutuhan**: membangun MVP, mengerjakan alur per fitur, mendokumentasikan kontrak, lalu mengevaluasi dan memperbaiki. Ini bukan klaim penerapan Waterfall atau Scrum formal. Pull request dan GitHub Actions menjaga pemeriksaan kualitas berjalan sebelum perubahan digabungkan.

Algoritma utama yang dapat ditinjau:

1. **Skor prioritas berbobot** dari IRBI 35%, DIBI 25%, kemiskinan BPS 20%, dan laporan serupa 20%. Jika sumber belum tersedia, bobot yang tersedia dinormalisasi ulang.
2. **Pencarian laporan serupa** berdasarkan pelapor unik pada radius 500 meter dan jendela 30 hari.
3. **Validasi verifikasi** mengecek radius 200 meter, waktu sesudah klaim selesai, dan syarat verifikator sebelum state laporan berubah.
4. **CLIP zero-shot** memberi kandidat kategori/detail dari kecocokan foto dengan label teks. Skor prioritas tetap dihitung dengan rumus deterministik di `packages/core`.

Rincian implementasi dan batasan ada di [docs/SCORING.md](docs/SCORING.md), [docs/STATUS.md](docs/STATUS.md), [docs/AI.md](docs/AI.md), serta keputusan arsitektur di [docs/adr](docs/adr/).

### Filosofi logo

Logo CivicPulse menggabungkan **pin lokasi** (laporan berakar pada tempat), **garis detak** (denyut kondisi lingkungan dan suara warga), serta **simpul kuning** (AI yang menghubungkan sinyal menjadi konteks). Warna hijau mewakili kepedulian dan tindakan publik. Aset dan halaman identitas logo tersedia di [`CivicPulse Logo Identity Showcase.png`](CivicPulse%20Logo%20Identity%20Showcase.png) dan [`logo.html`](logo.html).

![Identitas visual CivicPulse: wordmark, pin detak, dan ikon aplikasi pada latar terang dan gelap](CivicPulse%20Logo%20Identity%20Showcase.png)

## 💻 Jalankan di komputer sendiri

Prasyarat: **Node.js 20+** dan **Git**. Tidak perlu database atau API key untuk mencoba.

```bash
git clone https://github.com/PehPulo/civicpulse.git
cd civicpulse
npm install
npm run dev:api      # backend  → http://localhost:8787 (data demo di memori)
npm run dev          # web      → http://localhost:5173
```

| Perintah | Fungsi |
| :-- | :-- |
| `npm test` | unit test (core, web, api) |
| `npm run ci` | lint + format + validasi data + tes + build |
| `npm run build` | build produksi |

Konfigurasi opsional: salin `.env.example` ke `.env` (isi `GROQ_API_KEY` untuk mengaktifkan fitur LLM).

## 📁 Struktur repository

```
apps/web          Frontend React: sisi warga & panel instansi
apps/api          Backend Hono + migrasi SQL
packages/core     Aturan bisnis bersama (skor, status, verifikasi) + unit test
data/             Data publik: raw → scripts → processed
ml/               Registry model, dataset & laporan evaluasi AI
docs/             Dokumentasi teknis, kontrak API, keputusan arsitektur (ADR)
deploy/           Skrip pemasangan server
submission/       Berkas lomba: proposal PDF, slide, screenshot
```

## 🚀 Rencana pengembangan

- Melengkapi data kejadian bencana dari DIBI BNPB.
- Memperluas data aktual di luar 8 kecamatan pilot ke seluruh Indonesia.
- Uji coba langsung bersama warga dan dinas.
- Memperkuat keamanan dan privasi (akun petugas resmi, audit log).

## 👥 Tim Peh Pulo · Universitas Brawijaya

| Anggota | Peran |
| :-- | :-- |
| **Yance Adhy Nata Panjaitan** | Ketua Tim · Frontend panel instansi |
| **Albert Juniawan Pasundan** | Backend · DevOps |
| **Christama Ezra Yudianto** | Project Manager · AI Engineer (computer vision & LLM) · Frontend sisi warga |

## 📄 Lisensi

[MIT](LICENSE) © 2026 Tim Peh Pulo
