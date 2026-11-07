# Kontrak AI (Computer Vision + LLM)

> Pemilik: **Ezra (AI)** · v1 · Antarmuka: `apps/web/src/ai/index.js` · Worker: `apps/web/src/ai/worker.js`
> Registry model & evaluasi: [MLOPS.md](MLOPS.md) (Ezra)

## Prinsip (tidak bisa ditawar)

1. **Saran, bukan keputusan.** AI tidak pernah mengubah skor prioritas, status, atau keabsahan verifikasi.
2. **Gagal dengan anggun.** Setiap fungsi mengembalikan `null` bila AI dimatikan, model gagal dimuat, atau melewati batas waktu (`BATAS_WAKTU_MS`). UI wajib tetap berfungsi penuh.
3. **Gratis & privat.** Model berjalan di **browser** (Web Worker + Transformers.js, WebGPU/WASM). Tanpa API key, tanpa biaya token, foto tidak dikirim ke pihak ketiga ([ADR-0003](adr/0003-ai-di-browser.md)).
4. **Transparan.** Setiap saran ditampilkan bersama persen keyakinan dan bisa diabaikan pengguna. `modelVersi` selalu disimpan.

## Antarmuka (`apps/web/src/ai/index.js`)

| Fungsi | Jenis | Masukan | Keluaran | Dipakai di |
| :-- | :-- | :-- | :-- | :-- |
| `klasifikasiFoto(file)` | Computer vision | foto laporan | `{ kategoriId, yakin, top3[], modelVersi }` atau `null` (bila `yakin < 0,6`) | **Lapor** langkah 1: kategori dipilihkan otomatis (warga bisa mengganti), badge "AI" di kartu kategori |
| `detailFoto(file, kategoriId)` | Computer vision | foto laporan + kategori terpilih | `{ detail: [{ id, kalimat, yakin }] (1–2 butir), modelVersi }` atau `null` | **Lapor** langkah 3: bahan draf deskripsi |
| `cekVerifikasi(file, kategoriId)` | Computer vision | foto sesudah | `{ beres, yakin, modelVersi }` atau `null` | **Detail** › verifikasi: dicek saat foto dipilih, dikirim sebagai `ai` ⇒ `aiMeragukan` |
| `ringkasDasbor(statistik)` | **LLM** | keluaran `api.statistik()` | `{ ringkasan, sumber: 'ai' \| 'template', modelVersi }` (tidak pernah `null`) | **Dasbor**: tombol "Buat ringkasan AI" |
| `ringkasLaporan({ kategoriLabel, yakin, detail, wilayah, bahaya, cadangan })` | **LLM** | hasil vision + data wilayah (BNPB/BPS) | `{ ringkasan, sumber: 'ai' \| 'template', modelVersi, fakta }` (pengaman angka sama; `cadangan` = deskripsi warga) | **Lapor** langkah hasil: tombol "Buat ringkasan AI untuk instansi" |
| `pemanasan(model)` | | `'vision'` \| `'llm'` | | memuat model lebih awal |
| `progresAI()` / `onProgresAI(fn)` | | callback | `{ vision, llm }`, masing-masing `{ persen, mbTerunduh, mbTotal, selesai } \| null` (dijumlahkan dari semua file model) | indikator unduhan "Mengunduh … 21 / 150 MB" (`components/AI.jsx`) |

Konstanta: `AMBANG_SARAN = 0.6`, `AMBANG_DETAIL_KEDUA = 0.25`, `BATAS_WAKTU_MS = { vision: 120 s, llm: 600 s }` (sudah termasuk unduhan pertama), flag `VITE_FEATURE_AI` (`false` ⇒ vision `null`, LLM memakai template).

**Pengaman anti-halusinasi LLM** (`ai/pengaman.js`, `keluaranAman`): LLM hanya menerima daftar fakta yang disusun deterministik. Keluaran **ditolak** dan diganti template bila (1) memuat angka/satuan % yang tidak ada di fakta (`angkaTerjamin`), atau (2) rusak: menyalin format prompt ("Fakta laporan:"), mengulang frasa 3 kata > 2 kali, atau < 30 karakter (`keluaranWajar`). Diuji di `apps/web/test/ringkasan.test.js`; skrip evaluasi di `ml/` memakai pengaman yang sama.

> Catatan 2026-11-08: jalur WebGPU (`q4f16`) di GPU perangkat lunak (Chrome headless/SwiftShader) menghasilkan teks rusak tanpa angka, sehingga lolos pengaman angka. Karena itu `keluaranWajar` ditambahkan. Konfigurasi yang dievaluasi adalah WASM `q4`; video demo direkam dengan WebGPU dimatikan.

## Protokol worker

```
masuk  { id: number, tugas: 'pemanasan' | 'klasifikasi' | 'detail' | 'verifikasi' | 'ringkas' | 'ringkasLaporan', payload }
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

Draf judul & deskripsi di langkah 3 Lapor disusun **deterministik dari template**, bukan LLM: `kalimat` detail dari `ml/models.json` + kecamatan. Alasannya: instan (tanpa unduhan model bahasa ±400 MB di HP warga), dan **tidak bisa mengarang fakta**. Kalimat detail dilarang memuat angka (diuji di `apps/web/test/deskripsi.test.js`). Draf hanya mengisi kolom selama warga belum mengubahnya, dan ditandai "disusun AI, periksa dan lengkapi". Pilihan cepat (`PILIHAN_CEPAT`: sejak kapan, dampak) menambahkan kalimat sekali ketuk. Id detail yang terdeteksi dikirim sebagai `ai.detailSaran`.

### LLM: ringkasan dasbor (WAJIB)

- Transformers.js pipeline `text-generation`, model **Qwen2.5-0.5B-Instruct** (`model[aktif.llm]` di `ml/models.json`): `q4f16` di WebGPU, `q4` di WASM. Unduhan ±400–500 MB sekali, lalu di-cache.
- Prompt sistem & parameter generasi ada di `ml/models.json` (`prompt.sistem`, `generasi`) agar bisa dievaluasi & diganti tanpa mengubah kode.
- Dijalankan **atas permintaan** (tombol), di laptop dasbor/instansi. Tidak otomatis di HP warga.
- Masukan hanya agregat dasbor. **Tanpa** data pribadi.
- Ringkasan laporan untuk instansi (`ringkasLaporan`, prompt `prompt.laporan` + `prompt.contohLaporan`, `generasiLaporan`): juga **atas permintaan** lewat tombol di halaman hasil Lapor, dengan peringatan unduhan ±400 MB. Fakta disusun `faktaLaporan()` (`ai/pesan.js`) dari hasil CLIP + data wilayah; diuji 10 percobaan di `ml/reports/percobaan.json` (10/10 lolos pengaman).

### EXIF & lokasi (pendukung verifikasi)

- MVP: `waktuFoto = file.lastModified`, lokasi dari `navigator.geolocation` saat verifikasi.
- Lanjutan: baca EXIF `DateTimeOriginal` & GPS (mis. library `exifr`) **sebelum** kompresi; kompresi membuang EXIF dari foto yang disimpan.

## Kriteria selesai fitur AI

- [ ] Tanpa koneksi ke model (offline/diblokir) alur Lapor & Verifikasi tetap selesai
- [ ] Saran tampil < 3 detik setelah model ter-cache (laptop demo)
- [ ] Akurasi model vision aktif lolos gerbang MLOps (≥ 75%)
- [ ] Ringkasan LLM lolos pengaman angka pada ≥ 8 dari 10 percobaan (bila tidak, template tetap tampil)
- [ ] `modelVersi` tersimpan di laporan/verifikasi
