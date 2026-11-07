<div align="center">

# 🛰️ CivicPulse: Lapor Berkonteks

**Setiap laporan warga punya konteks, prioritas yang bisa dijelaskan, dan bukti penyelesaian dari warga sendiri.**

Web In Action, MIA 2026 · Tema *Designing Digital Futures: Powering Public Transparency*
Subtema **Civic Reporting & Accountability**, didukung **Data-Driven Decision Support**

[![CI](https://github.com/PehPulo/civicpulse/actions/workflows/ci.yml/badge.svg)](https://github.com/PehPulo/civicpulse/actions/workflows/ci.yml)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Hono](https://img.shields.io/badge/Hono-API-E36002?logo=hono&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

![Landing page CivicPulse](submission/screenshots/01-landing.png)

</div>

---

> 📖 **Baru pertama kali?** Baca [docs/TENTANG-PROYEK.md](docs/TENTANG-PROYEK.md): penjelasan lengkap proyek ini dari yang paling umum sampai detail.

## 📌 Masalah

Laporan warga tentang jalan rusak, banjir, atau drainase tersumbat sampai ke instansi **tanpa konteks**. Bagi petugas, semua laporan terlihat sama pentingnya.

| # | Masalah | Dampak |
| :-: | :-- | :-- |
| 1 | Laporan masuk tanpa konteks wilayah | Petugas tidak bisa membedakan mana yang paling berisiko |
| 2 | Yang diproses duluan adalah yang paling ramai atau vokal | Prioritas mengikuti popularitas, bukan kebutuhan |
| 3 | Wilayah rawan dan miskin jarang melapor | Wilayah yang paling membutuhkan justru terabaikan |
| 4 | Status "selesai" cukup diklaim instansi | Warga tidak bisa memastikan masalah benar-benar beres |

## 💡 Solusi

```
 Warga lapor        Diperkaya data publik     Skor prioritas + alasan     Tindak lanjut     Verifikasi warga
 (foto + lokasi) →  IRBI · DIBI · BPS      →  0–100, bisa dijelaskan   →  instansi      →  ≥ 3 warga sekitar  →  ✅ SELESAI
```

- 🧭 **Konteks otomatis.** Lokasi laporan dicocokkan dengan data risiko bencana, riwayat kejadian, dan kemiskinan.
- 🔍 **Skor transparan.** Rumus dipublikasikan ([docs/SCORING.md](docs/SCORING.md)), setiap skor disertai kalimat alasan & rincian faktor.
- ⚖️ **Adil bagi yang jarang bersuara.** Faktor kerentanan sosial + deteksi **Wilayah Senyap** (risiko tinggi, laporan sedikit).
- ✅ **Selesai = diverifikasi warga.** Instansi tidak bisa menandai "terverifikasi" sendiri; butuh 3 foto berlokasi dari warga sekitar.
- 🤖 **AI yang membantu, bukan memutuskan.** Computer vision (CLIP) dan LLM (Qwen2.5) berjalan **di browser**: gratis, tanpa token, data tidak keluar perangkat. CV menyarankan kategori & menandai foto verifikasi meragukan; LLM meringkas dasbor tanpa boleh mengarang angka.

## ✨ Fitur

| Fitur | Status |
| :-- | :-: |
| Lapor 3 langkah (kategori → foto & lokasi di peta → deskripsi), deteksi kecamatan | ✅ |
| Skor prioritas 0–100 + kalimat alasan + rincian faktor | ✅ |
| Linimasa status publik (Diterima → Diproses → Klaim → Terverifikasi / Dibuka Ulang) | ✅ |
| +1 "saya juga mengalami" (skor dihitung ulang) | ✅ |
| Verifikasi warga: radius 200 m, setelah klaim, 1×/perangkat, otomatis terverifikasi/dibuka ulang | ✅ |
| Mode lokal offline dengan 38 laporan demo | ✅ |
| Dasbor akuntabilitas: KPI, Perlu Perhatian, Wilayah Senyap | ✅ |
| Peta laporan · Metodologi · Mode Instansi · grafik dasbor | 🔜 |
| AI computer vision (CLIP di browser): saran kategori dari foto & cek foto verifikasi | ✅ |
| AI LLM (Qwen2.5 di browser): ringkasan dasbor dengan pengaman anti-halusinasi | ✅ |
| Backend Hono + Supabase, data asli IRBI/DIBI/BPS | 🔜 |

## 🏗️ Arsitektur

```
apps/web (React)  ─►  services/api.js  ─┬─►  adapter lokal (localStorage, offline)
                                        └─►  adapter HTTP  ─►  apps/api (Hono)  ─►  Supabase
        └──────────────── keduanya memakai ────────────────┘
                     packages/core  (skor · status · verifikasi · analitik, teruji)
                     data/processed (IRBI · DIBI · BPS)
```

Detail: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Semua kontrak ada di [`docs/`](docs/).

## 🚀 Cara Menjalankan

Prasyarat: **Node.js 20+**.

```bash
git clone https://github.com/PehPulo/civicpulse.git
cd civicpulse
npm install
npm run dev          # http://localhost:5173 (mode lokal, tanpa backend)
```

| Perintah | Fungsi |
| :-- | :-- |
| `npm run dev:api` | API lokal di http://localhost:8787/api/v1 |
| `npm test` | unit test (core, web, api) |
| `npm run ci` | lint + format + validasi data + tes + build |
| `npm run build && npm run preview` | build produksi / cadangan demo offline |

Mode server: salin `.env.example` ke `.env`, isi `VITE_API_URL`.

**Demo cepat:** `/lapor?contoh=hasil` (langsung ke hasil skor) · `/laporan/CP-2026-0417` (laporan menunggu verifikasi, centang "mode demo" untuk mencoba).

## 🧭 Mulai Kerja: Baca Apa, Kerjakan di Mana

> **Semua anggota, wajib baca dulu (±20 menit):**
> 1. [docs/TENTANG-PROYEK.md](docs/TENTANG-PROYEK.md): proyek ini ngapain
> 2. [CONTRIBUTING.md](CONTRIBUTING.md): siapa pegang apa, aturan branch & PR, Definition of Done
> 3. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): gambaran sistem & aturan lapisan
>
> Lalu jalankan: `npm install` → `npm run dev` → coba alur `/lapor`, `/laporan/CP-2026-0417`, `/dasbor`.

Setelah itu ikuti jalur sesuai peranmu. Kolom **Kerjakan di** adalah satu-satunya tempat kamu menulis kode; di luar itu, ajukan lewat issue/PR ke Ezra.

### 🛠️ Albert: Backend · DevOps · MLOps · Data

| # | Tugas | Baca (urut) | Acuan perilaku | Kerjakan di | Selesai bila |
| :-: | :-- | :-- | :-- | :-- | :-- |
| 1 | **DevOps** awal | [DEVOPS.md](docs/DEVOPS.md) · [ADR-0004](docs/adr/0004-backend-hono-supabase.md) | `apps/web/vercel.json`, `apps/api/vercel.json` | Vercel (2 proyek), Supabase, GitHub Settings (proteksi `main`, secrets) | preview deploy muncul di setiap PR |
| 2 | **Database** | [DATA-MODEL.md](docs/DATA-MODEL.md) · [STATUS.md](docs/STATUS.md) | `apps/api/db/migrations/001_init.sql` | Supabase SQL editor, migrasi baru di `apps/api/db/migrations/` | tabel & bucket `foto` ada |
| 3 | **Backend API** | [USERS.md](docs/USERS.md) → [API.md](docs/API.md) → [openapi.yaml](docs/openapi.yaml) | **`apps/web/src/services/adapters/local.js`**: tiru perilakunya persis | `apps/api/src/routes/*.js`, `apps/api/src/repositories/laporan.js`, `apps/api/src/middleware/identitas.js` (JWT) | semua endpoint ≠ 501, `apps/api/test` + koleksi Postman lulus |
| 4 | **Data asli** | [DATA.md](docs/DATA.md) | `data/scripts/validate.js`, `data/schema/` | `data/raw/`, `data/scripts/build.js` → `data/processed/wilayah.json` | `npm run data:validate` lulus dengan `ilustrasi: false` |
| 5 | **MLOps** | [AI.md](docs/AI.md) → [MLOPS.md](docs/MLOPS.md) | `ml/models.json`, `apps/web/src/ai/worker.js` | `ml/eval/`, `ml/evaluate.js`, `ml/reports/` | laporan `ml/reports/clip-v1.md` & `qwen2.5-0.5b-v1.md` ada, gerbang tercatat |
| 6 | **Tes kontrak di CI** | [DEVOPS.md § CI](docs/DEVOPS.md#ci-githubworkflowsciyml) | `.github/workflows/ci.yml` job `kontrak-api` | `docs/postman/` (tambah request), GitHub vars/secrets | job `kontrak-api` hijau |

⛔ Jangan mengedit `packages/core/` (aturan bisnis) atau `docs/` tanpa persetujuan Ezra. Butuh fungsi baru? Buka issue.

### 🎨 Yance: Ketua · Frontend

| # | Tugas | Baca (urut) | Contoh yang ditiru | Kerjakan di | Selesai bila |
| :-: | :-- | :-- | :-- | :-- | :-- |
| 1 | **Peta Laporan** `/peta` | [FRONTEND.md](docs/FRONTEND.md) (aturan + panduan `/peta`) | `pages/Dasbor.jsx` (pola `useApi`), `pages/Lapor.jsx` (Leaflet), `components/Prioritas.jsx` (`warnaLevel`) | `apps/web/src/pages/Peta.jsx` (baru) + daftarkan di `apps/web/src/App.jsx` | marker berwarna, filter jalan, popup → detail, rapi di 360 px |
| 2 | **Metodologi** `/metodologi` | [SCORING.md](docs/SCORING.md) · [DATA.md § Batasan](docs/DATA.md) | `pages/Dasbor.jsx` (kartu) | `apps/web/src/pages/Metodologi.jsx` (baru) + `App.jsx` | bobot/ambang diambil dari `@civicpulse/core`, bukan diketik ulang |
| 3 | **Uji di HP** | [CONTRIBUTING.md § Definition of Done](CONTRIBUTING.md#definition-of-done) | | GitHub Issues (template "Laporan bug") | semua halaman dicek di HP sungguhan |
| 4 | **Administrasi** | ketentuan lomba | | surat orisinalitas, akun submission | surat bermeterai siap |

⛔ Halaman **hanya** boleh mengambil data lewat `services/api.js` + `hooks/useApi.js`. Jangan `fetch`/`localStorage` langsung.

### 🧩 Ezra: PM · System Integrator · Arsitek · AI · Frontend

| # | Tugas | Kerjakan di |
| :-: | :-- | :-- |
| 1 | Menjaga & menyetujui kontrak | `docs/**` |
| 2 | Aturan bisnis + tes | `packages/core/**` |
| 3 | Lapisan service & integrasi web ↔ api | `apps/web/src/services/**`, `apps/web/src/hooks/**` |
| 4 | AI: computer vision (CLIP) + LLM (Qwen) | `apps/web/src/ai/**`, `apps/web/src/components/AI.jsx` |
| 5 | Halaman Dasbor, Mode Instansi, Landing, Lapor, Detail | `apps/web/src/pages/**` |
| 6 | Review & merge semua PR, demo end-to-end | GitHub |

### 🗺️ Peta cepat "fitur X ada di mana?"

| Kalau mau mengubah… | Buka file |
| :-- | :-- |
| Rumus skor / bobot / ambang | `packages/core/src/prioritas.js` (+ `docs/SCORING.md`, naikkan `VERSI_RUMUS`) |
| Alur status / aturan verifikasi | `packages/core/src/status.js`, `verifikasi.js` (+ `docs/STATUS.md`) |
| KPI dasbor, Wilayah Senyap | `packages/core/src/analitik.js` |
| Cara data disimpan/diambil di web | `apps/web/src/services/api.js` → `adapters/local.js` / `adapters/http.js` |
| Laporan demo | `apps/web/src/services/seed.js` |
| Model AI / label prompt / prompt LLM | `ml/models.json` |
| Logika AI di browser | `apps/web/src/ai/worker.js`, `ai/index.js`, `ai/ringkasan.js` |
| Endpoint backend | `apps/api/src/routes/` → `repositories/` |
| Angka wilayah (IRBI/DIBI/BPS) | `data/processed/wilayah.json` (dibangun dari `data/raw/` lewat `data/scripts/build.js`) |
| Warna, font, tombol | `apps/web/tailwind.config.js`, `apps/web/src/index.css` |

## 📁 Struktur Repository

```
.
├── apps/
│   ├── web/            Frontend React + Vite + Tailwind
│   └── api/            Backend Hono (Vercel Functions) + migrasi SQL
├── packages/core/      Aturan bisnis bersama + unit test
├── data/               raw → scripts → processed (dataset wilayah) + schema
├── ml/                 Registry model AI, dataset & laporan evaluasi
├── docs/               Kontrak: arsitektur, API, data, status, skor, AI, MLOps, DevOps, ADR
├── submission/         Berkas lomba (PDF, PPT, screenshot)
└── .github/            CI, template PR & issue
```

## 📊 Sumber Data Publik

| Data | Sumber | Dipakai untuk |
| :-- | :-- | :-- |
| Indeks Risiko Bencana Indonesia (IRBI) | BNPB | Faktor risiko wilayah |
| Data dan Informasi Bencana Indonesia (DIBI) | BNPB | Faktor riwayat kejadian |
| Persentase penduduk miskin kab/kota | BPS | Faktor kerentanan sosial |

> ⚠️ Saat ini angka wilayah masih **data ilustrasi** untuk 8 kecamatan di Bandung Raya (ditandai di UI). Pipeline data asli: [docs/DATA.md](docs/DATA.md).

## 👥 Tim Peh Pulo

| Nama | Peran |
| :-- | :-- |
| Christama Ezra Yudianto | Project Manager · System Integrator · Software Architect · AI Engineer · Frontend |
| Albert Juniawan Pasundan | Backend · DevOps · MLOps · Data |
| Yance | Ketua Tim · Frontend |

Cara berkontribusi & pembagian tugas: [CONTRIBUTING.md](CONTRIBUTING.md).

## 📄 Lisensi

[MIT](LICENSE) © 2026 Tim Peh Pulo
