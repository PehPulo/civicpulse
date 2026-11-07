# ADR-0003: AI berjalan di browser dan hanya memberi saran

- **Status:** Diterima · 2026-11-07 · Pengambil keputusan: Ezra

## Konteks

Ingin memanfaatkan computer vision (kategori dari foto, cek foto verifikasi) dan LLM (ringkasan), tetapi: tanpa anggaran API, tanpa API key yang bisa bocor dari frontend, dan tema lomba menuntut **transparansi** keputusan publik.

## Keputusan

1. Model dijalankan **di browser** lewat Web Worker: Transformers.js + CLIP (vision), WebLLM opsional (teks).
2. AI **tidak** ikut menentukan skor prioritas maupun status. Ia hanya memberi saran kategori dan tanda `aiMeragukan` pada verifikasi.
3. Semua fungsi AI mengembalikan `null` saat gagal; UI tidak bergantung pada AI.

## Alternatif yang ditolak

- **API LLM komersial:** biaya per token, butuh server proxy, foto warga keluar ke pihak ketiga.
- **AI menentukan skor:** sulit diaudit warga, bertentangan dengan prinsip "skor yang bisa dijelaskan".

## Konsekuensi

- ➕ Gratis, privat, tetap jalan offline setelah model ter-cache.
- ➖ Unduhan model pertama ±90 MB; perangkat lemah lebih lambat ⇒ fitur bersifat progresif.
