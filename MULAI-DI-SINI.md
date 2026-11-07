# 👋 Mulai di Sini

Baru buka repo ini dan bingung harus mulai dari mana? **Ikuti halaman ini dari atas ke bawah.** Tidak perlu membaca file lain sebelum disuruh.

---

## Langkah 1: Jalankan aplikasinya (10 menit)

Prasyarat: **Node.js 20+** dan **Git** sudah terpasang.

```bash
git clone https://github.com/PehPulo/civicpulse.git
cd civicpulse
npm install
npm run dev
```

Buka **http://localhost:5173**, lalu coba 4 hal ini supaya paham produknya:

| # | Buka | Yang dicoba |
| :-: | :-- | :-- |
| 1 | `/lapor` | Buat 1 laporan: pilih kategori → unggah foto apa saja → klik peta → tulis deskripsi → kirim. Lihat skor & alasannya |
| 2 | `/laporan/CP-2026-0417` | Laporan yang sudah "diklaim selesai". Coba kirim verifikasi (centang **mode demo**) |
| 3 | `/dasbor` | Lihat Wilayah Senyap & Perlu Perhatian, klik **Buat ringkasan AI** |
| 4 | `/lapor?contoh=hasil` | Pintasan langsung ke halaman hasil skor |

> Tidak perlu backend, database, atau API key. Aplikasi berjalan penuh di browser (mode lokal).

---

## Langkah 2: Baca 3 dokumen ini, berurutan (±25 menit)

| Urutan | Dokumen | Kenapa |
| :-: | :-- | :-- |
| 1 | [docs/TENTANG-PROYEK.md](docs/TENTANG-PROYEK.md) | Proyek ini ngapain, masalahnya apa, fiturnya apa |
| 2 | [CONTRIBUTING.md](CONTRIBUTING.md) | Siapa pegang apa, cara bikin branch & PR, kapan tugas dianggap selesai |
| 3 | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Gambaran sistem & aturan "kode apa boleh ditulis di mana" |

---

## Langkah 3: Pilih namamu

- [🛠️ Albert: Backend · DevOps · MLOps · Data](#️-albert)
- [🎨 Yance: Frontend · Ketua](#-yance)
- [🧩 Ezra: PM · System Integrator · AI](#-ezra)

---

## 🛠️ Albert

**Peranmu:** membangun server, database, deploy, data asli, dan evaluasi model AI. **Semua aturan sudah ditulis Ezra di `docs/`.** Tugasmu mengimplementasikannya.

### Urutan baca

| # | Baca | Isinya |
| :-: | :-- | :-- |
| 1 | [docs/USERS.md](docs/USERS.md) | Siapa boleh melakukan apa |
| 2 | [docs/DATA-MODEL.md](docs/DATA-MODEL.md) | Bentuk data laporan, verifikasi, dll. |
| 3 | [docs/STATUS.md](docs/STATUS.md) | Alur status laporan & aturan verifikasi |
| 4 | [docs/API.md](docs/API.md) | **Kontrak endpoint**: yang paling penting |
| 5 | [apps/api/README.md](apps/api/README.md) | Struktur folder backend |
| 6 | `apps/web/src/services/adapters/local.js` | **Contoh perilaku yang benar**. Backend harus berperilaku persis sama |
| 7 | [docs/DEVOPS.md](docs/DEVOPS.md) · [docs/DATA.md](docs/DATA.md) · [docs/MLOPS.md](docs/MLOPS.md) | Dibaca saat mengerjakan tugas terkait |

### Urutan kerja

| # | Tugas | Kerjakan di | Selesai bila |
| :-: | :-- | :-- | :-- |
| 1 | Siapkan Supabase + jalankan skema | `apps/api/db/migrations/001_init.sql` | tabel & bucket `foto` ada |
| 2 | Implementasi endpoint satu per satu (urutan: `GET /laporan` → `GET /laporan/:kode` → `POST /laporan` → `dukungan` → `verifikasi` → `auth` → `status` → `unggah` → `statistik`) | `apps/api/src/routes/`, `apps/api/src/repositories/laporan.js` | `npm test` lulus, tidak ada lagi respons 501 |
| 3 | Deploy 2 proyek Vercel + secrets | Vercel & GitHub Settings | preview muncul di tiap PR |
| 4 | Data asli IRBI/DIBI/BPS | `data/raw/`, `data/scripts/build.js` | `npm run data:validate` lulus, `ilustrasi: false` |
| 5 | Evaluasi model AI | `ml/eval/`, `ml/evaluate.js`, `ml/reports/` | laporan evaluasi CLIP & Qwen ada |
| 6 | Tes kontrak Postman di CI | `docs/postman/`, `.github/workflows/ci.yml` | job `kontrak-api` hijau |

**Mulai dari tugas #1 dan #2.** Branch pertamamu: `albert/api-laporan`.

⛔ **Jangan edit** `packages/core/` dan `docs/`. Kalau butuh perubahan, buka Issue dan tag Ezra.

---

## 🎨 Yance

**Peranmu:** membuat 2 halaman baru, menguji di HP, dan mengurus administrasi lomba. Tugasnya sengaja dibuat ringan.

### Urutan baca

| # | Baca | Isinya |
| :-: | :-- | :-- |
| 1 | [docs/FRONTEND.md](docs/FRONTEND.md) | **Aturan menulis halaman** + panduan khusus `/peta` & `/metodologi` |
| 2 | [apps/web/README.md](apps/web/README.md) | Struktur folder frontend |
| 3 | `apps/web/src/pages/Dasbor.jsx` | **Contoh halaman** yang mengambil data dengan benar (tiru polanya) |
| 4 | [docs/SCORING.md](docs/SCORING.md) · [docs/DATA.md](docs/DATA.md) | Isi untuk halaman Metodologi |

### Urutan kerja

| # | Tugas | Kerjakan di | Selesai bila |
| :-: | :-- | :-- | :-- |
| 1 | Halaman **Peta Laporan** | buat `apps/web/src/pages/Peta.jsx`, daftarkan di `apps/web/src/App.jsx` | marker berwarna sesuai prioritas, filter jalan, klik marker → detail |
| 2 | Halaman **Metodologi** | buat `apps/web/src/pages/Metodologi.jsx`, daftarkan di `App.jsx` | rumus & sumber data tampil, angka diambil dari `@civicpulse/core` |
| 3 | Uji semua halaman di HP | GitHub Issues → "Laporan bug" | bug tercatat |
| 4 | Surat orisinalitas bermeterai | — | siap diunggah |

**Mulai dari tugas #1.** Branch pertamamu: `yance/web-peta`.

⛔ **Jangan** memakai `fetch` atau `localStorage` langsung di halaman. Ambil data **hanya** lewat `api` dari `services/api.js` + `useApi` dari `hooks/useApi.js` (lihat contoh di `Dasbor.jsx`).

---

## 🧩 Ezra

Pemilik kontrak (`docs/`), aturan bisnis (`packages/core/`), lapisan service, AI (`apps/web/src/ai/`), halaman Dasbor/Instansi/Lapor/Detail, serta **reviewer semua PR**. Daftar tugas lengkap ada di [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Langkah 4: Cara mengirim pekerjaan

```bash
git switch main && git pull                 # selalu mulai dari main terbaru
git switch -c albert/api-laporan            # pola: <nama>/<area>-<tugas>
# ... kerjakan ...
npm run ci                                  # wajib lulus sebelum push
git add . && git commit -m "feat(api): implementasi GET /laporan"
git push -u origin albert/api-laporan
```

Lalu buka GitHub → **Compare & pull request** → isi template → reviewer: **Ezra**.

---

## Bingung?

| Pertanyaan | Lihat |
| :-- | :-- |
| "Fitur X kodenya di file mana?" | [README § Peta cepat](README.md#️-peta-cepat-fitur-x-ada-di-mana) |
| "Endpoint ini harus membalas apa?" | [docs/API.md](docs/API.md) atau perilaku di `adapters/local.js` |
| "Istilah ini artinya apa?" | [docs/TENTANG-PROYEK.md § Kamus](docs/TENTANG-PROYEK.md#15-kamus-istilah) |
| Masih bingung | Tanya **Ezra** di grup, atau buka GitHub Issue |
