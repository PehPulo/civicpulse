# apps/web: Frontend CivicPulse

> **Pemilik:** Ezra (arsitektur, AI, integrasi) · **Kontributor:** Yance · Baru di sini? Baca [MULAI-DI-SINI.md](../../MULAI-DI-SINI.md#-yance) dulu.

React 18 + Vite 5 + Tailwind CSS 3 + Leaflet.

## Baca dulu

1. [docs/FRONTEND.md](../../docs/FRONTEND.md): aturan & panduan per halaman
2. `src/pages/Dasbor.jsx`: contoh halaman yang benar (ambil data → loading → galat → tampil)

## Struktur

```
src/
├── pages/          ✏️ Satu file per halaman (route didaftarkan di App.jsx)
├── components/     Komponen dipakai ulang (Prioritas, AI, Navbar, Footer)
├── hooks/          useApi (baca data), useAksi (kirim data), useProgresAI
├── services/       api.js = SATU-SATUNYA pintu data · adapters/ (lokal & http) · seed.js (data demo)
├── ai/             AI di browser: index.js (antarmuka), worker.js (CLIP + Qwen), ringkasan.js   [Ezra]
└── lib/            util kecil (foto, peta)
```

## 3 aturan utama

1. Data **hanya** lewat `api` dari `services/api.js`. Jangan `fetch`/`localStorage` di halaman.
2. Label status, kategori, bobot, dan ambang diambil dari `@civicpulse/core`, **bukan** diketik ulang.
3. Setiap halaman punya tampilan **loading, kosong, galat**, dan dicek di lebar HP (360 px).

## Perintah

```bash
npm run dev         # dari root repo: http://localhost:5173
npm run build       # build produksi
```
