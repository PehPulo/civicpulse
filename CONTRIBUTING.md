# Panduan Kontribusi: Tim Peh Pulo

## Tim & kepemilikan

| Anggota | Peran | Memiliki (merancang & menyetujui) | Mengimplementasikan |
| :-- | :-- | :-- | :-- |
| **Christama Ezra Yudianto** | Project Manager · System Integrator · Software Architect · AI Engineer · Frontend | **Semua kontrak di `docs/`**, arsitektur, `packages/core`, `apps/web/src/ai`, `apps/web/src/services` | Core, lapisan service, AI (CLIP/WebLLM), Landing, Lapor, Detail, Dasbor, Mode Instansi, integrasi akhir |
| **Albert Juniawan Pasundan** | Backend · DevOps · MLOps · Data Engineer | | `apps/api`, `apps/api/db`, `data/`, `ml/`, CI/CD, deploy Vercel & Supabase, tes kontrak Postman |
| **Yance** | Ketua Tim · Frontend | | Halaman Peta & Metodologi, uji responsif di HP, administrasi lomba |

**Aturan emas:** kontrak di `docs/` adalah sumber kebenaran. Perlu mengubah kontrak? Buka PR ke `docs/` dulu. **Hanya Ezra yang menyetujui perubahan kontrak.** Implementasi tidak boleh menyimpang dari kontrak tanpa PR tersebut.

## Tugas per anggota

### Ezra
- [x] Kontrak v1: ARCHITECTURE, USERS, DATA-MODEL, STATUS, SCORING, API + OpenAPI + Postman, AI, MLOPS, DEVOPS, DATA, FRONTEND, ADR
- [x] `packages/core` + unit test, lapisan service + adapter lokal/HTTP, seed demo
- [ ] AI: implementasi `apps/web/src/ai/worker.js` (CLIP), saran kategori di Lapor, cek foto verifikasi
- [ ] Halaman Dasbor Akuntabilitas & Mode Instansi
- [ ] Integrasi web ↔ api, review & merge semua PR, demo end-to-end

### Albert
- [ ] Supabase: proyek dev & prod, jalankan `001_init.sql`, bucket `foto`
- [ ] `apps/api`: implementasi semua endpoint di [docs/API.md](docs/API.md) (`routes/` + `repositories/`), JWT instansi, cron verifikasi
- [ ] Tes: perluas `apps/api/test` & koleksi Postman sampai semua endpoint tercakup
- [ ] Data: unduh IRBI/DIBI/BPS ke `data/raw`, implementasi `data/scripts/build.js`, `ilustrasi: false`
- [ ] MLOps: dataset `ml/eval`, `ml/evaluate.js`, laporan `ml/reports/clip-v1.md`
- [ ] DevOps: 2 proyek Vercel, env & secret, proteksi branch `main`, job tes kontrak di CI

### Yance
- [ ] Halaman `/peta` & `/metodologi` sesuai [docs/FRONTEND.md](docs/FRONTEND.md)
- [ ] Uji responsif di HP sungguhan, laporkan bug sebagai issue
- [ ] Surat orisinalitas bermeterai, akun submission

## Alur kerja Git

**Hanya ada satu branch permanen: `main`.** Tidak ada branch permanen per orang. Setiap tugas punya branch sendiri yang berumur pendek (jam, bukan hari), diberi awalan nama pemiliknya:

```
main (terproteksi, selalu bisa di-deploy, yang dinilai juri)
 ├─ ezra/web-dasbor        ezra/web-instansi      ezra/ai-clip        ezra/docs-api-v1.1
 ├─ albert/api-laporan     albert/data-irbi       albert/ml-evaluasi  albert/devops-vercel
 └─ yance/web-peta         yance/web-metodologi
```

Pola: `<nama>/<area>-<ringkas>`, dengan area ∈ `web, api, core, ai, ml, data, devops, docs`.

Kenapa tidak satu branch permanen per orang? Branch seperti itu makin jauh dari `main` dan berakhir dengan merge besar penuh konflik tepat sebelum tenggat. Branch per tugas masuk ke `main` setiap kali selesai, sehingga integrasi berjalan terus.

1. `git switch main && git pull`, lalu `git switch -c yance/web-peta`
2. Commit kecil & sering dengan **Conventional Commits** (Bahasa Indonesia):
   `feat(web): tambah filter status di peta` · `fix(api): tolak dukungan ganda` · `docs(api): tambah endpoint ekspor`
   Scope: `web`, `api`, `core`, `ai`, `ml`, `data`, `ci`, `docs`, `submission`
3. `npm run ci` harus lulus di lokal
4. Push lalu buka PR ke `main` (template otomatis). **Reviewer: Ezra.**
5. Squash merge setelah CI hijau & disetujui. Hapus branch.
6. Sebelum mulai tugas berikutnya, **selalu** bercabang lagi dari `main` terbaru.

**Bekerja paralel (Ezra ↔ Albert):** folder kalian terpisah (lihat tabel kepemilikan), jadi jarang bentrok. Bila `package-lock.json` konflik: ambil versi `main`, jalankan `npm install`, lalu commit ulang. Albert tidak mengedit `packages/core`. Kebutuhan perubahan diajukan lewat issue/PR ke Ezra.

## Definition of Done

- Sesuai kontrak `docs/`; kontrak diperbarui bila berubah
- `npm run ci` lulus (lint, format, validasi data, tes, build)
- Logika baru di `packages/core` **wajib** punya unit test
- UI: state loading/kosong/galat, dicek di 360 px & 1280 px, ada screenshot di PR
- Tidak ada secret di kode, tidak ada `console.log` tertinggal

## Perintah

| Perintah | Fungsi |
| :-- | :-- |
| `npm install` | pasang semua workspace |
| `npm run dev` | web di http://localhost:5173 (mode lokal) |
| `npm run dev:api` | api di http://localhost:8787/api/v1 |
| `npm test` / `npm run test:watch` | unit test semua paket |
| `npm run lint` / `npm run format` | lint / rapikan kode |
| `npm run data:validate` | validasi `data/processed/wilayah.json` |
| `npm run ci` | semua pemeriksaan CI di lokal |
