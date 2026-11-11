# Kontrak Status & Verifikasi Warga

> v1 · Implementasi: `packages/core/src/status.js`, `packages/core/src/verifikasi.js` (+ tes)

## State machine

```
            instansi              instansi
DITERIMA ───────────► DIPROSES ───────────► KLAIM_SELESAI
                         ▲                      │
                         │ instansi             ├── sistem: ≥ 3 verifikasi sah "beres" (dan beres > belum) ──► TERVERIFIKASI ■
                         │                      │
                    DIBUKA_ULANG ◄──────────────┴── sistem: ≥ 3 suara sah & mayoritas "belum",
                                                    ATAU > 14 hari tanpa cukup verifikasi
```

| Kode | Label UI | Terbuka? |
| :-- | :-- | :-: |
| `diterima` | Diterima | ✅ |
| `diproses` | Diproses instansi | ✅ |
| `klaim_selesai` | Klaim selesai | |
| `terverifikasi` | Terverifikasi warga | |
| `dibuka_ulang` | Dibuka ulang | ✅ |

**Aturan:**
- Hanya transisi di tabel `TRANSISI` yang sah. Selain itu ⇒ galat `TRANSISI_TIDAK_SAH` (HTTP **409**).
- **Instansi tidak pernah bisa menandai "terverifikasi" sendiri.** Inilah inti akuntabilitas CivicPulse.
- Setiap transisi menambah satu `StatusEvent` ke `riwayat`. Riwayat **tidak pernah diubah/dihapus**.

## Verifikasi warga

Dibuka hanya saat status `klaim_selesai`. Satu "siklus" = sejak klaim selesai terakhir; jika dibuka ulang lalu diklaim lagi, hitungan mulai dari nol.

| Syarat sah | Konstanta (`ATURAN_VERIFIKASI`) |
| :-- | :-- |
| Foto diambil dalam radius **200 m** dari titik laporan | `radiusMeter = 200` |
| Foto diambil **setelah** waktu klaim | `waktuFoto ≥ klaim` |
| Verifikator **bukan** pelapor | `deviceId ≠ pelaporId` |
| **Satu** verifikasi per perangkat per siklus | |

Verifikasi yang tidak sah **ditolak** (HTTP **422** `VERIFIKASI_DITOLAK`, `detail.alasan[]`) dan tidak disimpan.

**Peran AI:** jika warga menjawab "beres" tetapi AI yakin (≥ 0,6) foto masih bermasalah, verifikasi diberi tanda `aiMeragukan = true`. Tanda ini **tidak** menggugurkan verifikasi; tanda ditampilkan ke instansi & dasbor untuk audit.

**Evaluasi (oleh sistem):** dijalankan setiap ada verifikasi baru dan berkala (server: cron harian; lokal: saat aplikasi dimuat).

| Kondisi | Hasil |
| :-- | :-- |
| `beres ≥ 3` dan `beres > belum` | `terverifikasi` |
| `total sah ≥ 3` dan `belum > beres` | `dibuka_ulang` |
| > 14 hari sejak klaim tanpa memenuhi di atas | `dibuka_ulang` |
| lainnya | tetap `klaim_selesai` |
