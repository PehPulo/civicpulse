# ADR-0005: Semua fitur selalu lewat backend (server Jetson)

- **Status:** Diterima · 2026-11-10 · Menggantikan [ADR-0002](0002-adapter-lokal-dan-http.md)
  (adapter lokal) dan bagian cadangan browser di [ADR-0003](0003-ai-di-browser.md)

## Konteks

CivicPulse akan dipasang di server sendiri (VPS/Jetson) dengan backend `apps/api`. Mode lokal (data di localStorage,
login diperiksa di browser) dan AI cadangan di browser (Web Worker + model ±90 MB) tidak lagi dibutuhkan, dan justru
berbahaya bila terbawa ke produksi: login lokal bisa diakali dari DevTools, data tidak tersimpan di server, dan
pemeriksaan keamanan backend (yurisdiksi, batas laju, sanitasi, validasi berkas) terlewati.

## Keputusan

- `apps/web/src/services/api.js` hanya memakai `adapters/http.js`. `adapters/local.js` dan `services/seed.js` dihapus.
- Alamat backend dari `services/server.js`: `VITE_API_URL` bila diisi; bila kosong ⇒ `http://localhost:8787/api/v1`
  saat pengembangan dan `/api/v1` (domain yang sama, di belakang reverse proxy) saat produksi.
- AI (computer vision & LLM) selalu di server. `ai/worker.js` dan dependensi `@huggingface/transformers` di web dihapus;
  bila server AI sibuk/mati, fungsi AI mengembalikan `null` dan UI tetap jalan tanpa saran.
- Fitur khusus mode lokal dihapus: tombol "Reset data demo", centang "mode demo" verifikasi, label "Data demo".
- Data demo tetap ada di **server**: tanpa Supabase, API mengisi penyimpanan memori dari `buatSeed` (`DEMO_SEED`).

## Akibat

- ➕ Satu jalur keamanan: semua data, login, wewenang, dan AI diperiksa server.
- ➕ Bundel web lebih kecil (tanpa model AI di browser), perangkat warga tidak mengunduh model.
- ➖ Web tidak bisa berjalan tanpa backend. Untuk pengembangan jalankan `npm run dev:api` bersama `npm run dev`.
