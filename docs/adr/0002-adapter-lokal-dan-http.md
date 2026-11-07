# ADR-0002: Lapisan service dengan adapter lokal & HTTP

- **Status:** Diterima · 2026-11-07 · Pengambil keputusan: Ezra

## Konteks

Waktu pengembangan singkat, backend dikerjakan paralel, dan panitia menyarankan prototipe **bisa jalan offline** saat final.

## Keputusan

UI hanya memanggil `apps/web/src/services/api.js`. Facade ini memilih adapter lewat env:

- `VITE_API_URL` kosong ⇒ `adapters/local.js` (localStorage + seed data demo)
- `VITE_API_URL` terisi ⇒ `adapters/http.js` (apps/api)

Keduanya memenuhi kontrak yang sama ([API.md](../API.md)) dan mengembalikan proyeksi publik yang sama.

## Konsekuensi

- ➕ Frontend tidak menunggu backend. Demo selalu punya cadangan offline.
- ➕ Adapter lokal menjadi **spesifikasi perilaku yang bisa dijalankan** untuk backend.
- ➖ Data mode lokal hanya ada di satu browser (cukup untuk demo, bukan produksi).
