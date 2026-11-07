# Kontrak Skor Prioritas & Analitik

> Pemilik: **Ezra** · Rumus **v1.0** · Implementasi: `packages/core/src/prioritas.js`, `analitik.js` (+ tes)
> Mengubah bobot, normalisasi, atau ambang ⇒ **wajib** menaikkan `VERSI_RUMUS` dan mencatatnya di bawah.

## Skor prioritas (0–100)

```
Skor = 35% × Risiko wilayah      nilai = IRBI jenis bahaya kategori (0–100)
     + 25% × Riwayat kejadian    nilai = min(100, kejadian5th / 5 × 100)
     + 20% × Kerentanan sosial   nilai = clamp((miskin − 3) / (12 − 3) × 100)
     + 20% × Laporan serupa      nilai = min(100, pelapor unik / 10 × 100)

Tinggi ≥ 70 · Sedang 40–69 · Rendah < 40
```

- **Laporan serupa** = pelapor unik lain (termasuk pemberi +1) dengan kategori sama, radius **500 m**, **30 hari** terakhir.
- **Kalimat alasan** = 2–3 faktor dengan kontribusi terbesar yang nilainya > 0.
- **Kerentanan sosial** sengaja ada agar wilayah miskin yang jarang melapor tidak kalah oleh wilayah yang ramai.
- Skor dihitung **di server** (atau adapter lokal). Nilai skor dari klien diabaikan.
- Respons selalu menyertakan `versiRumus` agar skor lama tetap bisa dijelaskan.

**Contoh terverifikasi oleh unit test:** Dayeuhkolot, drainase, 4 pelapor serupa ⇒ 0,35·92 + 0,25·100 + 0,20·37,8 + 0,20·40 = **72,76 ⇒ 73 (Tinggi)**.

## Analitik dasbor

Semua dihitung `core.statistik(laporan, wilayah, sekarang)`.

| Metrik | Definisi |
| :-- | :-- |
| `persenTerverifikasi` | laporan `terverifikasi` ÷ laporan yang **pernah** diklaim selesai |
| `medianHariTangani` | median (waktu terverifikasi − waktu dibuat), hari |
| `skorKesenjangan` per wilayah | 50% × risiko maks wilayah + 30% × min(100, laporan terbuka/10×100) + 20% × min(100, rata umur terbuka/30 hari×100) |
| `perluPerhatian` | 5 wilayah dengan `skorKesenjangan` tertinggi |
| `wilayahSenyap` | risiko maks ≥ 70 **dan** laporan 30 hari < 50% rata-rata semua wilayah |
| `mingguan` | 8 minggu terakhir: jumlah laporan masuk vs terverifikasi |

> **Wilayah Senyap** adalah pembeda utama CivicPulse: menunjukkan tempat yang *seharusnya* banyak laporan menurut data risiko, tetapi warganya tidak bersuara.

## Riwayat versi

| Versi | Tanggal | Perubahan |
| :-- | :-- | :-- |
| 1.0 | 2026-11-07 | Rumus awal |
