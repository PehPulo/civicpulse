# Tentang CivicPulse

> Dokumen ini menjelaskan **apa yang kita bangun dan kenapa**, dari yang paling umum sampai detail.
> Bacaan wajib untuk semua anggota tim sebelum mengerjakan apa pun, dan bahan dasar untuk proposal, video, dan pitching.

---

## 1. Dalam satu kalimat

**CivicPulse adalah website pelaporan masalah lingkungan oleh warga (jalan rusak, banjir, got mampet) yang otomatis menilai laporan mana yang paling mendesak berdasarkan data resmi pemerintah, dan baru menyatakan masalah "selesai" setelah dibuktikan oleh warga sekitar.**

Slogan: *Lapor Berkonteks. Setiap laporan warga punya konteks, prioritas yang bisa dijelaskan, dan bukti penyelesaian dari warga sendiri.*

---

## 2. Lombanya

| | |
| :-- | :-- |
| Kompetisi | **MIA 2026** (Multimedia In Action), UPN Veteran Jakarta, tingkat nasional |
| Cabang | **Web In Action (WIA)**: membangun website yang benar-benar berfungsi |
| Tema | *Designing Digital Futures: Powering Public Transparency* (website yang membuat data & layanan publik lebih transparan dan bisa dipercaya) |
| Subtema kita | **Civic Reporting & Accountability** (utama) + **Data-Driven Decision Support** (pendukung) |
| Tenggat | Final Submission **11 Nov 2026** · 10 finalis diumumkan 21 Nov · Pitching onsite **28 Nov 2026** |

**Kriteria nilai babak penyisihan:** Fungsionalitas 25% · Orisinalitas 20% · Desain 20% · Konten & Informasi 20% · Kesesuaian Tema 15%.

---

## 3. Masalah yang kita selesaikan

Bayangkan seorang petugas dinas menerima 200 laporan warga per minggu. Semuanya berupa teks dan foto. **Mana yang harus dikerjakan duluan?**

| # | Masalah di lapangan | Akibatnya |
| :-: | :-- | :-- |
| 1 | Laporan masuk **tanpa konteks**. Petugas tidak tahu apakah lokasinya rawan banjir atau tidak | Semua terlihat sama penting |
| 2 | Yang ditangani duluan biasanya yang **paling ramai/viral** | Prioritas mengikuti popularitas, bukan risiko |
| 3 | Wilayah **miskin dan rawan bencana justru jarang melapor** (sibuk, kurang akses digital, sudah pasrah) | Yang paling membutuhkan malah paling terabaikan |
| 4 | Status "selesai" **cukup diklaim** instansi | Warga tidak punya cara membuktikan masalahnya benar-benar beres |

---

## 4. Solusi kita

```
 1. Warga lapor     2. Diperkaya data     3. Skor prioritas     4. Instansi        5. Warga sekitar
    foto + lokasi ─►   publik resmi    ─►    + alasannya    ─►    menangani   ─►    membuktikan    ─► ✅ SELESAI
                       (BNPB, BPS)           (0–100)              & klaim           (3 foto)
```

### Contoh nyata

> **Bu Ani** di Dayeuhkolot memotret got depan pasar yang tersumbat sampah dan menandai lokasinya di peta.
>
> CivicPulse otomatis menambahkan:
> - Dayeuhkolot **berisiko banjir tinggi** (data IRBI, BNPB)
> - Tercatat **6 kejadian banjir dalam 5 tahun** (data DIBI, BNPB)
> - **6,4% penduduk** Kab. Bandung tergolong miskin (data BPS)
> - **4 warga lain** melaporkan hal serupa di sekitar situ
>
> Hasilnya: **Prioritas Tinggi, 73/100**, beserta kalimat alasan yang bisa dibaca siapa saja.
>
> Dinas mengeruk got itu lalu mengklaim "selesai". Statusnya **belum** hijau. Baru setelah **3 warga sekitar** mengirim foto terbaru dari lokasi yang menunjukkan got sudah bersih, status berubah menjadi **Terverifikasi Warga**. Kalau mayoritas bilang belum beres, laporan **dibuka ulang** secara otomatis.

---

## 5. Siapa penggunanya?

| Pengguna | Yang mereka lakukan | Yang mereka dapat |
| :-- | :-- | :-- |
| **Warga** | Melapor, menekan "+1 saya juga mengalami", memverifikasi penyelesaian | Laporan cepat (< 1 menit), tahu laporannya diurus, ikut mengawasi |
| **Petugas instansi** (Dinas PUTR, BPBD) | Melihat antrean yang sudah diurutkan risiko, memperbarui status, menulis tanggapan | Urutan kerja yang bisa dipertanggungjawabkan |
| **Pembuat kebijakan / publik** (Bappeda, DPRD, jurnalis) | Membuka dasbor akuntabilitas | Tahu wilayah mana yang rawan tapi terabaikan |

Warga **tidak perlu login** dan **tidak diminta NIK, nama, atau nomor HP**.

---

## 6. Fitur

| Fitur | Penjelasan sederhana |
| :-- | :-- |
| **Lapor Cepat** | 3 langkah: foto (AI mengenali jenis masalah) → tandai lokasi (lihat perkiraan skor & laporan serupa di dekatmu) → deskripsi yang sudah didraf AI dari foto, tinggal dilengkapi. Kecamatan terdeteksi otomatis |
| **Skor Prioritas yang Bisa Dijelaskan** | Angka 0–100 + kalimat "kenapa" + rincian kontribusi tiap faktor. Rumusnya dipublikasikan |
| **+1 Saya Juga Mengalami** | Warga lain bisa mendukung laporan yang sama, dan skornya ikut naik |
| **Linimasa Publik** | Siapa pun bisa melacak: Diterima → Diproses → Klaim Selesai → Terverifikasi / Dibuka Ulang |
| **Verifikasi Warga** | Foto harus diambil ≤ 200 m dari lokasi, setelah tanggal klaim, bukan oleh pelapor, 1 kali per orang |
| **Peta Laporan** | Sebaran laporan, warna sesuai prioritas, bisa difilter |
| **Dasbor Akuntabilitas** | Statistik penanganan, daftar wilayah "Perlu Perhatian", dan **Wilayah Senyap** |
| **Mode Instansi** | Antrean kerja petugas, ubah status, tulis tanggapan publik |
| **Metodologi** | Rumus, sumber data, dan batasan data dibuka apa adanya |
| **AI Pembantu** | Menyarankan kategori dari foto & menandai foto verifikasi yang meragukan |

---

## 7. Rumus skor prioritas

```
Skor = 35% × Risiko bencana wilayah    (IRBI, BNPB)
     + 25% × Riwayat kejadian 5 tahun  (DIBI, BNPB)
     + 20% × Tingkat kemiskinan        (BPS)
     + 20% × Jumlah warga yang melapor hal serupa (radius 500 m, 30 hari)

Tinggi ≥ 70 · Sedang 40–69 · Rendah < 40
```

Kenapa ada faktor kemiskinan? Supaya wilayah miskin yang warganya jarang melapor **tidak kalah** oleh wilayah yang paling ramai. Detail: [SCORING.md](SCORING.md).

---

## 8. Apa yang membuat kita berbeda?

Aplikasi pengaduan yang sudah ada (mis. LAPOR!/SP4N, Qlue) umumnya **menampung dan meneruskan** laporan. CivicPulse menambahkan tiga hal:

1. **Konteks data resmi di setiap laporan.** Prioritas ditentukan oleh risiko nyata, bukan oleh siapa yang paling ramai.
2. **"Selesai" dibuktikan warga, bukan diklaim instansi.** Instansi secara teknis **tidak bisa** menandai laporannya sendiri sebagai terverifikasi.
3. **Wilayah Senyap.** Dasbor menunjukkan wilayah yang *seharusnya* banyak laporan menurut data risiko, tetapi warganya diam. Ini justru wilayah yang paling perlu didatangi.

Ditambah prinsip: **AI membantu, bukan memutuskan.** Keputusan publik harus bisa diaudit, jadi skor tetap memakai rumus terbuka.

---

## 9. Data yang dipakai

| Data | Dari | Untuk |
| :-- | :-- | :-- |
| Indeks Risiko Bencana Indonesia (IRBI) | BNPB | Seberapa rawan wilayahnya |
| Data & Informasi Bencana Indonesia (DIBI) | BNPB | Seberapa sering bencana terjadi |
| Persentase penduduk miskin kab/kota | BPS | Seberapa rentan warganya |

Wilayah percontohan: **8 kecamatan di Bandung Raya** (Dayeuhkolot, Baleendah, Bojongsoang, Lembang, Cisarua, Coblong, Sukajadi, Cimahi Selatan).
⚠️ Saat ini angkanya masih **data ilustrasi** (ditandai di layar). Ezra sedang menggantinya dengan data asli. Detail: [DATA.md](DATA.md).

---

## 10. Bagaimana AI-nya bekerja?

- **Computer vision (CLIP)** berjalan **langsung di browser**: gratis, tanpa API key, foto tidak dikirim ke perusahaan AI mana pun.
- Dua tugas: (1) menebak kategori dari foto laporan ("Sepertinya Drainase, 87%"), (2) mengecek foto verifikasi ("got terlihat masih tersumbat?").
- AI **hanya memberi saran dan tanda**, tidak mengubah skor atau status. Kalau AI gagal atau lambat, aplikasi tetap jalan normal.
- **LLM (Qwen2.5-0.5B)** juga berjalan di browser untuk menulis ringkasan dasbor bagi pembuat kebijakan. Setiap angka yang ditulis AI dicek otomatis; kalau ada angka karangan, ringkasan AI ditolak dan diganti ringkasan berbasis aturan.

Detail: [AI.md](AI.md).

---

## 11. Teknologi (versi singkat)

| Bagian | Teknologi |
| :-- | :-- |
| Website | React + Vite + Tailwind CSS, peta Leaflet + OpenStreetMap |
| Aturan bisnis | `packages/core`: dipakai bersama oleh website & server, diuji otomatis |
| Server | Hono di Vercel Functions, database & penyimpanan foto Supabase |
| AI | Transformers.js + CLIP di Web Worker browser |
| Kualitas | ESLint, Prettier, Vitest, GitHub Actions CI, tes kontrak Postman |

Website bisa berjalan **tanpa server dan tanpa internet** (mode lokal) sebagai cadangan saat demo final. Detail: [ARCHITECTURE.md](ARCHITECTURE.md).

---

## 12. Status saat ini (7 Nov 2026)

| Sudah jalan ✅ | Sedang dikerjakan 🔜 |
| :-- | :-- |
| Landing page | Peta, Metodologi, Lacak (Ezra) |
| AI computer vision (CLIP) + LLM (Qwen2.5) di browser | |
| Dasbor: KPI, Wilayah Senyap, Perlu Perhatian, ringkasan AI | |
| Form Lapor + hasil skor | Mode Instansi: masuk, antrean, tindak lanjut, kinerja (Yance) |
| Detail laporan, +1, verifikasi warga, linimasa | Grafik dasbor, peta kesenjangan (Ezra) |
| Aturan bisnis lengkap + 37 tes otomatis | Backend + database (Albert) |
| 38 laporan demo, mode offline | Data asli IRBI/DIBI/BPS & evaluasi model AI (Ezra) |
| Kontrak teknis lengkap di `docs/` | |

---

## 13. Tim Peh Pulo

| Nama | Peran |
| :-- | :-- |
| **Christama Ezra Yudianto** | Project Manager · System Integrator · Software Architect · AI Engineer & MLOps · Frontend Lead |
| **Albert Juniawan Pasundan** | Backend · DevOps |
| **Yance** | Ketua Tim · Kontributor Frontend |

Pembagian tugas & cara kerja: [CONTRIBUTING.md](../CONTRIBUTING.md).

---

## 14. Pertanyaan yang kemungkinan ditanya juri

| Pertanyaan | Jawaban singkat |
| :-- | :-- |
| *Apa bedanya dengan LAPOR!?* | LAPOR! meneruskan laporan. Kami memberi konteks data, mengurutkan berdasarkan risiko, dan mewajibkan bukti dari warga sebelum laporan dinyatakan selesai. |
| *Kenapa bobotnya 35/25/20/20?* | Risiko dan riwayat bencana adalah dasar paling objektif. Kemiskinan dan laporan serupa menyeimbangkan sisi sosial. Rumusnya berversi dan terbuka untuk dikalibrasi bersama instansi. |
| *Bagaimana kalau warga curang saat verifikasi?* | Foto harus dari radius 200 m, setelah klaim, satu per perangkat, bukan pelapor sendiri, minimal 3 orang. AI juga menandai foto yang meragukan. |
| *Bagaimana kalau warga di wilayah miskin tidak melapor sama sekali?* | Fitur Wilayah Senyap menampilkan wilayah rawan yang laporannya sedikit, supaya pemerintah datang proaktif. |
| *Kenapa tidak pakai AI untuk menentukan prioritas?* | Keputusan publik harus bisa diaudit warga. AI kami hanya membantu, sedangkan rumusnya terbuka. |
| *Datanya per kecamatan?* | IRBI, DIBI, dan BPS tersedia per kabupaten/kota. Batasan ini kami tulis terbuka di halaman Metodologi. |
| *Bisa dipakai kota lain?* | Bisa. Cukup tambahkan data wilayah baru di `data/`. Rumus dan aplikasinya tidak berubah. |

---

## 15. Kamus istilah

| Istilah | Arti |
| :-- | :-- |
| **Skor prioritas** | Angka 0–100 tingkat kemendesakan laporan |
| **Klaim selesai** | Instansi menyatakan sudah menangani, tapi **belum** terbukti |
| **Terverifikasi** | Minimal 3 warga sekitar membuktikan lewat foto bahwa masalah beres |
| **Dibuka ulang** | Warga menyatakan belum beres, atau 14 hari tanpa bukti, jadi laporan kembali ke instansi |
| **Wilayah Senyap** | Wilayah risiko tinggi yang laporannya jauh di bawah rata-rata |
| **Perlu Perhatian** | Wilayah dengan kombinasi risiko tinggi, laporan menumpuk, dan penanganan lambat |
| **Mode lokal** | Website berjalan tanpa server, data disimpan di browser (untuk demo & cadangan) |
| **Kontrak** | Dokumen di `docs/` yang menjadi aturan main teknis tim |
