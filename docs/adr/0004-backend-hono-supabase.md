# ADR-0004: Backend Hono di Vercel Functions + Supabase

- **Status:** Diterima · 2026-11-07

## Konteks

Butuh backend nyata (data bersama antarperangkat, foto, login instansi) yang bisa disiapkan dan di-deploy satu orang dalam waktu singkat, gratis.

## Keputusan

- **Hono** (ringan, standar Web Fetch API) dijalankan sebagai **Vercel Function** (`apps/api/api/index.js`) dan sebagai server Node untuk development.
- **Supabase**: Postgres (tabel di `db/migrations/001_init.sql`) + Storage (bucket `foto`). Diakses hanya dari server dengan service key, RLS aktif.
- Pola lapisan: `routes` (HTTP) → `@civicpulse/core` (aturan) → `repositories` (DB).

## Konsekuensi

- ➕ Free tier cukup untuk lomba; deploy dari repo yang sama.
- ➕ Route mudah dites lewat `app.request()` tanpa server (lihat `apps/api/test`).
- ➖ Cold start beberapa ratus ms; diterima.
