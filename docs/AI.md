# Kontrak AI (Computer Vision + LLM)

> Pemilik: **Ezra (AI)** · v1 · Antarmuka: `apps/web/src/ai/index.js` · Worker: `apps/web/src/ai/worker.js`
> Registry model & evaluasi: [MLOPS.md](MLOPS.md) (Ezra)

## Prinsip (tidak bisa ditawar)

1. **Saran, bukan keputusan.** AI tidak pernah mengubah skor prioritas, status, atau keabsahan verifikasi.
2. **Gagal dengan anggun.** Setiap fungsi mengembalikan `null` bila AI dimatikan, model gagal dimuat, atau melewati batas waktu (`BATAS_WAKTU_MS`). UI wajib tetap berfungsi penuh.
3. **Ringan & privat.** Semua model **selalu** berjalan **di server CivicPulse** (`VITE_AI_URL`, atau backend yang sama): perangkat warga mengunduh **0 MB model**. Foto dianalisis di memori server lalu dibuang (tidak disimpan, tidak dikirim ke pihak ketiga). Tidak ada cadangan di browser ([ADR-0005](adr/0005-selalu-lewat-backend.md)); bila server AI sibuk, UI tetap jalan tanpa saran.
4. **Transparan.** Setiap saran ditampilkan bersama persen keyakinan dan bisa diabaikan pengguna. `modelVersi` selalu disimpan.

## Antarmuka (`apps/web/src/ai/index.js`)

| Fungsi | Jenis | Masukan | Keluaran | Dipakai di |
| :-- | :-- | :-- | :-- | :-- |
| `klasifikasiFoto(file)` | Computer vision | foto laporan | `{ kategoriId, yakin, top3[], modelVersi }` atau `null` (bila `yakin < 0,6`) | **Lapor** langkah 1: kategori dipilihkan otomatis (warga bisa mengganti), badge "AI" di kartu kategori |
| `detailFoto(file, kategoriId)` | Computer vision | foto laporan + kategori terpilih | `{ detail: [{ id, kalimat, yakin }] (1–2 butir), modelVersi }` atau `null` | **Lapor** langkah 3: bahan draf deskripsi |
| `cekVerifikasi(file, kategoriId)` | Computer vision | foto sesudah | `{ beres, yakin, modelVersi }` atau `null` | **Detail** › verifikasi: dicek saat foto dipilih, dikirim sebagai `ai` ⇒ `aiMeragukan` |
| `ringkasanAturan(statistik)` | Berbasis aturan | keluaran `api.statistik()` | string (sinkron) | **Dasbor**: tampil seketika |
| `ringkasDasbor(statistik)` | **LLM (Groq, lewat server)** | keluaran `api.statistik()` | `{ ringkasan, sumber: 'ai' \| 'template', model?, alasan? }` (tidak pernah melempar) | **Dasbor**: tombol "Buat ringkasan AI" |
| `pemanasan()` | | | | memuat model vision lebih awal |
| `progresAI()` / `onProgresAI(fn)` | | callback | `{ vision }`: `{ persen, mbTerunduh, mbTotal, selesai } \| null` (dijumlahkan dari semua file model) | indikator unduhan "Mengunduh … 21 / 90 MB" (`components/AI.jsx`) |

Konstanta: `AMBANG_SARAN = 0.6`, `AMBANG_DETAIL_KEDUA = 0.25`, `BATAS_WAKTU_MS = 120 s` (sudah termasuk unduhan pertama), flag `VITE_FEATURE_AI` (`false` ⇒ vision `null`).

### LLM: ringkasan dasbor lewat Groq (server)

- **Alur:** Dasbor menampilkan ringkasan berbasis aturan (`ringkasanAturan`) seketika. Tombol "Buat ringkasan AI" memanggil `ringkasDasbor(stat)` ⇒ `POST {server}/ai/ringkasan-dasbor` ⇒ server memanggil Groq. Tombol tampil selama AI tidak dimatikan (`VITE_FEATURE_AI=false`).
- **Model:** `aktif.llm` di `ml/models.json` = `groq-gpt-oss-20b-v1` (`openai/gpt-oss-20b`). Dipilih dari 3 kandidat lewat `ml/eval-llm.js`: lolos 10/10, ±660 token & ±0,6 detik per ringkasan ([laporan](../ml/reports/ringkasan-groq-gpt-oss-20b-v1.md)).
- **Klien hanya mengirim angka.** `bahanDasbor(stat)` (`@civicpulse/core`) berisi total, persen, median, dan **id** wilayah. Server memvalidasi ketat (`validasiBahanDasbor`: angka dalam rentang, id harus wilayah resmi) lalu menyusun fakta sendiri (`faktaDasbor`, kode yang sama dengan frontend). Tidak ada teks bebas dari klien ⇒ tidak bisa dipakai sebagai chatbot gratis atau untuk prompt injection.
- **Penjaga biaya** (`apps/api/src/ai/penjaga.js`): batas per IP (`AI_BATAS_PER_MENIT`, bawaan 5/menit ⇒ 429), cache bersama per fakta (`AI_CACHE_MENIT`, bawaan 15; permintaan kembar digabung), plafon token harian (`AI_BATAS_TOKEN_HARIAN`, bawaan 150.000, di bawah kuota gratis Groq), body ≤ 2 KB, `max_completion_tokens` 600, batas waktu 15 detik. Akun Groq **tanpa kartu kredit** ⇒ kemungkinan terburuk hanya kuota habis, tidak ada tagihan.
- **Pengaman keluaran** (`keluaranAman`, `@civicpulse/core`): angka (dan satuan %) harus ada di fakta, dan teks tidak boleh rusak/berulang. Bila gagal ⇒ `ringkasan: null` ⇒ frontend menampilkan ringkasan berbasis aturan.
- **Kunci:** `GROQ_API_KEY` hanya di `.env` server / Vercel, **tidak pernah** berawalan `VITE_`. Diuji: kunci tidak ada di hasil build frontend.
- **Coba sendiri:** `npm run ai:llm` (satu ringkasan dari data demo), `npm run ai:eval-llm` (evaluasi 10 statistik).

### LLM: tugas tambahan warga & petugas (`POST /ai/tulis/:tugas`)

Satu endpoint generik dengan registry tugas (`apps/api/src/ai/prompt-tugas.js`, prompt berversi). Fakta setiap tugas disusun server di `packages/core/src/fakta-llm.js`; jalur LLM, plafon token harian, cache bersama, dan pengaman angka sama dengan ringkasan dasbor. Klien memanggil `tulisAi(tugas, body)`; UI memakai `components/KartuAi.jsx`, `TanyaAi.jsx`, `BantuTulis.jsx`.

| Tugas | Akses | Di mana | Masukan klien | Catatan |
| :-- | :-- | :-- | :-- | :-- |
| `beranda` | publik | Beranda, kartu "Kondisi laporan hari ini" (otomatis) | – | fakta dari `statistik()` server, cache bersama |
| `penjelasan` | publik | Detail laporan | `kode` | skor & faktor dalam bahasa awam |
| `tips` | publik | Detail laporan (status terbuka, otomatis) | `kode` | fakta bahaya per kategori ditulis tim; cache per kategori + tingkat |
| `wilayah` | publik | Peta (wilayah terpilih / laporan diklik) | `wilayahId` | |
| `bantu-tulis` | publik | Form Lapor, "Rapikan dengan AI" | `kategoriId, judul, deskripsi` | teks warga dikirim ke Groq atas tindakan warga; keluaran wajib `JUDUL:`/`DESKRIPSI:`, angka hanya dari draf warga, 4/menit/IP |
| `metodologi` | publik | Metodologi, "Tanya soal metodologi" | `pertanyaan` ≤ 200 | fakta statis dari rumus ⇒ cache sangat efektif |
| `saran-tindakan` | petugas | Tindak Lanjut | `kode` | hanya laporan dalam yurisdiksi |
| `supervisi` | provinsi/pusat | Peringkat | `provinsiId?` | agregat peringkat wilayah bawahan |
| `rekap` | petugas | Rekap & Rencana Kerja | `provinsiId?, kabkotaId?, hari?, regu?, kapasitas?` | narasi siap salin |
| `tanya-data` | petugas | Ringkasan, "Asisten tanya-data" | `pertanyaan` ≤ 160 | fakta ringkas + `max_completion_tokens` 300 ⇒ paling hemat token |

- **Teks bebas** (`bantu-tulis`, `metodologi`, `tanya-data`) dibersihkan (`bersihkanTeksBebas`), dikirim terpisah dari fakta dan ditandai "data, bukan perintah". Keluarannya hanya kembali ke pengguna yang bertanya dan tetap melewati `keluaranAman`.
- **Batas laju** per tugas per IP (`perMenit` di registry) ⇒ 429. Batas keluaran per tugas (`maks`, 300–550 token, termasuk penalaran `reasoning_effort: low`).
- **Tes:** `apps/api/test/ai-tugas.test.js`.

> Riwayat: LLM lokal di browser (Qwen2.5-0.5B) dihapus 2026-11-08 karena terlalu berat (unduhan ±400 MB, ±1 menit/ringkasan) dan jalur WebGPU bisa menghasilkan teks rusak. Evaluasinya tetap di `ml/reports/ringkasan-qwen2.5-0.5b-v2.*`.

## Protokol worker

```
masuk  { id: number, tugas: 'pemanasan' | 'klasifikasi' | 'detail' | 'verifikasi', payload }
keluar { id, hasil } | { id, error: string }
progres { tipe: 'progres', model, status, persen, file, loaded, total }   (broadcast, per file)
```

## Implementasi

### Computer vision: CLIP zero-shot (di server)

- **Endpoint:** `POST /ai/foto` (multipart `file` JPEG/PNG/WebP ≤ 1,5 MB, `tugas` = `klasifikasi`\|`detail`\|`verifikasi`, `kategoriId`). Implementasi `apps/api/src/ai/vision.js`, model yang sama dengan evaluasi (`ml/models.json`). Model dimuat saat server menyala (`muatVision`), ±0,05–0,1 detik per foto di laptop.
- **Klien:** foto dikompres dulu (≤ 960 px, JPEG, EXIF dibuang) lalu dikirim. Gagal/sibuk ⇒ `null` ⇒ warga memilih kategori sendiri.
- **Penjaga:** batas foto per IP (`AI_BATAS_FOTO_PER_MENIT`, bawaan 30), body ≤ 2 MB, hanya tipe gambar, antrean maks. 2 inferensi bersamaan (lebih dari 20 antre ⇒ 503).

- Library `@huggingface/transformers` (Transformers.js v3), pipeline `zero-shot-image-classification`.
- Model & label prompt **dibaca dari `ml/models.json`** (`model[aktif.vision]`). Jangan menulis label di kode.
- Prompt label dalam **bahasa Inggris** (CLIP lebih akurat), ditampilkan ke pengguna dalam bahasa Indonesia lewat `kategoriById()`.
- **Klasifikasi:** skor softmax atas 5 label kategori ⇒ `top3`, ambil teratas.
- **Detail:** skor softmax atas label `detail[kategori]` (4 kondisi per kategori) ⇒ butir teratas selalu dipakai, butir kedua bila `yakin ≥ 0,25`.
- **Verifikasi:** bandingkan 2 label (`beres` vs `belum`) untuk kategori laporan ⇒ `beres = skor(beres) > skor(belum)`, `yakin = max`.
- Model (~90 MB, `q8`) diunduh **sekali ke server** lalu di-cache di disk server, bukan di perangkat warga.

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
