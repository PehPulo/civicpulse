# Panduan Kontribusi

## Tim Peh Pulo · Universitas Brawijaya

| Anggota | Peran |
| :-- | :-- |
| **Yance Adhy Nata Panjaitan** | Ketua Tim · Frontend panel instansi |
| **Albert Juniawan Pasundan** | Backend · DevOps |
| **Christama Ezra Yudianto** | Project Manager · AI Engineer (computer vision & LLM) · Frontend sisi warga |

Dokumen di [`docs/`](docs/) adalah acuan teknis. Perubahan perilaku aplikasi ikut memperbarui dokumen terkait.

## Alur kerja Git

1. Bercabang dari `main` terbaru: `git switch -c <nama>/<area>-<ringkas>`, dengan area ∈ `web, api, core, ai, ml, data, devops, docs`.
2. Commit kecil dengan **Conventional Commits** (Bahasa Indonesia), misalnya `feat(web): tambah filter status di peta`.
3. `npm run ci` harus lulus di lokal.
4. Buka PR ke `main`. Merge setelah CI hijau dan direview.

## Definition of Done

- Sesuai dokumen di `docs/`; dokumen diperbarui bila perilaku berubah.
- `npm run ci` lulus (lint, format, validasi data, tes, build).
- Logika baru di `packages/core` punya unit test.
- UI punya state loading/kosong/galat dan dicek di 360 px & 1280 px.
- Tidak ada secret di kode.
