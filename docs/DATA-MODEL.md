# Kontrak Data Model

> Pemilik: **Ezra** · v1 · Sumber kebenaran kode: `packages/core/src/laporan.js` · SQL: `apps/api/db/migrations/001_init.sql`
> Waktu selalu **ISO 8601 UTC** (`2026-11-07T08:00:00.000Z`). Nama field **camelCase** di JSON, **snake_case** di SQL.

## Wilayah

Berasal dari `data/processed/wilayah.json` (skema: `data/schema/wilayah.schema.json`).

| Field | Tipe | Keterangan |
| :-- | :-- | :-- |
| `id` | string kebab-case | mis. `dayeuhkolot` |
| `kecamatan`, `kabupaten` | string | `kabupaten` memakai awalan `Kab.` / `Kota` |
| `lat`, `lng` | number | centroid kecamatan |
| `risiko` | `{ banjir, longsor, jalan }` 0–100 | IRBI dinormalisasi (lihat DATA.md) |
| `kejadian5th` | `{ banjir, longsor, jalan }` integer | jumlah kejadian DIBI dalam periode 5 tahun |
| `miskin` | number 0–100 | % penduduk miskin kab/kota (BPS) |

## Kategori (tetap, di `core/kategori.js`)

`drainase`, `banjir`, `jalan`, `longsor`, `lainnya`. Masing-masing dipetakan ke `bahaya` ∈ `banjir | longsor | jalan`.

## Laporan

| Field | Tipe | Wajib | Aturan |
| :-- | :-- | :-: | :-- |
| `kode` | string | ✅ | `^CP-\d{4}-\d{4}$`, unik, dibuat server |
| `kategoriId` | enum Kategori | ✅ | |
| `wilayahId` | string | ✅ | dideteksi server dari `lat,lng` |
| `lat`, `lng` | number | ✅ | |
| `judul` | string ≤ 80 | ✅ | kosong ⇒ label kategori |
| `deskripsi` | string 10–280 | ✅ | |
| `fotoUrl` | string \| null | | URL Storage (server) / data URL (lokal) |
| `pelaporId` | UUID | ✅ | `X-Device-Id` pembuat. **Tidak pernah ditampilkan.** |
| `dibuat` | ISO datetime | ✅ | |
| `status` | enum Status | ✅ | lihat STATUS.md |
| `prioritas` | Prioritas | ✅ | dihitung server, input klien diabaikan |
| `dukungan` | UUID[] | ✅ | perangkat yang menekan +1 (API publik cukup mengirim jumlahnya) |
| `riwayat` | StatusEvent[] | ✅ | urut waktu, minimal 1 |
| `verifikasi` | Verifikasi[] | ✅ | |
| `tanggapan` | Tanggapan \| null | | |
| `ai` | `{ kategoriSaran, yakin, modelVersi }` \| null | | saran AI saat melapor |

### Prioritas

```json
{ "skor": 73, "level": "Tinggi", "versiRumus": "1.0",
  "penjelasan": "Prioritas tinggi: wilayah berisiko banjir tinggi, 6 kejadian banjir tercatat dalam 5 tahun, dan …",
  "faktor": [{ "kunci": "risiko", "label": "Risiko wilayah", "sumber": "IRBI · BNPB", "nilai": 92, "bobot": 0.35, "kontribusi": 32.2, "tampil": "Tinggi (92/100)", "alasan": "…" }] }
```

### StatusEvent

| Field | Tipe |
| :-- | :-- |
| `status` | enum Status |
| `waktu` | ISO datetime |
| `oleh` | `warga \| instansi \| sistem` |
| `catatan` | string |
| `buktiUrl` | string \| null |

### Verifikasi

| Field | Tipe | Keterangan |
| :-- | :-- | :-- |
| `deviceId` | UUID | verifikator |
| `beres` | boolean | jawaban warga |
| `fotoUrl` | string | wajib di server |
| `lat`, `lng` | number | posisi saat foto |
| `waktuFoto` | ISO datetime | EXIF `DateTimeOriginal` / `lastModified` |
| `waktu` | ISO datetime | waktu dikirim |
| `sah` | boolean | hasil `core.periksaVerifikasi` |
| `cek` | `{ lokasiOk, waktuOk, aiMeragukan, alasan[] }` | |
| `ai` | `{ beres, yakin, modelVersi }` \| null | saran AI |

### Tanggapan

`{ isi: string, petugas: string, waktu: ISO, buktiUrl: string|null }`

## Statistik (respons `GET /statistik`)

Bentuk persis = keluaran `core.statistik()`: `total`, `perStatus`, `persenTerverifikasi`, `medianHariTangani`, `perluPerhatian[5]`, `wilayahSenyap[]`, `perWilayah[]`, `mingguan[8]`. Definisi tiap angka: [SCORING.md § Analitik](SCORING.md#analitik-dasbor).
