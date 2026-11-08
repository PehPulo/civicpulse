# Kontrak AI (Computer Vision)

> Pemilik: **Ezra (AI)** · v1 · Antarmuka: `apps/web/src/ai/index.js` · Worker: `apps/web/src/ai/worker.js`
> Registry model & evaluasi: [MLOPS.md](MLOPS.md) (Ezra)

## Prinsip (tidak bisa ditawar)

1. **Saran, bukan keputusan.** AI tidak pernah mengubah skor prioritas, status, atau keabsahan verifikasi.
2. **Gagal dengan anggun.** Setiap fungsi mengembalikan `null` bila AI dimatikan, model gagal dimuat, atau melewati batas waktu (`BATAS_WAKTU_MS`). UI wajib tetap berfungsi penuh.
3. **Gratis & privat.** Model computer vision berjalan di **browser** (Web Worker + Transformers.js). Tanpa API key, tanpa biaya token, foto tidak dikirim ke pihak ketiga ([ADR-0003](adr/0003-ai-di-browser.md)).
4. **Transparan.** Setiap saran ditampilkan bersama persen keyakinan dan bisa diabaikan pengguna. `modelVersi` selalu disimpan.

## Antarmuka (`apps/web/src/ai/index.js`)

| Fungsi | Jenis | Masukan | Keluaran | Dipakai di |
| :-- | :-- | :-- | :-- | :-- |
| `klasifikasiFoto(file)` | Computer vision | foto laporan | `{ kategoriId, yakin, top3[], modelVersi }` atau `null` (bila `yakin < 0,6`) | **Lapor** langkah 1: kategori dipilihkan otomatis (warga bisa mengganti), badge "AI" di kartu kategori |
| `detailFoto(file, kategoriId)` | Computer vision | foto laporan + kategori terpilih | `{ detail: [{ id, kalimat, yakin }] (1–2 butir), modelVersi }` atau `null` | **Lapor** langkah 3: bahan draf deskripsi |
| `cekVerifikasi(file, kategoriId)` | Computer vision | foto sesudah | `{ beres, yakin, modelVersi }` atau `null` | **Detail** › verifikasi: dicek saat foto dipilih, dikirim sebagai `ai` ⇒ `aiMeragukan` |
| `ringkasDasbor(statistik)` | Berbasis aturan | keluaran `api.statistik()` | `{ ringkasan, sumber: 'template' }` (sinkron, tidak pernah `null`) | **Dasbor**: ringkasan untuk pembuat kebijakan, langsung tampil |
| `pemanasan()` | | | | memuat model vision lebih awal |
| `progresAI()` / `onProgresAI(fn)` | | callback | `{ vision }`: `{ persen, mbTerunduh, mbTotal, selesai } \| null` (dijumlahkan dari semua file model) | indikator unduhan "Mengunduh … 21 / 90 MB" (`components/AI.jsx`) |

Konstanta: `AMBANG_SARAN = 0.6`, `AMBANG_DETAIL_KEDUA = 0.25`, `BATAS_WAKTU_MS = 120 s` (sudah termasuk unduhan pertama), flag `VITE_FEATURE_AI` (`false` ⇒ vision `null`).

### Status LLM (model bahasa)

**Tidak ada LLM di aplikasi** (keputusan 2026-11-08). LLM lokal di browser (Qwen2.5-0.5B) dihapus: unduhan ±400 MB, ±1 menit per ringkasan di laptop, dan jalur WebGPU bisa menghasilkan teks rusak. Ringkasan dasbor kini disusun **berbasis aturan** (`ringkasanTemplate`, `ai/ringkasan.js`), selalu akurat. Riwayat evaluasinya tetap di `ml/reports/ringkasan-qwen2.5-0.5b-v2.*` dan entri `arsip` di `ml/models.json`.

LLM lewat API (lewat backend, API key tidak pernah di browser) **belum dipasang**, menunggu keputusan tim. Bila dipasang: `ringkasDasbor` adalah satu-satunya titik yang diganti, dan pengaman `keluaranAman` (`ai/pengaman.js`: angka harus ada di fakta + keluaran tidak rusak/berulang) wajib dipakai, dengan `ringkasanTemplate` sebagai cadangan. Pengaman ini sudah diuji di `apps/web/test/ringkasan.test.js`.

## Protokol worker

```
masuk  { id: number, tugas: 'pemanasan' | 'klasifikasi' | 'detail' | 'verifikasi', payload }
keluar { id, hasil } | { id, error: string }
progres { tipe: 'progres', model, status, persen, file, loaded, total }   (broadcast, per file)
```

## Implementasi

### Computer vision: CLIP zero-shot

- Library `@huggingface/transformers` (Transformers.js v3), pipeline `zero-shot-image-classification`.
- Model & label prompt **dibaca dari `ml/models.json`** (`model[aktif.vision]`). Jangan menulis label di kode.
- Prompt label dalam **bahasa Inggris** (CLIP lebih akurat), ditampilkan ke pengguna dalam bahasa Indonesia lewat `kategoriById()`.
- **Klasifikasi:** skor softmax atas 5 label kategori ⇒ `top3`, ambil teratas.
- **Detail:** skor softmax atas label `detail[kategori]` (4 kondisi per kategori) ⇒ butir teratas selalu dipakai, butir kedua bila `yakin ≥ 0,25`.
- **Verifikasi:** bandingkan 2 label (`beres` vs `belum`) untuk kategori laporan ⇒ `beres = skor(beres) > skor(belum)`, `yakin = max`.
- Model diunduh sekali (~90 MB, `q8`) lalu di-cache browser. **Panaskan cache sebelum demo.**

### Draf deskripsi (`ai/deskripsi.js`)

Draf judul & deskripsi di langkah 3 Lapor disusun **deterministik dari template**, bukan LLM: `kalimat` detail dari `ml/models.json` + kecamatan. Alasannya: instan, tanpa unduhan model bahasa, dan **tidak bisa mengarang fakta**. Kalimat detail dilarang memuat angka (diuji di `apps/web/test/deskripsi.test.js`). Draf hanya mengisi kolom selama warga belum mengubahnya, dan ditandai "disusun AI, periksa dan lengkapi". Pilihan cepat (`PILIHAN_CEPAT`: sejak kapan, dampak) menambahkan kalimat sekali ketuk. Id detail yang terdeteksi dikirim sebagai `ai.detailSaran`.

### EXIF & lokasi (pendukung verifikasi)

- MVP: `waktuFoto = file.lastModified`, lokasi dari `navigator.geolocation` saat verifikasi.
- Lanjutan: baca EXIF `DateTimeOriginal` & GPS (mis. library `exifr`) **sebelum** kompresi; kompresi membuang EXIF dari foto yang disimpan.

## Kriteria selesai fitur AI

- [ ] Tanpa koneksi ke model (offline/diblokir) alur Lapor & Verifikasi tetap selesai
- [ ] Saran tampil < 3 detik setelah model ter-cache (laptop demo)
- [ ] Akurasi model vision aktif lolos gerbang MLOps (≥ 75%)
- [ ] `modelVersi` tersimpan di laporan/verifikasi
