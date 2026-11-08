# Kontrak AI (Computer Vision + LLM)

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
| `ringkasanAturan(statistik)` | Berbasis aturan | keluaran `api.statistik()` | string (sinkron) | **Dasbor**: tampil seketika |
| `ringkasDasbor(statistik)` | **LLM (Groq, lewat server)** | keluaran `api.statistik()` | `{ ringkasan, sumber: 'ai' \| 'template', model?, alasan? }` (tidak pernah melempar) | **Dasbor**: tombol "Buat ringkasan AI" |
| `pemanasan()` | | | | memuat model vision lebih awal |
| `progresAI()` / `onProgresAI(fn)` | | callback | `{ vision }`: `{ persen, mbTerunduh, mbTotal, selesai } \| null` (dijumlahkan dari semua file model) | indikator unduhan "Mengunduh … 21 / 90 MB" (`components/AI.jsx`) |

Konstanta: `AMBANG_SARAN = 0.6`, `AMBANG_DETAIL_KEDUA = 0.25`, `BATAS_WAKTU_MS = 120 s` (sudah termasuk unduhan pertama), flag `VITE_FEATURE_AI` (`false` ⇒ vision `null`).

### LLM: ringkasan dasbor lewat Groq (server)

- **Alur:** Dasbor menampilkan ringkasan berbasis aturan (`ringkasanAturan`) seketika. Tombol "Buat ringkasan AI" memanggil `ringkasDasbor(stat)` ⇒ `POST {VITE_AI_URL atau VITE_API_URL}/ai/ringkasan-dasbor` ⇒ server memanggil Groq. Tombol hanya muncul bila URL itu diisi (`LLM_TERSEDIA`).
- **Model:** `aktif.llm` di `ml/models.json` = `groq-gpt-oss-20b-v1` (`openai/gpt-oss-20b`). Dipilih dari 3 kandidat lewat `ml/eval-llm.js`: lolos 10/10, ±660 token & ±0,6 detik per ringkasan ([laporan](../ml/reports/ringkasan-groq-gpt-oss-20b-v1.md)).
- **Klien hanya mengirim angka.** `bahanDasbor(stat)` (`@civicpulse/core`) berisi total, persen, median, dan **id** wilayah. Server memvalidasi ketat (`validasiBahanDasbor`: angka dalam rentang, id harus wilayah resmi) lalu menyusun fakta sendiri (`faktaDasbor`, kode yang sama dengan frontend). Tidak ada teks bebas dari klien ⇒ tidak bisa dipakai sebagai chatbot gratis atau untuk prompt injection.
- **Penjaga biaya** (`apps/api/src/ai/penjaga.js`): batas per IP (`AI_BATAS_PER_MENIT`, bawaan 5/menit ⇒ 429), cache bersama per fakta (`AI_CACHE_MENIT`, bawaan 15; permintaan kembar digabung), plafon token harian (`AI_BATAS_TOKEN_HARIAN`, bawaan 150.000, di bawah kuota gratis Groq), body ≤ 2 KB, `max_completion_tokens` 600, batas waktu 15 detik. Akun Groq **tanpa kartu kredit** ⇒ kemungkinan terburuk hanya kuota habis, tidak ada tagihan.
- **Pengaman keluaran** (`keluaranAman`, `@civicpulse/core`): angka (dan satuan %) harus ada di fakta, dan teks tidak boleh rusak/berulang. Bila gagal ⇒ `ringkasan: null` ⇒ frontend menampilkan ringkasan berbasis aturan.
- **Kunci:** `GROQ_API_KEY` hanya di `.env` server / Vercel, **tidak pernah** berawalan `VITE_`. Diuji: kunci tidak ada di hasil build frontend.
- **Coba sendiri:** `npm run ai:llm` (satu ringkasan dari data demo), `npm run ai:eval-llm` (evaluasi 10 statistik).

> Riwayat: LLM lokal di browser (Qwen2.5-0.5B) dihapus 2026-11-08 karena terlalu berat (unduhan ±400 MB, ±1 menit/ringkasan) dan jalur WebGPU bisa menghasilkan teks rusak. Evaluasinya tetap di `ml/reports/ringkasan-qwen2.5-0.5b-v2.*`.

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
