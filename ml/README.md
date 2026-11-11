# ml/: MLOps CivicPulse

Kontrak lengkap ada di [`docs/MLOPS.md`](../docs/MLOPS.md). Antarmuka AI yang dipakai UI ada di [`docs/AI.md`](../docs/AI.md).

| Path | Isi |
| :-- | :-- |
| `models.json` | Registry model: id Hugging Face, dtype, label prompt, status, hasil evaluasi |
| `eval/images/` | Foto uji berlabel (≥ 30, minimal 5 per kelas, foto milik sendiri/berlisensi bebas) |
| `eval/labels.csv` | `file,label` dengan label ∈ `drainase, banjir, jalan, longsor, lainnya, beres` |
| `evaluate.js` | Skrip evaluasi (Node + Transformers.js) → `reports/<versi>.md` |
| `reports/` | Laporan evaluasi per versi model (akurasi, confusion matrix, latensi) |

Gerbang rilis: model berstatus `"aktif"` hanya jika akurasi top-1 klasifikasi **≥ 75%** pada `eval/`.
