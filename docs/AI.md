# Kontrak AI (Computer Vision + LLM)

> Pemilik: **Ezra (AI)** · v1 · Antarmuka: `apps/web/src/ai/index.js` · Worker: `apps/web/src/ai/worker.js`
> Registry model & evaluasi: [MLOPS.md](MLOPS.md) (Albert)

## Prinsip (tidak bisa ditawar)

1. **Saran, bukan keputusan.** AI tidak pernah mengubah skor prioritas, status, atau keabsahan verifikasi.
2. **Gagal dengan anggun.** Setiap fungsi mengembalikan `null` bila AI dimatikan, model gagal dimuat, atau melewati **15 detik**. UI wajib tetap berfungsi penuh.
3. **Gratis & privat.** Model berjalan di **browser** (Web Worker + Transformers.js, WebGPU/WASM). Tanpa API key, tanpa biaya token, foto tidak dikirim ke pihak ketiga ([ADR-0003](adr/0003-ai-di-browser.md)).
4. **Transparan.** Setiap saran ditampilkan bersama persen keyakinan dan bisa diabaikan pengguna. `modelVersi` selalu disimpan.

## Antarmuka (`apps/web/src/ai/index.js`)

| Fungsi | Masukan | Keluaran | Dipakai di |
| :-- | :-- | :-- | :-- |
| `klasifikasiFoto(file)` | `File` foto laporan | `{ kategoriId, yakin, top3[], modelVersi }` atau `null` (bila `yakin < 0,6`) | Lapor langkah 2: "Sepertinya **Drainase** (87%)" ⇒ pra-pilih kategori |
| `cekVerifikasi(file, kategoriId)` | foto sesudah | `{ beres, yakin, modelVersi }` atau `null` | Detail: dikirim sebagai `ai` di verifikasi ⇒ `aiMeragukan` |
| `ringkasLaporan(laporan[])` *(P2)* | daftar laporan | `{ ringkasan, modelVersi }` atau `null` | Dasbor/Instansi: ringkasan naratif |
| `pemanasan()` | | | Dipanggil saat halaman Lapor dibuka |

Konstanta: `AMBANG_SARAN = 0.6`, `BATAS_WAKTU_MS = 15000`, flag `VITE_FEATURE_AI` (`false` ⇒ semua fungsi `null`).

## Protokol worker

```
masuk  { id: number, tugas: 'pemanasan' | 'klasifikasi' | 'verifikasi' | 'ringkas', payload }
keluar { id, hasil } | { id, error: string }
```

## Implementasi

### Computer vision: CLIP zero-shot

- Library `@huggingface/transformers` (Transformers.js v3), pipeline `zero-shot-image-classification`.
- Model & label prompt **dibaca dari `ml/models.json`** (`model[aktif]`). Jangan menulis label di kode.
- Prompt label dalam **bahasa Inggris** (CLIP lebih akurat), ditampilkan ke pengguna dalam bahasa Indonesia lewat `kategoriById()`.
- **Klasifikasi:** skor softmax atas 5 label kategori ⇒ `top3`, ambil teratas.
- **Verifikasi:** bandingkan 2 label (`beres` vs `belum`) untuk kategori laporan ⇒ `beres = skor(beres) > skor(belum)`, `yakin = max`.
- Model diunduh sekali (~90 MB, `q8`) lalu di-cache browser. **Panaskan cache sebelum demo.**

### LLM: ringkasan (P2, opsional)

- **WebLLM** (`@mlc-ai/web-llm`) dengan model kecil (mis. Qwen2.5-0.5B/1.5B-Instruct) di **laptop instansi/dasbor saja**, bukan HP warga.
- Butuh WebGPU. Bila tidak tersedia ⇒ `null`, dasbor menampilkan ringkasan template dari `core.statistik()`.
- Prompt hanya berisi `judul, kategoriId, wilayahId, status`. **Tanpa** data pribadi.

### EXIF & lokasi (pendukung verifikasi)

- MVP: `waktuFoto = file.lastModified`, lokasi dari `navigator.geolocation` saat verifikasi.
- Lanjutan: baca EXIF `DateTimeOriginal` & GPS (mis. library `exifr`) **sebelum** kompresi; kompresi membuang EXIF dari foto yang disimpan.

## Kriteria selesai fitur AI

- [ ] Tanpa koneksi ke model (offline/diblokir) alur Lapor & Verifikasi tetap selesai
- [ ] Saran tampil < 3 detik setelah model ter-cache (laptop demo)
- [ ] Akurasi model aktif lolos gerbang MLOps (≥ 75%)
- [ ] `modelVersi` tersimpan di laporan/verifikasi
