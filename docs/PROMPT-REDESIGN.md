# Prompt Redesign UI/UX — CivicPulse

> Salin semua isi di bawah garis ke tools AI UI/UX (v0, Lovable, Google Stitch, Figma Make, Uizard, dll).
> Kalau tools-nya membatasi panjang prompt, kirim bagian **Konteks + Gaya + satu halaman** per sesi.

---

## Peran

Kamu adalah senior product designer yang ahli di civic-tech dan layanan publik Indonesia. Redesign UI/UX aplikasi web **CivicPulse**. Hasilnya harus modern, tepercaya, mudah dipakai warga awam di HP murah, dan tetap terlihat "serius" seperti produk pemerintahan digital yang baik (setara GOV.UK, Singapore LifeSG, atau Linear untuk kerapian), **bukan** template startup yang generik.

## Arah desain: Government UI

Gunakan pendekatan **Government / Public Service UI**: desain layanan publik digital yang mengutamakan kejelasan, aksesibilitas, dan kepercayaan dibanding gaya. Rujuk prinsip dan pola dari:

- **GOV.UK Design System** (Inggris): satu tugas per halaman, bahasa sederhana, tombol hijau tegas, label di atas field, pesan error yang jelas di atas form, pola "Start page", "Question pages", dan "Confirmation page" berisi nomor referensi besar.
- **U.S. Web Design System (USWDS)**: grid rapi, step indicator, alert, summary box, dan banner identitas resmi.
- **Singapore Government Design System / LifeSG** dan **Australia DTA**: modern, ramah, mobile-first.
- **SPBE dan layanan digital pemerintah Indonesia** (mis. INApas, SP4N-LAPOR!, PeduliLindungi/SATUSEHAT): konteks lokal, bahasa Indonesia baku tetapi hangat.

Ciri yang diharapkan:
- Hierarki tipografi kuat, kontras tinggi, sedikit dekorasi, dan whitespace lega.
- Form satu kolom: label jelas, hint text, validasi inline, dan ringkasan error.
- **Halaman konfirmasi** bergaya pemerintahan: panel hijau berisi kode lacak besar.
- Komponen *phase banner* kecil, misalnya "Purwarupa: data ilustrasi", di bawah header.
- *Breadcrumb* di halaman dalam, *skip link* "Langsung ke konten", dan fokus keyboard yang terlihat tebal.
- Tetap terasa sebagai **layanan warga yang modern**, bukan portal dinas yang kaku dan penuh banner. Jangan meniru logo, lambang Garuda, atau branding instansi mana pun; CivicPulse adalah inisiatif warga (bukan situs resmi pemerintah), jadi jangan ada klaim "situs resmi".

## Konteks produk

CivicPulse adalah platform pelaporan masalah publik berkonteks untuk Kabupaten Bandung (lomba MIA 2026 Web In Action, tema Smart City).

- **Masalah yang diselesaikan:** laporan warga sering tenggelam, tidak diprioritaskan, dan "ditutup" instansi padahal belum beres.
- **Pembeda utama:**
  1. **Skor prioritas transparan.** Setiap laporan diberi skor 0–100 dari dampak, jumlah warga terdampak (+1), kerentanan wilayah (data risiko bencana BNPB IRBI/DIBI dan kepadatan penduduk BPS), dan lama menunggu. Level: Tinggi / Sedang / Rendah.
  2. **Verifikasi warga.** Instansi hanya bisa *mengklaim* selesai. Status baru menjadi "Terverifikasi" setelah warga sekitar mengonfirmasi. Kalau warga menolak, laporan **dibuka ulang**.
  3. **AI di perangkat (on-device).** Dari foto, AI menebak kategori dan mendraf deskripsi; datanya tidak dikirim ke server. Saat pertama kali, model diunduh (ada progress bar).
  4. **Dasbor kesenjangan.** Menunjukkan wilayah yang rentan tapi jarang melapor ("Wilayah Senyap").
- **Tanpa akun / login** untuk warga. Laporan dilacak dengan **kode lacak** format `CP-2026-0417` dan tersimpan otomatis di perangkat.
- **Bahasa UI:** Bahasa Indonesia yang santai tapi sopan (pakai "kamu"), singkat, tanpa jargon teknis.
- **Pengguna:** warga umum (banyak memakai HP Android kelas bawah, sinyal lemah), juri lomba, dan petugas instansi (sisi admin terpisah, **tidak perlu didesain di sini**).

## Gaya visual (pertahankan identitas, tingkatkan kualitas)

- **Font:** Plus Jakarta Sans (400–800). Judul tebal dengan tracking rapat, angka memakai `tabular-nums`.
- **Warna token (Tailwind):**
  - `ink` #0f1f2e (teks utama), `ink-soft` #47586a, `ink-faint` #8494a5
  - `brand` (hijau teal): 50 #eaf6f4, 100 #cdebe6, 500 #14806f, 600 #0f6b5c (tombol utama), 700 #0b5449, 900 #06302a
  - `paper` #f7f5f0 (latar halaman, krem hangat), `line` #e4e1d8 (garis/border), kartu putih
  - **Prioritas (dipakai dengan teks/ikon, jangan hanya warna):** Tinggi #c2410c, Sedang #b7791f, Rendah #3f7d4e
  - **Grafik:** kategori biru #2a78d6 dan aqua #1baf7a; skala kesenjangan satu hue biru #c6dbf5 → #86b2ea → #2a78d6 → #174a8c
- **Bentuk:** radius kartu 16px, tombol 12px, border 1px tipis, tanpa bayangan berat. Ikon dari lucide.
- **Nuansa:** tenang, jujur, berbasis data. Jangan pakai gradien neon, glassmorphism berlebihan, ilustrasi 3D generik, atau emoji.
- Boleh mengusulkan penyegaran palet, tetapi tetap hijau teal + krem dan kontras teks minimal **WCAG AA**.

## Aturan wajib

1. **Mobile-first di 360px**: tidak boleh ada scroll horizontal, target sentuh minimal 44×44px, dan teks isi minimal 14px.
2. Tidak ada tombol atau tautan login instansi/admin di UI publik.
3. Setiap status dan prioritas memakai **label teks + ikon**, bukan warna saja (aman untuk buta warna).
4. Sediakan state **loading (skeleton), kosong, dan error** di setiap halaman yang memuat data.
5. Data contoh diberi lencana kecil "Data ilustrasi".
6. Grafik: satu sumbu Y saja, legenda untuk ≥2 seri, tooltip saat hover/tap, dan opsi tampilan tabel.
7. Navigasi publik: **Peta Laporan · Dasbor Akuntabilitas · Metodologi · Lacak**, ditambah tombol utama **"Lapor Sekarang"**. Di mobile memakai menu hamburger; pertimbangkan *bottom bar* untuk Lapor dan Lacak.
8. Dukung mode gelap jika memungkinkan (opsional, nilai tambah).

## Alur status laporan

`Diterima → Diproses → Klaim selesai (menunggu verifikasi warga) → Terverifikasi warga`
Cabang: `Dibuka ulang` (warga menolak klaim selesai, ditampilkan dengan aksen merah-oranye).

## Halaman yang perlu diredesign

### 1. Beranda `/`
- **Hero:** janji utama "Laporanmu tidak berhenti di kotak masuk" (boleh diperbaiki), dengan satu CTA "Lapor Sekarang" dan CTA sekunder "Lihat peta".
- **Angka langsung:** total laporan, terverifikasi warga, median waktu tindak lanjut (hari), dan jumlah wilayah senyap.
- **Cara kerja 3–4 langkah:** Foto → AI bantu isi → Skor prioritas → Diverifikasi warga.
- **Bagian AI on-device** (privasi: foto tidak keluar dari HP).
- **Linimasa contoh** laporan nyata `CP-2026-0417` dari diterima sampai terverifikasi.
- **Sumber data:** BNPB IRBI/DIBI dan BPS, beserta periodenya.
- **Footer.**

### 2. Lapor `/lapor` (paling penting, 3 langkah dengan stepper)
- **Langkah 1 — Foto & jenis masalah:** unggah/ambil foto. AI menebak kategori dengan tingkat keyakinan (misal "Jalan rusak · yakin 82%") dan warga bisa mengganti manual. Saat model pertama kali diunduh, tampilkan progress "Menyiapkan AI di perangkatmu (sekali saja) · 45 MB / 120 MB" yang ramah, tidak menakutkan, dan bisa dilewati.
- **Langkah 2 — Lokasi & deskripsi:** peta (Leaflet) dengan pin yang bisa digeser, tombol "Pakai lokasiku", dan pilih kecamatan. Deskripsi **terisi otomatis dari analisis foto** (draf bisa diedit, beri label "Draf dari AI"). Tampilkan **laporan serupa di dekatmu** dengan tombol "+1, saya juga mengalami" untuk mencegah duplikat.
- **Langkah 3 — Pratinjau & kirim:** ringkasan beserta **pratinjau skor prioritas** dan rinciannya (dampak, warga terdampak, kerentanan wilayah, lama menunggu).
- **Hasil:** halaman sukses dengan **kode lacak besar**, tombol salin, bagikan ke WhatsApp, dan "Lacak laporan".

### 3. Detail laporan `/laporan/:kode`
- Foto, judul, kategori, kecamatan, lencana prioritas + skor, jumlah dukungan (+1), dan tombol "Saya juga mengalami".
- **Rincian skor** yang bisa dibuka ("Kenapa skornya 78?").
- **Linimasa status** vertikal dengan catatan instansi dan foto bukti.
- Saat status **Klaim selesai**: kartu verifikasi yang menonjol, "Apakah benar sudah beres?" dengan pilihan **Sudah beres / Belum beres** serta unggah foto bukti opsional.

### 4. Peta Laporan `/peta`
- Peta penuh dengan titik berwarna sesuai prioritas. Laporan terverifikasi ditandai dengan cincin kosong.
- Filter satu baris: jenis masalah, status, kecamatan, dan reset. Filter tersimpan di URL.
- Panel daftar laporan diurutkan dari prioritas tertinggi. Di desktop panel ada di samping; di mobile menjadi *bottom sheet* yang bisa ditarik.
- Popup titik: kode, kategori, judul, kecamatan, lencana prioritas, status, jumlah +1, dan tautan "Lihat detail & dukung".
- Legenda prioritas.

### 5. Dasbor Akuntabilitas `/dasbor`
- **Baris KPI:** laporan masuk, persentase terverifikasi warga, median hari tindak lanjut, dan persentase dibuka ulang.
- **Ringkasan AI** (paragraf singkat yang dibuat model, diberi label "Ringkasan AI").
- **Grafik mingguan 8 minggu:** batang berkelompok untuk masuk dan terverifikasi.
- **Peta kesenjangan:** lingkaran per kecamatan dengan warna skor kesenjangan. "Wilayah Senyap" ditandai garis putus-putus.
- **Peringkat "Perlu Perhatian":** kecamatan dengan kesenjangan terbesar.
- **Daftar Wilayah Senyap:** rentan tetapi jarang melapor, dengan ajakan menjangkau wilayah tersebut.

### 6. Metodologi `/metodologi`
- Penjelasan rumus skor prioritas beserta bobotnya.
- **Kalkulator interaktif** "Coba hitung sendiri": slider untuk tiap faktor yang menampilkan skor dan level secara langsung.
- Aturan verifikasi warga, rumus kesenjangan, cara kerja AI (dan batasannya), serta sumber data.
- Gaya: seperti artikel dokumentasi yang enak dibaca, dengan daftar isi *sticky* di desktop.

### 7. Lacak `/lacak`
- Kolom besar "Punya kode lacak?" dengan validasi format `CP-TAHUN-NOMOR`.
- Bagian **"Dari perangkat ini"** dengan tab: Laporanku · Yang ku-+1 · Yang kuverifikasi (masing-masing dengan jumlah).
- Kartu laporan dengan **progress bar 4 tahap status**. Status dibuka ulang ditandai oranye.

### 8. 404
Ramah, menampilkan alamat yang dicari, dan menyediakan tautan ke Beranda, Peta, dan Lapor.

## Yang saya minta sebagai output

1. **Konsep visual singkat:** 3 kata kunci mood, palet final (hex), skala tipografi, spacing, dan radius.
2. **Desain setiap halaman di atas** dalam versi **mobile (360px) dan desktop (1280px)**.
3. **Komponen inti** (design system mini): tombol, input, select, kartu laporan, lencana prioritas, chip status, stepper, linimasa, kartu KPI, toast, skeleton, empty state, dan bottom sheet.
4. Jika menghasilkan kode: **React + Tailwind CSS**, ikon `lucide-react`, peta `react-leaflet`, tanpa library UI berat. Nama kelas memakai token warna di atas (`bg-paper`, `text-ink`, `bg-brand-600`, `text-tinggi`, dll.) supaya mudah dipindahkan ke kode yang sudah ada.
5. Catatan singkat **alasan UX** untuk tiap keputusan besar (kenapa begini, masalah apa yang diselesaikan).

Prioritas kualitas, berurutan: **(1) alur Lapor yang cepat (<1 menit), (2) rasa tepercaya dan transparan, (3) keterbacaan di HP, (4) estetika.**
