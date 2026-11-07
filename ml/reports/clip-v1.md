# Laporan evaluasi clip-v1

> Dibuat otomatis oleh `node ml/evaluate.js` pada 2026-11-07. Model `Xenova/clip-vit-base-patch32` (q8), label dari `ml/models.json`.
> Dataset: 45 foto asli berlisensi bebas dari Wikimedia Commons, dikurasi manual (atribusi: `ml/eval/sumber.csv`).

| Metrik | Nilai |
| :-- | --: |
| Akurasi top-1 | **77.8%** (35/45) |
| Akurasi top-3 | 91.1% |
| Latensi median per foto (CPU Node, tanpa unduh model) | 45 ms |
| Gerbang rilis (top-1 ≥ 75%) | ✅ lulus |

## Per kelas

| Kelas | Foto | Recall | Presisi |
| :-- | --: | --: | --: |
| drainase | 7 | 57.1% | 100.0% |
| banjir | 8 | 100.0% | 80.0% |
| jalan | 13 | 100.0% | 65.0% |
| longsor | 12 | 83.3% | 90.9% |
| lainnya | 5 | 0.0% | 0.0% |

## Confusion matrix (baris = label asli, kolom = prediksi)

| | drainase | banjir | jalan | longsor | lainnya |
| :-- | --: | --: | --: | --: | --: |
| **drainase** | 4 | 1 | 2 | 0 | 0 |
| **banjir** | 0 | 8 | 0 | 0 | 0 |
| **jalan** | 0 | 0 | 13 | 0 | 0 |
| **longsor** | 0 | 0 | 2 | 10 | 0 |
| **lainnya** | 0 | 1 | 3 | 1 | 0 |

## Salah klasifikasi

| Foto | Label | Prediksi | Yakin |
| :-- | :-- | :-- | --: |
| longsor_jalan-longsor.jpg | longsor | jalan | 49.8% |
| longsor_landslide-in-north-tapanuli-following-heavy-rainfa.jpg | longsor | jalan | 44.0% |
| drainase_waste-in-rain-gutter-near-school-bali.jpg | drainase | banjir | 60.5% |
| drainase_market-men-cleaning-drainage-in-agbara-lagos-badag.jpg | drainase | jalan | 48.8% |
| drainase_1-alcantarillado-colapsado.jpg | drainase | jalan | 42.2% |
| lainnya_broken-lamppost-streetlight-on-a899-livingston-roa.jpg | lainnya | jalan | 54.3% |
| lainnya_broken-lamppost-streetlight-collision-on-a899-livi.jpg | lainnya | jalan | 80.3% |
| lainnya_ukraine-kyyivska-prypyat-prypiat-prospekt-lenina-3.jpg | lainnya | banjir | 40.9% |
| lainnya_damaged-footbridge-in-langley-park-farm-geograph-o.jpg | lainnya | longsor | 49.8% |
| lainnya_damaged-footbridge-over-the-back-water-geograph-or.jpg | lainnya | jalan | 63.0% |
