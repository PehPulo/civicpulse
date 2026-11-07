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
- 🤖 **AI yang membantu, bukan memutuskan.** Computer vision di browser (gratis, privat) menyarankan kategori dan menandai foto verifikasi yang meragukan.

## ✨ Fitur

| Fitur | Status |
| :-- | :-: |
| Lapor 3 langkah (kategori → foto & lokasi di peta → deskripsi), deteksi kecamatan | ✅ |
| Skor prioritas 0–100 + kalimat alasan + rincian faktor | ✅ |
| Linimasa status publik (Diterima → Diproses → Klaim → Terverifikasi / Dibuka Ulang) | ✅ |
| +1 "saya juga mengalami" (skor dihitung ulang) | ✅ |
| Verifikasi warga: radius 200 m, setelah klaim, 1×/perangkat, otomatis terverifikasi/dibuka ulang | ✅ |
| Mode lokal offline dengan 38 laporan demo | ✅ |
| Peta laporan · Dasbor akuntabilitas (Perlu Perhatian, Wilayah Senyap) · Metodologi · Mode Instansi | 🔜 |
| AI: saran kategori dari foto & cek foto verifikasi (CLIP di browser) | 🔜 |
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
