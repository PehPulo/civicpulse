# Kontrak MLOps

> Pemilik kontrak: **Ezra** · Implementasi: **Albert** · Folder: [`ml/`](../ml)

## Siklus hidup model

```
pilih kandidat ─► daftarkan di ml/models.json (status: kandidat)
              ─► evaluasi: node ml/evaluate.js <versi> ─► ml/reports/<versi>.md
              ─► lolos gerbang? ── ya ─► status: aktif, "aktif": <versi> (PR, review Ezra)
                                └ tidak ─► perbaiki label prompt / ganti model ─► ulangi
              ─► monitoring di produksi (ai_log) ─► evaluasi ulang bila tingkat koreksi naik
```

## Registry `ml/models.json`

| Field | Arti |
| :-- | :-- |
| `aktif` | versi yang dipakai worker |
| `model.<versi>.hfId` | id Hugging Face (dipatok, tidak memakai "latest") |
| `pipeline`, `dtype` | konfigurasi Transformers.js |
| `label.klasifikasi` | prompt per kategori |
| `label.verifikasi.<kategori>` | prompt `beres` / `belum` |
| `status` | `kandidat` · `aktif` · `pensiun` |
| `evaluasi` | ringkasan metrik + path laporan |

## Dataset evaluasi `ml/eval/`

- **≥ 30 foto**, minimal 5 per kelas: `drainase, banjir, jalan, longsor, lainnya, beres`.
- Sumber: foto tim sendiri di Bandung Raya atau berlisensi bebas (catat lisensi di `labels.csv` bila bukan milik tim).
- `labels.csv`: `file,label`. **Jangan** memakai foto dari dataset evaluasi untuk menyusun prompt (hindari bocor).

## Metrik & gerbang rilis

| Metrik | Gerbang |
| :-- | :-- |
| Akurasi top-1 klasifikasi | **≥ 75%** untuk menyalakan saran kategori |
| Akurasi top-3 klasifikasi | dilaporkan |
| Akurasi verifikasi (beres vs belum) | **≥ 70%** untuk menyalakan tanda `aiMeragukan` |
| Latensi rata-rata per foto (laptop demo, setelah cache) | ≤ 3 detik |
| Confusion matrix | wajib di laporan |

Bila gerbang tidak lolos: fitur dimatikan lewat `VITE_FEATURE_AI=false` atau ambang dinaikkan. **Jangan** merilis model yang belum dievaluasi.

## `ml/evaluate.js` (Albert)

```bash
node ml/evaluate.js clip-v1        # ⇒ ml/reports/clip-v1.md + update models.json.evaluasi
```

Isi laporan: tanggal, versi, ukuran dataset, akurasi, confusion matrix, latensi, contoh salah klasifikasi, catatan.

## Monitoring (mode server)

Tabel `ai_log` (lihat `apps/api/db/migrations/001_init.sql`): setiap saran dicatat dengan `saran`, `yakin`, `pilihan_akhir`.

- **Tingkat koreksi** = saran ≠ pilihan akhir warga. Ditampilkan di dasbor internal.
- Tingkat koreksi > 35% dalam 7 hari ⇒ buka issue `ml`, evaluasi ulang.

## Model card (ringkas, wajib di laporan evaluasi)

Tujuan, data evaluasi, metrik, **batasan** (foto malam/buram, sudut tidak lazim, objek mirip), **risiko** (salah tanda verifikasi ⇒ mitigasi: AI hanya memberi tanda, keputusan tetap pada aturan + warga).
