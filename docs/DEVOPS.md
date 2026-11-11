# Kontrak DevOps


## Environment

| Env | Web | API | Data | Pemicu |
| :-- | :-- | :-- | :-- | :-- |
| `local` | `npm run dev` (Vite :5173) | `npm run dev:api` (:8787) | memori (data demo) / Supabase dev | manual |
| `preview` | Vercel preview per PR | Vercel preview per PR | Supabase proyek dev | setiap PR |
| `production` | Vercel `civicpulse` | Vercel `civicpulse-api` | Supabase proyek prod | merge ke `main` |

## Environment variable

| Nama | Dipakai | Rahasia? | Keterangan |
| :-- | :-- | :-: | :-- |
| `VITE_API_URL` | web | | kosong ⇒ dev `http://localhost:8787/api/v1`, produksi `/api/v1` (domain sama). Tidak ada mode lokal (ADR-0005) |
| `HOST` | api | | alamat dengar, bawaan `127.0.0.1` (buka ke internet lewat reverse proxy/terowongan) |
| `SAJIKAN_WEB` | api | | bawaan `true` saat `NODE_ENV=production`: proses API juga menyajikan `apps/web/dist` |
| `DATA_FILE` | api | | database berkas JSON tanpa Supabase, mis. `./data-server/laporan.json`: data demo dimasukkan sekali, perubahan tahan restart. Hapus berkas ⇒ kembali ke data demo |
| `VITE_FEATURE_AI` | web | | `true`/`false` |
| `SUPABASE_URL` | api | | |
| `SUPABASE_SERVICE_KEY` | api | 🔒 | **hanya server**, jangan pernah berawalan `VITE_` |
| `INSTANSI_SANDI_DEMO` | api | 🔒 | Password awal semua akun admin wilayah sampai diganti pemiliknya. **Wajib di produksi** (cadangan: `INSTANSI_PIN` lama); dev kosong ⇒ `civicpulse2026` |
| `JWT_SECRET` | api | 🔒 | ≥ 32 karakter acak. **Wajib di produksi**; dev kosong ⇒ acak per proses |
| `PERCAYA_PROXY` | api | | `true` hanya di belakang proxy tepercaya (Funnel/nginx); otomatis di Vercel. Selain itu `X-Forwarded-For` diabaikan agar batas laju tak bisa diakali |
| `AUTH_BATAS_PER_15_MENIT` | api | | percobaan login per IP per 15 menit (bawaan 10) |
| `DEMO_SEED` | api | | tanpa Supabase: `true` (bawaan) isi memori dengan data demo |
| `CORS_ORIGIN` | api | | daftar origin dipisah koma |
| `VITE_AI_URL` | web | | URL API untuk ringkasan AI (kosong ⇒ pakai `VITE_API_URL`) |
| `GROQ_API_KEY` | api | 🔒 | LLM Groq, **hanya server**, akun tanpa kartu kredit |
| `AI_BATAS_PER_MENIT`, `AI_BATAS_TOKEN_HARIAN`, `AI_CACHE_MENIT` | api | | penjaga biaya LLM (bawaan 5 · 150000 · 15) |
| `AI_BATAS_FOTO_PER_MENIT` | api | | batas analisis foto per IP per menit (bawaan 30) |

> **Computer vision di server** memuat model CLIP ±90 MB ke memori (±300–500 MB RAM). Cocok untuk VPS/Jetson (server yang terus menyala). Di Vercel Functions akan lambat saat cold start dan bisa melewati batas ukuran/memori.

Template: [`.env.example`](../.env.example). Secret disimpan di **Vercel Project Settings** & **GitHub Secrets**, tidak pernah di repo.

## Deploy (Vercel, 2 proyek dari 1 repo)

| Proyek | Root Directory | Build | Output |
| :-- | :-- | :-- | :-- |
| `civicpulse` (web) | `apps/web` | `npm run build` | `dist` (`vercel.json` = SPA rewrite) |
| `civicpulse-api` | `apps/api` | — (Functions) | `api/index.js` (Hono) |

Aktifkan "Include files outside the Root Directory" agar `packages/core` dan `data/` ikut ter-bundle.
Cron verifikasi harian (`vercel.json` api): `0 1 * * *` ⇒ endpoint internal evaluasi.

## CI ([`.github/workflows/ci.yml`](../.github/workflows/ci.yml))

```
npm ci → lint → format:check → data:validate → test (core, web, api) → build web → artefak dist
                                                     └► (opsional) tes kontrak Postman CLI ke preview
```

- Branch `main` diproteksi: wajib PR + CI hijau + 1 review.
- Aktifkan job kontrak dengan repo variable `KONTRAK_API_AKTIF=true` dan secret `POSTMAN_API_KEY`, `API_PREVIEW_URL`.

## Rollback

Vercel → Deployments → deploy sebelumnya → **Promote to Production** (< 1 menit). Migrasi DB hanya maju; perbaikan = migrasi baru.

## Keamanan

- CORS dikunci ke domain web.
- Rate limit: 5 laporan/hari/perangkat (aturan domain) + batas 120 req/menit/IP di API; penghitung API berjalan per proses.
- Validasi semua input di server lewat `@civicpulse/core`. Skor dari klien diabaikan.
- Foto: dikompres & EXIF dibuang di klien, server menerima hanya `image/jpeg|png|webp` ≤ 1 MB, nama file acak.
- Tidak menyimpan NIK/nama/HP. `pelaporId` tidak pernah dikirim ke klien (`tampilanPublik`).
- RLS aktif di semua tabel Supabase. Akses hanya via service key di server.

## Checklist hari-H (final 28 Nov)

- [ ] `GET /health` production = 200
- [ ] Web production terbuka di HP & laptop
- [ ] Model AI sudah ter-cache di laptop demo
- [ ] Build offline siap (`npm run preview`), tombol reset data demo dicoba
- [ ] Deck & video tersimpan di Google Drive
