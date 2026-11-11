# ADR-0001: Monorepo npm workspaces dengan `packages/core` bersama

- **Status:** Diterima · 2026-11-07

## Konteks

Skor prioritas, alur status, dan aturan verifikasi dibutuhkan di frontend (respons instan & mode offline) **dan** di backend (agar tidak bisa dimanipulasi dari klien). Menulisnya dua kali berisiko hasil berbeda.

## Keputusan

Satu repo dengan npm workspaces: `apps/web`, `apps/api`, `packages/core`, `data`. Semua aturan bisnis ditulis **sekali** di `packages/core` (JavaScript murni, tanpa React/DB) dan diuji dengan Vitest.

## Konsekuensi

- ➕ Mode lokal & server dijamin identik, aturan teruji di satu tempat.
- ➕ Satu PR bisa mengubah kontrak + implementasi sekaligus.
- ➖ Deploy Vercel perlu "Include files outside Root Directory".
