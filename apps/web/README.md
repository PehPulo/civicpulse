# apps/web: Frontend CivicPulse

> **Pemilik:** Ezra (Frontend Lead, AI, integrasi) · **Sisi instansi/admin:** Yance (`pages/instansi/`, `components/instansi/`) · Baru di sini? Baca [README utama § Yance](../../README.md#yance) dulu.

React 18 + Vite 5 + Tailwind CSS 3 + Leaflet.

## Baca dulu

1. [docs/FRONTEND.md](../../docs/FRONTEND.md): aturan & panduan per halaman
2. `src/pages/Dasbor.jsx`: contoh halaman yang benar (ambil data → loading → galat → tampil)

## Struktur

```
src/
├── pages/          ✏️ Satu file per halaman sisi warga (Ezra); rute didaftarkan di App.jsx
│   └── instansi/   ✏️ Halaman sisi instansi/admin (Yance)
├── components/     Komponen dipakai ulang (Prioritas, AI, Navbar, Footer)
├── hooks/          useApi (baca data), useAksi (kirim data), useProgresAI
├── services/       api.js = SATU-SATUNYA pintu data · adapters/ (lokal & http) · seed.js (data demo)
├── ai/             AI di browser: index.js (antarmuka), worker.js (CLIP), ringkasan.js   [Ezra]
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
