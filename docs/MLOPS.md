# Kontrak MLOps

> Folder: [`ml/`](../ml)

## Siklus hidup model

```
pilih kandidat ─► daftarkan di ml/models.json (status: kandidat)
              ─► evaluasi: node ml/evaluate.js <versi> ─► ml/reports/<versi>.md
              ─► lolos gerbang? ── ya ─► status: aktif, "aktif": <versi> (PR + review)
                                └ tidak ─► perbaiki label prompt / ganti model ─► ulangi
              ─► monitoring di produksi (ai_log) ─► evaluasi ulang bila tingkat koreksi naik
```

## Registry `ml/models.json`

| Field | Arti |
| :-- | :-- |
| `aktif.vision`, `aktif.llm` | versi model vision (CLIP, di browser) & LLM (Groq, di server) yang dipakai |
| `penyedia`, `modelId` | (LLM Groq) penyedia & id model di API |
| `model.<versi>.hfId` | id Hugging Face (dipatok, tidak memakai "latest") |
| `pipeline`, `dtype` | konfigurasi Transformers.js |
| `label.klasifikasi` | prompt per kategori |
| `label.verifikasi.<kategori>` | prompt `beres` / `belum` |
| `prompt.sistem`, `generasi` | (LLM, hanya di entri arsip) prompt sistem & parameter generasi |
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
| LLM: tingkat lolos pengaman `keluaranAman` (10 statistik berbeda, `ml/eval-llm.js`) | **≥ 80%** |
| Confusion matrix | wajib di laporan |

Bila gerbang tidak lolos: fitur dimatikan lewat `VITE_FEATURE_AI=false` atau ambang dinaikkan. **Jangan** merilis model yang belum dievaluasi.

## `ml/evaluate.js`

```bash
node ml/eval/ambil-commons.js       # unduh foto uji berlisensi bebas (Wikimedia Commons) + atribusi → ml/eval/sumber.csv
node ml/evaluate.js                 # model aktif di models.json ⇒ ml/reports/<versi>.md + .json
npm run ai:eval-llm [versi…]          # LLM Groq: 10 statistik ⇒ ml/reports/ringkasan-<versi>.md
npm run ai:foto -- foto.jpg [kategori] # coba computer vision pada satu foto
npm run ai:llm                         # coba satu ringkasan LLM
node ml/evaluate.js --percobaan 10  # + 10 percobaan ujung ke ujung (foto → CLIP kategori + kondisi → draf deskripsi) ⇒ ml/reports/percobaan.json
npm run build -w @civicpulse/web && node ml/video/rekam-demo.js   # rekaman layar ASLI website: 10× beranda → Lapor → foto (CLIP) → lokasi → kirim → skor prioritas ⇒ ml/reports/video-demo-lapor.mp4 (butuh Chrome + ffmpeg)
```

Kurasi: foto yang tidak cocok dengan kelasnya dicatat judul Commons-nya di `ml/eval/tolak.txt`.

Isi laporan: tanggal, versi, ukuran dataset, akurasi, confusion matrix, latensi, contoh salah klasifikasi, catatan.

## Monitoring (mode server)

Tabel `ai_log` (lihat `apps/api/db/migrations/001_init.sql`): setiap saran dicatat dengan `saran`, `yakin`, `pilihan_akhir`.

- **Tingkat koreksi** = saran ≠ pilihan akhir warga. Ditampilkan di dasbor internal.
- Tingkat koreksi > 35% dalam 7 hari ⇒ buka issue `ml`, evaluasi ulang.

## Model card (ringkas, wajib di laporan evaluasi)

Tujuan, data evaluasi, metrik, **batasan** (foto malam/buram, sudut tidak lazim, objek mirip), **risiko** (salah tanda verifikasi ⇒ mitigasi: AI hanya memberi tanda, keputusan tetap pada aturan + warga).
