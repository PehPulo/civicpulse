# ml/: MLOps CivicPulse

Kontrak lengkap ada di [`docs/MLOPS.md`](../docs/MLOPS.md). Antarmuka AI yang dipakai UI ada di [`docs/AI.md`](../docs/AI.md).

| Path | Isi | Pemilik |
| :-- | :-- | :-- |
| `models.json` | Registry model: id Hugging Face, dtype, label prompt, status, hasil evaluasi | Ezra |
| `eval/images/` | Foto uji berlabel (≥ 30, minimal 5 per kelas, foto milik sendiri/berlisensi bebas) | Ezra |
| `eval/labels.csv` | `file,label` dengan label ∈ `drainase, banjir, jalan, longsor, lainnya, beres` | Ezra |
| `evaluate.js` | Skrip evaluasi (Node + Transformers.js) → `reports/<versi>.md` | Ezra |
| `reports/` | Laporan evaluasi per versi model (akurasi, confusion matrix, latensi) | Ezra |

Gerbang rilis: model berstatus `"aktif"` hanya jika akurasi top-1 klasifikasi **≥ 75%** pada `eval/`.
