# Laporan evaluasi clip-v2

> Dibuat otomatis oleh `node ml/evaluate.js` pada 2026-11-07. Model `Xenova/clip-vit-base-patch32` (q8), label dari `ml/models.json`.
> Dataset: 45 foto asli berlisensi bebas dari Wikimedia Commons, dikurasi manual (atribusi: `ml/eval/sumber.csv`).

> Catatan: Prompt klasifikasi dituning dari clip-v1 (drainase, jalan, longsor, lainnya) berdasarkan confusion matrix clip-v1. Dipilih pada set ml/eval yang sama: perlu set uji terpisah untuk angka tanpa bias.

| Metrik | Nilai |
| :-- | --: |
| Akurasi top-1 | **84.4%** (38/45) |
| Akurasi top-3 | 97.8% |
| Latensi median per foto (CPU Node, tanpa unduh model) | 54 ms |
| Gerbang rilis (top-1 ≥ 75%) | ✅ lulus |

## Per kelas

| Kelas | Foto | Recall | Presisi |
| :-- | --: | --: | --: |
| drainase | 7 | 57.1% | 66.7% |
| banjir | 8 | 100.0% | 80.0% |
| jalan | 13 | 84.6% | 84.6% |
| longsor | 12 | 100.0% | 100.0% |
| lainnya | 5 | 60.0% | 75.0% |

## Confusion matrix (baris = label asli, kolom = prediksi)

| | drainase | banjir | jalan | longsor | lainnya |
| :-- | --: | --: | --: | --: | --: |
| **drainase** | 4 | 1 | 1 | 0 | 1 |
| **banjir** | 0 | 8 | 0 | 0 | 0 |
| **jalan** | 2 | 0 | 11 | 0 | 0 |
| **longsor** | 0 | 0 | 0 | 12 | 0 |
| **lainnya** | 0 | 1 | 1 | 0 | 3 |

## Salah klasifikasi

| Foto | Label | Prediksi | Yakin |
| :-- | :-- | :-- | --: |
| jalan_bache-en-san-luis.jpg | jalan | drainase | 42.1% |
| jalan_bache-de-calle.jpg | jalan | drainase | 71.6% |
| drainase_waste-in-rain-gutter-near-school-bali.jpg | drainase | banjir | 55.3% |
| drainase_market-men-cleaning-drainage-in-agbara-lagos-badag.jpg | drainase | jalan | 40.7% |
| drainase_1-alcantarillado-colapsado.jpg | drainase | lainnya | 79.0% |
| lainnya_broken-lamppost-streetlight-on-a899-livingston-roa.jpg | lainnya | jalan | 37.1% |
| lainnya_ukraine-kyyivska-prypyat-prypiat-prospekt-lenina-3.jpg | lainnya | banjir | 65.0% |
