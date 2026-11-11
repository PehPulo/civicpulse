<div align="center">

# 🛰️ CivicPulse: Lapor Berkonteks

**Setiap laporan warga punya konteks, prioritas yang bisa dijelaskan, dan bukti penyelesaian dari warga sendiri.**

### 🌐 [civicpulse.my.id](https://civicpulse.my.id)

Web In Action, Multimedia In Action 2026 · Tema *Designing Digital Futures: Powering Public Transparency*
Subtema **Civic Reporting & Accountability**, didukung **Data-Driven Decision Support**

[![CI](https://github.com/PehPulo/civicpulse/actions/workflows/ci.yml/badge.svg)](https://github.com/PehPulo/civicpulse/actions/workflows/ci.yml)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Hono](https://img.shields.io/badge/Hono-API-E36002?logo=hono&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![CLIP](https://img.shields.io/badge/Computer_Vision-CLIP-0a3d24)
![Groq](https://img.shields.io/badge/LLM-Groq_gpt--oss--20b-F55036)
![License](https://img.shields.io/badge/license-MIT-green)

![Beranda CivicPulse](submission/screenshots/alur/01-beranda.png)

</div>

---

## Masalah yang kami jawab

Pagi ini dinas menerima dua laporan. Jalan berlubang di kompleks ramai, didukung lima puluh orang. Saluran tersumbat di
wilayah langganan banjir, dilaporkan satu orang. Regu cuma satu. Mana duluan?

Aplikasi pelaporan biasa hanya melihat foto dan jumlah dukungan. Status "selesai" juga cukup diklik petugas, tanpa bukti
dari warga. **CivicPulse** menjawabnya dengan tiga hal:

| | Prinsip | Caranya |
| :-: | :-- | :-- |
| 1 | **Konteks wilayah** | Setiap laporan otomatis diperkaya data publik resmi: risiko bencana (IRBI BNPB), riwayat kejadian (DIBI BNPB), dan kemiskinan (BPS) |
| 2 | **Prioritas yang bisa dijelaskan** | Skor 0–100 dari rumus terbuka, lengkap dengan rincian poin tiap faktor dan kalimat "kenapa" |
| 3 | **Selesai dibuktikan warga** | Klaim selesai dari instansi baru sah setelah ≥ 3 warga sekitar memverifikasi dengan foto berlokasi (radius 200 m) |

### Nilai jual untuk Web In Action

CivicPulse bukan hanya halaman peta atau mockup. Ini alur layanan yang dapat dicoba dari dua sisi: warga mengirim dan
melacak laporan tanpa akun, sementara petugas bekerja lewat panel kab/kota, provinsi, dan pusat. Data, rumus, status,
dan cara verifikasinya dijelaskan agar keputusan yang dihasilkan dapat diperiksa.

| Aspek penilaian penyisihan WIA | Bobot | Bukti di CivicPulse |
| :-- | --: | :-- |
| **Fungsionalitas** | 25% | Form laporan, kode pelacakan, dukungan warga, peta, dasbor, panel kerja berjenjang, dan verifikasi penyelesaian. |
| **Orisinalitas** | 20% | Skor menggabungkan risiko serta kerentanan sosial; fitur **Wilayah Senyap** menyorot tempat berisiko tinggi dengan sedikit laporan. |
| **Desain** | 20% | Alur berorientasi ponsel, peta dan dashboard, status terbaca, identitas visual sendiri, serta screenshot untuk desktop dan HP. |
| **Konten dan informasi** | 20% | Rumus, sumber data, periode, batasan, dokumentasi arsitektur, API, AI, dan evaluasi model dipublikasikan. |
| **Kesesuaian tema** | 15% | Pelaporan dan bukti tindak lanjut memperkuat transparansi layanan publik; data wilayah membantu keputusan berbasis bukti. |

Poin pembeda utamanya adalah rantai akuntabilitas: **laporan → konteks → prioritas → tindak lanjut → bukti warga**. AI membantu
memahami foto dan menyusun bahasa, tetapi tidak mengambil alih keputusan publik.

## 🔑 Coba sekarang

**Situs:** [https://civicpulse.my.id](https://civicpulse.my.id) · **Panel instansi:** [/instansi/masuk](https://civicpulse.my.id/instansi/masuk)

Semua akun admin memakai password **`civicpulse2026`**.

| Peran | Username contoh | Bisa apa |
| :-- | :-- | :-- |
| Admin Kab/Kota | `admin.kota-bandung` | Tangani laporan: proses, klaim selesai, tanggapan publik, rencana kerja regu |
| Admin Provinsi | `admin.jawa-barat` | Awasi kab/kota, teruskan arahan pusat, peringkat & kerentanan |
| Admin Pusat | `admin.pusat` | Pantau 34 provinsi, kirim arahan ke provinsi |

Nama wilayah ditulis huruf kecil dengan tanda hubung, misalnya `admin.kota-malang` atau `admin.jawa-timur`.
Laporan contoh untuk mencoba verifikasi warga: [`/laporan/CP-2026-0417`](https://civicpulse.my.id/laporan/CP-2026-0417).

## Dari kirim laporan sampai terbukti selesai

```text
Warga (tanpa akun)
  └─ foto + titik lokasi + keterangan
       ↓
Web React → API Hono → validasi & aturan di packages/core
                       ├─ konteks wilayah (data/processed: BNPB, BPS, batas wilayah)
                       ├─ laporan serupa (kategori, 500 m, 30 hari)
                       └─ skor prioritas + alasan + kode laporan
       ↓
Petugas kab/kota: diterima → diproses → klaim selesai
       ↓
Warga sekitar mengirim bukti foto → sistem mengecek syarat → terverifikasi / dibuka ulang
```

### 1. Warga mengisi laporan

1. Warga membuka **Lapor** tanpa mendaftar. Identitas publik tidak meminta nama, NIK, nomor HP, atau email. Untuk membatasi
   dukungan dan verifikasi berulang, aplikasi menggunakan ID perangkat acak.
2. Warga mengambil atau memilih foto. Browser mengecilkan foto hingga paling panjang 960 piksel, mengubahnya ke JPEG,
   dan membuang EXIF sebelum upload. CLIP dapat menyarankan kategori; warga tetap bisa menggantinya.
3. Warga menentukan lokasi lewat GPS atau peta, lalu mengisi judul/deskripsi. CLIP dapat menyarankan detail kondisi;
   draf awal dibuat dari template agar tidak menambahkan fakta. Tombol **Rapikan dengan AI** adalah bantuan LLM terpisah
   yang dipanggil saat diminta, dan hasilnya masih bisa diedit warga.
4. Sebelum dikirim, form menampilkan lokasi, kategori, dan konteks/skor perkiraan jika tersedia. Warga meninjau kembali
   data lalu menekan **Kirim laporan**.

### 2. Server memvalidasi, memperkaya, dan memberi skor

Browser mengirim laporan ke API; server memvalidasi isi dan identitas perangkat. Aturan inti kemudian mencocokkan titik ke
wilayah terdekat, mengambil faktor konteks wilayah, menghitung pelapor unik lain dengan kategori sama dalam radius 500 m
dan 30 hari, lalu menghitung skor di server. Nilai skor buatan browser tidak dipercaya. Laporan yang sah disimpan dengan
status **Diterima** dan kode seperti `CP-2026-0417`; halaman hasil menunjukkan faktor penyumbang, alasan prioritas, dan
tautan untuk melacak laporan.

Screenshot alur: [form Lapor](submission/screenshots/alur/02-lapor.png), [hasil skor](submission/screenshots/alur/03-lapor-hasil-skor.png), [detail dan verifikasi](submission/screenshots/alur/04-detail-laporan.png), [lacak](submission/screenshots/alur/05-lacak.png), dan [form Lapor di HP](submission/screenshots/alur/10-lapor-hp.png).

### 3. Warga dan teman sekitar ikut memantau

- **Lacak:** kode laporan membuka detail dan linimasa status tanpa akun.
- **Dukung (+1):** warga lain menyatakan mengalami masalah serupa. Satu perangkat hanya dapat mendukung sekali per
  laporan dan pelapor tidak mendukung laporannya sendiri. Dukungan warga unik kategori sama di sekitar titik ikut
  menjadi faktor skor.
- **Peta dan dasbor:** laporan ditampilkan menurut lokasi/status/prioritas; statistik penanganan serta Wilayah Senyap
  membantu publik melihat masalah yang menumpuk atau kurang terlaporkan.

### 4. Instansi menindaklanjuti sesuai kewenangan

Admin kab/kota menangani laporan: **Diterima → Diproses → Klaim Selesai**, menulis tanggapan publik, dan dapat
menambahkan bukti. Provinsi dan pusat memantau kinerja wilayah di bawahnya serta mengirim arahan berjenjang; keduanya
tidak mengambil alih perubahan status laporan kab/kota. Setiap perubahan masuk ke linimasa.

### 5. Warga membuktikan penyelesaian

Status **Klaim Selesai** belum berarti masalah dinyatakan beres. Verifikasi harus dikirim setelah klaim, dari radius 200 m,
bukan oleh pelapor, dan satu kali per perangkat per siklus. Setelah minimal tiga verifikasi sah, status menjadi
**Terverifikasi Warga** bila suara “beres” lebih banyak; bila suara “belum” lebih banyak, laporan dibuka ulang. Jika
tidak cukup bukti selama 14 hari, sistem juga membuka ulang laporan. AI boleh menandai foto yang meragukan untuk ditinjau,
tetapi tidak membatalkan suara warga atau memutus status sendirian.

---

## 📸 Alur lengkap

### 1. Warga: melapor sampai membuktikan selesai

| Beranda | Lapor (3 langkah, AI membaca foto) |
| :-: | :-: |
| ![Beranda](submission/screenshots/alur/01-beranda.png) | ![Lapor](submission/screenshots/alur/02-lapor.png) |
| **Hasil: skor prioritas + alasannya** | **Detail laporan + verifikasi warga** |
| ![Hasil skor](submission/screenshots/alur/03-lapor-hasil-skor.png) | ![Detail](submission/screenshots/alur/04-detail-laporan.png) |
| **Lacak tanpa akun** | **Peta laporan** |
| ![Lacak](submission/screenshots/alur/05-lacak.png) | ![Peta](submission/screenshots/alur/06-peta.png) |
| **Dasbor akuntabilitas publik** | **Metodologi skor (interaktif)** |
| ![Dasbor](submission/screenshots/alur/07-dasbor.png) | ![Metodologi](submission/screenshots/alur/08-metodologi.png) |

<p align="center">
  <img src="submission/screenshots/alur/09-beranda-hp.png" width="240" alt="Beranda di HP">
  &nbsp;&nbsp;
  <img src="submission/screenshots/alur/10-lapor-hp.png" width="240" alt="Lapor di HP">
  <br><em>Dirancang untuk HP warga</em>
</p>

### 2. Admin Kab/Kota: menangani laporan

| Masuk panel instansi | Ringkasan |
| :-: | :-: |
| ![Masuk](submission/screenshots/alur/19-masuk-instansi.png) | ![Ringkasan](submission/screenshots/alur/20-kab-ringkasan.png) |
| **Antrean (urut skor & target waktu)** | **Tindak lanjut: ubah status, tanggapan, CCTV terdekat** |
| ![Antrean](submission/screenshots/alur/21-kab-antrean.png) | ![Tindak lanjut](submission/screenshots/alur/28-kab-tindak-lanjut.png) |
| **Peta tugas** | **Rencana kerja regu** |
| ![Peta tugas](submission/screenshots/alur/22-kab-peta.png) | ![Rencana](submission/screenshots/alur/23-kab-rencana.png) |
| **Arahan atasan** | **Estimasi anggaran** |
| ![Arahan](submission/screenshots/alur/24-kab-supervisi.png) | ![Anggaran](submission/screenshots/alur/25-kab-anggaran.png) |
| **Kinerja & target** | **Rekap & cetak** |
| ![Kinerja](submission/screenshots/alur/26-kab-kinerja.png) | ![Rekap](submission/screenshots/alur/27-kab-rekap.png) |

### 3. Admin Provinsi: mengawasi kab/kota

| Ringkasan provinsi | Pantau laporan |
| :-: | :-: |
| ![Ringkasan](submission/screenshots/alur/40-prov-ringkasan.png) | ![Pantau](submission/screenshots/alur/41-prov-antrean.png) |
| **Peta wilayah** | **Arahan dari pusat** |
| ![Peta](submission/screenshots/alur/42-prov-peta.png) | ![Arahan pusat](submission/screenshots/alur/43-prov-arahan-pusat.png) |
| **Arahan ke kab/kota** | **Admin kab/kota** |
| ![Arahan kab/kota](submission/screenshots/alur/44-prov-supervisi.png) | ![Admin](submission/screenshots/alur/45-prov-admin.png) |
| **Peringkat kab/kota** | **Kerentanan sosial** |
| ![Peringkat](submission/screenshots/alur/46-prov-peringkat.png) | ![Kerentanan](submission/screenshots/alur/47-prov-kerentanan.png) |
| **Kebutuhan anggaran** | **Kinerja provinsi** |
| ![Anggaran](submission/screenshots/alur/48-prov-anggaran.png) | ![Kinerja](submission/screenshots/alur/49-prov-kinerja.png) |

<p align="center"><img src="submission/screenshots/alur/50-prov-rekap.png" width="49%" alt="Rekap provinsi"><br><em>Rekap & cetak</em></p>

### 4. Admin Pusat: seluruh Indonesia dalam satu layar

| Ringkasan nasional | Pantau laporan |
| :-: | :-: |
| ![Ringkasan](submission/screenshots/alur/60-pusat-ringkasan.png) | ![Pantau](submission/screenshots/alur/61-pusat-antrean.png) |
| **Peta wilayah** | **Arahan ke provinsi** |
| ![Peta](submission/screenshots/alur/62-pusat-peta.png) | ![Arahan](submission/screenshots/alur/63-pusat-supervisi.png) |
| **Admin provinsi** | **Peringkat provinsi** |
| ![Admin](submission/screenshots/alur/64-pusat-admin.png) | ![Peringkat](submission/screenshots/alur/65-pusat-peringkat.png) |
| **Kerentanan sosial** | **Kebutuhan anggaran** |
| ![Kerentanan](submission/screenshots/alur/66-pusat-kerentanan.png) | ![Anggaran](submission/screenshots/alur/67-pusat-anggaran.png) |
| **Kinerja nasional** | **Rekap & cetak** |
| ![Kinerja](submission/screenshots/alur/68-pusat-kinerja.png) | ![Rekap](submission/screenshots/alur/69-pusat-rekap.png) |

### Screenshot full-page: dari bagian atas sampai bagian paling bawah

Galeri di atas mempertahankan screenshot seluruh alur warga dan panel kab/kota, provinsi, serta pusat. Set gambar berikut
adalah **tangkapan satu halaman penuh**—bukan hanya area yang terlihat tanpa scroll—untuk memeriksa halaman publik sampai
footer. Beranda mencakup halaman sepanjang 6.720 piksel di desktop dan 11.959 piksel di HP; klik baris untuk membuka
gambar dan menelusuri tiap bagiannya.

<details>
  <summary>Beranda penuh — desktop dan HP</summary>
  <p align="center"><img src="ss/01-beranda-desktop.png" width="820" alt="Screenshot full-page beranda desktop dari hero sampai footer"></p>
  <p align="center"><img src="ss/01-beranda-hp.png" width="390" alt="Screenshot full-page beranda versi HP dari atas sampai bawah"></p>
</details>

<details>
  <summary>Peta laporan penuh — desktop dan HP</summary>
  <p align="center"><img src="ss/02-peta-laporan-desktop.png" width="820" alt="Screenshot full-page peta laporan desktop"></p>
  <p align="center"><img src="ss/02-peta-laporan-hp.png" width="390" alt="Screenshot full-page peta laporan HP"></p>
</details>

<details>
  <summary>Dasbor akuntabilitas penuh — desktop dan HP</summary>
  <p align="center"><img src="ss/03-dasbor-akuntabilitas-desktop.png" width="820" alt="Screenshot full-page dasbor akuntabilitas desktop"></p>
  <p align="center"><img src="ss/03-dasbor-akuntabilitas-hp.png" width="390" alt="Screenshot full-page dasbor akuntabilitas HP"></p>
</details>

<details>
  <summary>Metodologi penuh — desktop dan HP</summary>
  <p align="center"><img src="ss/04-metodologi-desktop.png" width="820" alt="Screenshot full-page metodologi desktop"></p>
  <p align="center"><img src="ss/04-metodologi-hp.png" width="390" alt="Screenshot full-page metodologi HP"></p>
</details>

<details>
  <summary>Lacak laporan penuh — desktop dan HP</summary>
  <p align="center"><img src="ss/05-lacak-desktop.png" width="820" alt="Screenshot full-page lacak laporan desktop"></p>
  <p align="center"><img src="ss/05-lacak-hp.png" width="390" alt="Screenshot full-page lacak laporan HP"></p>
</details>

---

## 🤖 Peran AI: membantu, bukan memutuskan

Semua AI berjalan **lewat server CivicPulse**: HP warga tidak perlu mengunduh model, dan kunci API tidak pernah sampai
ke browser.

| Untuk | Fitur AI | Di mana |
| :-- | :-- | :-- |
| Warga | **Membaca foto**: computer vision (CLIP) menebak jenis masalah dan memeriksa foto bukti verifikasi | Lapor, Verifikasi |
| Warga | **Bantu tulis laporan**: merapikan judul & deskripsi tanpa menambah fakta | Lapor |
| Warga | **Tanya CivicPulse**: chat di pojok kanan bawah | Semua halaman warga |
| Warga | **Penjelasan skor** & **tips keselamatan** sesuai jenis bahaya | Detail laporan |
| Warga | **Ringkasan otomatis** kondisi laporan | Beranda, Peta, Dasbor |
| Petugas | **Saran tindakan** per laporan | Tindak lanjut |
| Petugas | **Catatan supervisi** wilayah | Peringkat (provinsi & pusat) |
| Petugas | **Narasi rekap & rencana kerja** siap salin ke dokumen dinas | Rekap, Rencana kerja |
| Petugas | **Asisten tanya-data** | Semua halaman instansi |

**Pengaman:**

- Skor prioritas dihitung rumus terbuka, bukan AI. Status selesai ditentukan verifikasi warga, bukan AI.
- AI hanya menulis dari fakta yang disusun server. Setiap angka di jawaban dicocokkan dengan data; angka karangan
  membuat jawaban dibuang dan diganti teks template.
- Cache, batas permintaan per IP, dan plafon token harian.

**Hasil evaluasi:** CLIP `clip-v2` top-1 **84,1%** dan top-3 **97,7%** pada 44 foto asli; verifikasi foto bukti
**76,2%** pada 63 foto ([laporan](ml/reports/clip-v2.md)). Ringkasan Groq lolos pengaman angka **10/10**
([laporan](ml/reports/ringkasan-groq-gpt-oss-20b-v1.md)). Detail: [docs/AI.md](docs/AI.md).

### Computer vision, LLM, dan token

AI dipisah menurut pekerjaan. Foto masuk ke **computer vision (CLIP)** yang berjalan di server CivicPulse. Fitur bahasa
mengirim fakta atau teks yang diperlukan dari server ke **LLM Groq**. Foto tidak dikirim ke LLM untuk membuat ringkasan.
API key Groq dan kunci database hanya disimpan di lingkungan server, bukan dibundel ke JavaScript browser.

| Teknologi | Input | Proses | Output dan batas peran |
| :-- | :-- | :-- | :-- |
| **CLIP zero-shot** (`Xenova/clip-vit-base-patch32`, Transformers.js v3, `q8`) | Foto yang sudah diperkecil dan label teks kategori | Model membentuk representasi foto dan label, menghitung kecocokan, lalu memberi skor kandidat | Kategori top-3, detail visual, atau tanda “beres/belum”. Saran dapat diabaikan; tidak mengubah skor prioritas maupun status. |
| **LLM** (`openai/gpt-oss-20b` melalui Groq) | Fakta terpilih dari server; untuk bantuan menulis, teks yang warga kirim saat menekan tombol | Prompt tugas berversi menyusun konteks; server membatasi permintaan dan keluaran | Ringkasan, penjelasan, atau draf teks. Jawaban angka diperiksa terhadap sumber fakta dan pengguna tetap meninjau hasilnya. |
| **Template berbasis aturan** | Kategori, detail CLIP, dan data wilayah | Mengisi kalimat terstruktur tanpa generasi bebas | Draf deskripsi awal yang cepat dan tidak mengarang fakta angka; berbeda dari tombol LLM “Rapikan dengan AI”. |

#### Cara kerja CLIP untuk foto

1. Browser mengubah ukuran foto (sisi terpanjang maksimal **960 px**), mengodekan JPEG, dan menghapus EXIF.
2. Foto dikirim ke endpoint server `POST /ai/foto`. Model CLIP yang sudah dimuat dan di-cache di server—sekitar **90 MB**—membandingkan foto dengan prompt label yang tersimpan di `ml/models.json`.
3. Untuk kategori, model membandingkan lima kategori dan mengembalikan tiga kandidat teratas. Skor di bawah ambang saran **0,60** tidak dipakai untuk memilih otomatis. Untuk detail visual, model membandingkan empat deskripsi kondisi per kategori. Untuk bukti penyelesaian, model membandingkan label “beres” dan “belum”.
4. Hasil dikirim kembali sebagai saran beserta versi model. Warga tetap bisa memilih kategori sendiri. Foto diproses di memori server untuk inferensi dan tidak disimpan oleh jalur AI.

CLIP menggunakan deskripsi label (prompt), bukan kumpulan contoh yang dilatih ulang khusus untuk aplikasi ini. Karena itu foto malam, buram, sudut tak lazim, atau objek yang mirip dapat salah dikenali. Saran verifikasi yang meragukan hanya ditandai untuk pemeriksaan petugas/warga; hasil jajak pendapat warga yang sah tetap menentukan status.

#### Cara kerja LLM dan tokenisasi

Pada tugas ringkasan, server mengambil statistik terpilih—misalnya total laporan, persentase, median waktu penanganan, dan
ID wilayah—lalu menyusun fakta dan instruksi prompt. Pada tugas lain, seperti **Rapikan dengan AI** atau pertanyaan
metodologi, teks yang diperlukan ikut dikirim setelah dibersihkan. Server memanggil `openai/gpt-oss-20b` melalui Groq,
menerima teks jawaban, memeriksa keluaran, lalu mengirim hasil aman ke UI.

**Token** adalah unit yang dibaca atau dihasilkan model bahasa. Token bukan jumlah kata: satu kata bisa menjadi satu token
atau beberapa potongan; angka, spasi yang melekat pada kata, dan tanda baca juga dapat menjadi bagian token. Contoh
konseptual prosesnya:

```text
Input tokens  = instruksi tugas + fakta dari server + teks pengguna yang diperlukan
                         ↓ tokenizer model
                 token masukan (prompt)
                         ↓ LLM
Output tokens = potongan teks yang membentuk jawaban
                         ↓ pemeriksaan fakta dan batas keluaran
                 tampilkan jawaban, atau gunakan template
```

Untuk menghemat pemakaian, CivicPulse mengirim fakta secukupnya, memberi batas keluaran per tugas (`max_completion_tokens`,
umumnya **300–600 token**), menyimpan cache hasil yang sama, membatasi frekuensi permintaan, dan memakai plafon bawaan
**150.000 token per hari**. Token penalaran—bila digunakan model—ikut dihitung dalam anggaran completion. Angka plafon
adalah pagu sistem, bukan jatah yang harus dihabiskan. Jika model gagal, dibatasi, atau keluarannya tidak lolos pemeriksaan,
ringkasan berbasis aturan/template dipakai atau saran AI tidak ditampilkan; pelaporan inti tetap berjalan.

**Pengaman LLM:** fakta untuk ringkasan disusun server dari data terverifikasi; input bebas dibersihkan dan dipisahkan dari
instruksi; angka pada jawaban harus cocok dengan fakta; ada rate limit, cache, batas ukuran body, dan timeout. Teks bebas
yang diproses Groq hanya dikirim saat tugas tersebut diminta pengguna. Detail endpoint, tugas, dan kebijakan ada di
[docs/AI.md](docs/AI.md) dan [docs/DEVOPS.md](docs/DEVOPS.md).

**Evaluasi yang tersedia:** CLIP `clip-v2` memperoleh top-1 **84,1%** dan top-3 **97,7%** untuk klasifikasi pada 44 foto,
serta **76,2%** untuk verifikasi pada 63 foto. Pengaman ringkasan Groq lolos **10/10** statistik uji. Ini hasil dataset
evaluasi proyek, bukan jaminan akurasi untuk seluruh wilayah atau kondisi foto. Lihat [laporan CLIP](ml/reports/clip-v2.md)
dan [laporan LLM](ml/reports/ringkasan-groq-gpt-oss-20b-v1.md).

## 📊 Rumus prioritas

Skor **0–100** dihitung deterministik oleh `packages/core/src/prioritas.js` di server. Setiap masukan dinormalisasi ke skala
0–100, lalu dikalikan bobotnya:

```text
Skor = 0,35 × R + 0,25 × H + 0,20 × P + 0,20 × C
R = nilai risiko bahaya wilayah hasil olahan data BNPB, skala 0–100
H = min(100, kejadian bencana 5 tahun ÷ 5 × 100)
P = clamp((persentase miskin − 3) ÷ (12 − 3) × 100, 0, 100)
C = min(100, pelapor unik serupa ÷ 10 × 100)
```

Jika ada faktor tak tersedia, bobot efektif setiap faktor yang tersedia menjadi `bobot awal ÷ jumlah bobot faktor tersedia`,
sehingga bobot efektif kembali berjumlah 100% tanpa mengisi nilai hilang dengan tebakan.

| Faktor | Bobot | Normalisasi dan alasan |
| :-- | --: | :-- |
| Risiko bahaya wilayah (`R`) | 35% | Nilai bahaya hasil olahan Buku Risiko BNPB untuk kategori laporan; nilainya relatif terhadap cakupan pilot. IRBI total juga dicatat sebagai konteks wilayah. |
| Riwayat kejadian (`H`) | 25% | Kejadian DIBI lima tahun terakhir; lima kejadian atau lebih mencapai nilai 100. |
| Kerentanan sosial (`P`) | 20% | Persentase kemiskinan BPS; nilai 3% menjadi 0 dan 12% atau lebih menjadi 100. Membantu mencegah wilayah rentan kalah hanya karena lebih sedikit warganya melapor. |
| Laporan serupa (`C`) | 20% | Maksimum sepuluh pelapor unik lain dengan kategori sama, dalam radius 500 m dan 30 hari terakhir. Setiap laporan/dukungan unik menambah konteks kebutuhan. |

Kategori prioritas: **Tinggi ≥ 70**, **Sedang 40–69**, dan **Rendah < 40**. Aplikasi menampilkan alasan berdasarkan faktor
dengan kontribusi terbesar. Jika sumber data sebuah faktor tidak tersedia, faktor itu dikeluarkan dan bobot faktor yang ada
dinormalisasi ulang; sistem memberi keterangan tentang data yang belum tersedia. Skor lama tetap dapat dijelaskan karena
setiap hasil mencatat `versiRumus`.

**Contoh hitung yang ada di kontrak dan unit test:** Dayeuhkolot, laporan drainase, risiko 92, riwayat 100, kemiskinan
37,8, empat pelapor serupa menghasilkan `0,35×92 + 0,25×100 + 0,20×37,8 + 0,20×40 = 72,76`, dibulatkan menjadi **73
(Tinggi)**.

### Algoritma lain untuk akuntabilitas dan operasional

| Fitur | Cara hitung / aturan | Hasil bagi pengguna |
| :-- | :-- | :-- |
| **Jarak lokasi** | Rumus Haversine menghitung jarak koordinat bumi; dipakai untuk wilayah terdekat, laporan serupa, CCTV, dan verifikasi. | Jarak/radius konsisten tanpa mengandalkan perkiraan teks alamat. |
| **Laporan serupa** | Kategori sama, pelapor lain yang unik, maksimal 500 m, jendela 30 hari. Skor dihitung ulang ketika ada dukungan baru. | Antrean tidak hanya mengikuti ramai-ramai tanpa batas; kontribusi punya rentang dan deduplikasi. |
| **Verifikasi status** | Wajib foto setelah klaim, maksimal 200 m, bukan pelapor, satu kali per perangkat per siklus. Setelah ≥3 verifikasi sah: suara “beres” yang mayoritas mengesahkan; suara “belum” yang mayoritas membuka ulang. Lewat 14 hari tanpa bukti cukup juga dibuka ulang. | Status selesai dibentuk oleh aturan terbuka dan bukti warga, bukan tombol admin atau prediksi AI. |
| **Wilayah Senyap** | Risiko maksimum wilayah ≥70 dan laporan 30 hari kurang dari 50% rata-rata wilayah. | Menunjukkan kemungkinan “tidak terdengar” alih-alih mengartikan laporan sedikit sebagai risiko rendah. |
| **Perlu Perhatian** | Indeks gabungan 50% risiko tertinggi + 30% banyaknya laporan terbuka + 20% umur rata-rata laporan terbuka. | Membantu melihat penumpukan kerja dan risiko yang perlu ditinjau. |
| **Rencana kerja regu** | Earliest-deadline-first: tenggat target terdekat didahulukan; jika sama, skor prioritas lebih tinggi lebih dulu. | Daftar kerja serta kapasitas/regu yang dibutuhkan. |

Target layanan untuk perencanaan petugas adalah 3 hari (prioritas tinggi), 7 hari (sedang), dan 14 hari (rendah). Estimasi
anggaran memakai biaya satuan asumsi yang dapat diganti petugas; ini alat simulasi, bukan standar HSPK. Definisi dan rumus
analitik lengkap: [docs/SCORING.md](docs/SCORING.md), status lengkap: [docs/STATUS.md](docs/STATUS.md).

Bobot dan ambang dapat dilihat juga di halaman [/metodologi](https://civicpulse.my.id/metodologi). Perubahan bobot,
normalisasi, atau ambang harus menaikkan versi rumus dan diuji—bukan diubah diam-diam.

| Data | Sumber dan periode | Dipakai untuk / status |
| :-- | :-- | :-- |
| Buku Risiko Bencana Indonesia dan IRBI | BNPB, 2021–2023 | Faktor risiko per bahaya; tersedia untuk data pilot kab/kota. |
| Data dan Informasi Bencana Indonesia (DIBI) | BNPB, jendela 5 tahun | Riwayat kejadian; impor `dibi.csv` masih manual/menyusul sesuai pipeline. Jika belum tersedia, faktor ini tidak diberi nilai rekaan. |
| Persentase penduduk miskin | BPS, Maret 2024 | Faktor kerentanan sosial per kab/kota. |
| Batas wilayah dan koordinat | OpenStreetMap serta data batas administratif yang dicatat di pipeline | Penentuan wilayah, peta publik, dan visualisasi cakupan. |

> Angka wilayah 8 kecamatan pilot di Bandung Raya berasal dari data asli BNPB & BPS. Laporan warga di versi demo adalah
> **data ilustrasi** dan diberi label di aplikasi. Pipeline: [docs/DATA.md](docs/DATA.md).

**Batas interpretasi:** data BNPB/BPS pada pilot tersedia di tingkat kab/kota, bukan tiap RT atau titik jalan. Skor
risiko bersifat relatif terhadap cakupan pilot, bukan peringkat risiko resmi seluruh Indonesia. Indeks risiko jalan adalah
proksi dari risiko banjir dan longsor karena sumber IRBI tidak mengukur kerusakan jalan. Bila seri kejadian DIBI belum
tersedia pada berkas data yang dipakai, faktor riwayat dikeluarkan dan bobot faktor tersisa dibagi ulang; halaman
Metodologi harus menjelaskan kondisi tersebut. Aplikasi tidak boleh menampilkan data ilustrasi sebagai angka pemerintah.

## 🛠️ Teknologi

| Bagian | Teknologi |
| :-- | :-- |
| Frontend | React 18, Vite 5, Tailwind CSS 3, React Router 6, Leaflet + OpenStreetMap |
| Aturan bisnis | `packages/core`: JavaScript murni, dipakai web & API, diuji unit test |
| Backend | Hono (Node), Postgres/Supabase atau penyimpanan memori untuk demo |
| AI | CLIP (Transformers.js di server) · LLM `openai/gpt-oss-20b` di Groq |
| Kualitas | ESLint, Prettier, Vitest, GitHub Actions CI, Postman CLI (tes kontrak API) |
| Hosting | Domain demo `civicpulse.my.id`; opsi Vercel + Supabase dan server Node/Jetson + Cloudflare Tunnel dijelaskan di [docs/DEVOPS.md](docs/DEVOPS.md) |

```
apps/web (React)  ─►  services/api.js  ─►  apps/api (Hono)  ─►  Postgres / memori
                                              ├─ /ai  ─►  CLIP · Groq   (ml/models.json)
          keduanya memakai: packages/core (skor · status · verifikasi · analitik)
                            data/processed (IRBI · DIBI · BPS)
```

Arsitektur lengkap: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · Kontrak API: [docs/API.md](docs/API.md) ·
[OpenAPI](docs/openapi.yaml)

### Ikhtisar pendekatan pengembangan

CivicPulse dikembangkan secara iteratif: satu alur pengguna dibangun, didokumentasikan, dievaluasi, lalu disempurnakan.
Bagian [software engineering dan GitHub](#metode-software-engineering-yang-dipakai) menjelaskan tahapannya; rincian
algoritma, status, AI, dan keputusan arsitektur ada di [docs/SCORING.md](docs/SCORING.md),
[docs/STATUS.md](docs/STATUS.md), [docs/AI.md](docs/AI.md), serta [docs/adr](docs/adr/).

## Alur arsitektur: dari mana data masuk dan ke mana hasilnya pergi

```text
1. Pengguna
   Warga: browser/HP, tanpa akun; petugas: login dan cakupan wilayah
       │
2. Web client (apps/web)
   React + Vite → form/peta/panel → services/api.js → adapter HTTP
       │  HTTPS, JSON atau foto
3. Backend (apps/api)
   Hono → route → middleware identitas, validasi, batas laju, hak akses
       ├── laporan/status/dukungan ──→ packages/core
       │                                 ├─ cari wilayah & laporan serupa
       │                                 ├─ hitung skor dan alasan
       │                                 └─ validasi transisi dan verifikasi
       ├── repositories ──→ Supabase/Postgres + Storage (atau adapter demo)
       ├── data/processed ──→ konteks risiko, riwayat, kemiskinan, batas wilayah
       └── /ai
             foto ──→ CLIP di server CivicPulse ──→ saran visual
             fakta/teks ──→ Groq LLM ──→ pemeriksaan keluaran ──→ UI
```

Dengan demikian, alur laporan bukan “form langsung menulis ke database”. Browser mengirim permintaan; API memeriksa
identitas dan bentuk input; `packages/core` menerapkan aturan yang sama; repository menyimpan hasil; lalu API mengirim
kode laporan dan informasi publik kembali ke browser. Kunci Supabase, token petugas, serta `GROQ_API_KEY` tidak ditaruh
di bundle frontend. Proyeksi laporan publik juga menghilangkan identitas internal warga.

### Pipeline data dan batas cakupan

```text
data/raw (sumber asli + atribusi)
  → skrip impor/normalisasi di data/scripts
  → data/processed/*.json + validasi schema
  → konteks yang digunakan core, API, peta, dan perhitungan
```

IRBI/Buku Risiko BNPB menyediakan faktor risiko, DIBI BNPB menyediakan riwayat kejadian, BPS menyediakan persentase
kemiskinan, dan data batas/koordinat membantu pemetaan. Nilai sumber tersedia per kab/kota, jadi kecamatan yang berada di
kab/kota sama dapat memakai konteks resmi yang sama. Delapan kecamatan Bandung Raya menjadi pilot data asli; area lain
yang ditandai ilustrasi **bukan klaim data BNPB/BPS**. Periode, normalisasi, serta data yang belum masuk (termasuk DIBI)
ditampilkan agar juri dapat membedakan data aktual dan simulasi. Rincian: [docs/DATA.md](docs/DATA.md) dan
[data/README.md](data/README.md).

## Metode software engineering yang dipakai

Metode yang paling sesuai dengan proses dan artefak proyek adalah **iterative/incremental development dengan prototyping
(Agile-inspired)**. Tim membuat prototipe/MVP yang dapat dicoba, menyelesaikan satu irisan kebutuhan dari UI sampai API,
menilai hasilnya, lalu memperbaiki versi berikutnya. Proses ini **bukan Waterfall murni**: desain, implementasi, pengujian,
dan perbaikan berjalan berulang. Kami juga tidak mengklaim Scrum formal dengan jadwal dan seluruh seremoni sprint.

Urutan kerja teknisnya:

1. **Analisis masalah dan pengguna:** membatasi masalah (laporan tanpa konteks dan tanpa bukti selesai), menyusun persona,
   kebutuhan warga/petugas/analis, serta kriteria penerimaan fitur.
2. **Spesifikasi sebelum perilaku dikunci:** mendefinisikan model data, API, peran, status, skor, dan batas data di `docs/`;
   keputusan arsitektur yang punya konsekuensi lintas modul dicatat sebagai ADR.
3. **Desain solusi:** memisahkan UI, endpoint, aturan domain, sumber data, dan provider AI; menyiapkan alur desktop/HP.
4. **Implementasi irisan vertikal:** satu fitur menyeberangi frontend → API → core → repository, misalnya laporan sampai
   mendapatkan skor. Aturan bisnis hanya ditulis sekali di `packages/core`.
5. **Verifikasi berlapis:** unit test untuk rumus/status, tes API, validasi sumber data, pemeriksaan responsif UI, dan
   evaluasi terpisah untuk computer vision/LLM. Pengujian AI tidak disamakan dengan keberhasilan fitur web.
6. **Review dan iterasi:** perubahan kecil di branch, Pull Request, CI, review, deployment preview, lalu perbaikan berdasarkan
   temuan teknis atau evaluasi pengguna/model.

### Teknologi dan alasan pemilihan

| Komponen | Teknologi yang digunakan | Peran dan alasan dalam produk |
| :-- | :-- | :-- |
| Web | React 18, Vite 5, Tailwind CSS 3, React Router 6 | Halaman warga dan panel bertingkat dapat dibangun sebagai SPA dengan komponen yang dipakai ulang. |
| Peta | Leaflet + OpenStreetMap | Menunjukkan titik/sebaran masalah dengan sumber peta terbuka. |
| API | Hono di Node.js | Server HTTP ringan yang menjalankan route, validasi, akses, unggah, logika AI, dan repository. |
| Core/domain | JavaScript murni di npm workspace `packages/core` | Aturan tanpa ketergantungan UI/DB; web dan backend memanggil kontrak logika yang sama. |
| Persistensi | Supabase/Postgres + Storage; adapter/memori untuk demo | DB untuk keadaan bersama, serta mode demo agar alur dapat dijalankan tanpa kredensial produksi. |
| Data | JSON terolah, pipeline Node dan skema | Data resmi dilacak sumber/periode dan divalidasi sebelum dipakai. |
| Vision | `@huggingface/transformers` / CLIP di server | Analisis foto tidak memerlukan unduhan model di ponsel pengguna. |
| Bahasa | `openai/gpt-oss-20b` melalui Groq | Membantu membuat narasi; provider dipanggil dari backend agar secret dan aturan pemakaian terpusat. |
| Engineering | Vitest, ESLint, Prettier, GitHub Actions, Postman CLI | Tes domain/API, konsistensi format, validasi data, build, dan tes kontrak HTTP. |

### GitHub: branch, Pull Request, CI, dan kontrak API

Repo menggunakan npm workspaces dalam satu **monorepo** supaya frontend, API, core, data, model, dan dokumentasi dapat
berubah dengan satu Pull Request tanpa menyalin aturan domain ke repo lain. Alur kontribusi yang ditetapkan tim:

```text
main terbaru → branch area/fitur → commit kecil (Conventional Commits)
            → npm run ci → Pull Request → CI hijau + review → merge ke main
```

Workflow [GitHub Actions CI](.github/workflows/ci.yml) menjalankan `npm ci`, `npm run lint`, `npm run format:check`,
`npm run data:validate`, `npm test`, lalu `npm run build`. Job Postman dapat diaktifkan untuk menjalankan koleksi API
terhadap deployment preview dengan secret `POSTMAN_API_KEY` dan `API_PREVIEW_URL`. Rahasia lingkungan ditempatkan di
GitHub/Vercel secrets, bukan di repository. Panduan lengkap kontribusi: [CONTRIBUTING.md](CONTRIBUTING.md); kontrak HTTP:
[docs/API.md](docs/API.md), [docs/openapi.yaml](docs/openapi.yaml), dan
[koleksi Postman](docs/postman/civicpulse.postman_collection.json).

### Indeks dokumentasi untuk tim dan juri

| Pertanyaan | Dokumen rujukan |
| :-- | :-- |
| Apa tujuan, persona, dan nilai produk? | [docs/TENTANG-PROYEK.md](docs/TENTANG-PROYEK.md) |
| Bagaimana komponen dan alur data terhubung? | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) dan [docs/adr/](docs/adr/) |
| Siapa yang boleh melakukan apa? | [docs/USERS.md](docs/USERS.md) |
| Bagaimana entitas dan endpoint dibentuk? | [docs/DATA-MODEL.md](docs/DATA-MODEL.md), [docs/API.md](docs/API.md), [OpenAPI](docs/openapi.yaml) |
| Bagaimana skor, status, dan verifikasi dihitung? | [docs/SCORING.md](docs/SCORING.md), [docs/STATUS.md](docs/STATUS.md) |
| Dari mana data dan model berasal, bagaimana dinilai? | [docs/DATA.md](docs/DATA.md), [docs/AI.md](docs/AI.md), [docs/MLOPS.md](docs/MLOPS.md), [ml/reports/](ml/reports/) |
| Bagaimana konfigurasi, CI, keamanan, dan deploy? | [docs/DEVOPS.md](docs/DEVOPS.md), [`.env.example`](.env.example), [deploy/README.md](deploy/README.md) |

### Filosofi logo

Logo CivicPulse menggabungkan **pin lokasi** (laporan berakar pada tempat), **garis detak** (denyut kondisi lingkungan dan suara warga), serta **simpul kuning** (AI yang menghubungkan sinyal menjadi konteks). Warna hijau mewakili kepedulian dan tindakan publik. Aset dan halaman identitas logo tersedia di [`CivicPulse Logo Identity Showcase.png`](CivicPulse%20Logo%20Identity%20Showcase.png) dan [`logo.html`](logo.html).

![Identitas visual CivicPulse: wordmark, pin detak, dan ikon aplikasi pada latar terang dan gelap](CivicPulse%20Logo%20Identity%20Showcase.png)

## 💻 Jalankan di komputer sendiri

Prasyarat: **Node.js 20+** dan **Git**. Mode demo memakai data contoh di memori, jadi database atau API key tidak diperlukan untuk mencoba alur inti.

```bash
git clone https://github.com/PehPulo/civicpulse.git
cd civicpulse
npm install
```

Buka **dua terminal** di folder repo yang sama:

```bash
# Terminal 1 — API dan data demo
npm run dev:api
# API: http://localhost:8787
```

```bash
# Terminal 2 — website
npm run dev
# Vite: http://localhost:5173
```

Buka `http://localhost:5173`. Browser berbicara ke API lokal; jangan menaruh secret Supabase atau Groq di variabel
`VITE_*`. Untuk mengaktifkan LLM lokal, salin `.env.example` menjadi `.env` dan isi `GROQ_API_KEY` pada server API.
Model CLIP sekitar 90 MB diunduh/cache oleh server saat pertama kali dibutuhkan; jika AI belum tersedia, form dan aturan
inti tetap dapat dicoba tanpa AI.

| Perintah | Fungsi |
| :-- | :-- |
| `npm test` | unit test (core, web, api) |
| `npm run lint` | pemeriksaan statis ESLint |
| `npm run format:check` | memastikan format kode konsisten |
| `npm run data:validate` | validasi skema dan nilai data hasil impor |
| `npm run ci` | lint + format + validasi data + tes + build |
| `npm run build` | build produksi |

## 📁 Struktur repository

```
apps/web          Frontend React: sisi warga & panel instansi
apps/api          Backend Hono + migrasi SQL
packages/core     Aturan bisnis bersama (skor, status, verifikasi) + unit test
data/             Data publik: raw → scripts → processed
ml/               Registry model, dataset & laporan evaluasi AI
docs/             Dokumentasi teknis, kontrak API, keputusan arsitektur (ADR)
deploy/           Skrip pemasangan server
submission/       Berkas lomba: proposal PDF, slide, screenshot
```

## 🚀 Rencana pengembangan

- Melengkapi data kejadian bencana dari DIBI BNPB.
- Memperluas data aktual di luar 8 kecamatan pilot ke seluruh Indonesia.
- Uji coba langsung bersama warga dan dinas.
- Memperkuat keamanan dan privasi (akun petugas resmi, audit log).

## 👥 Tim Peh Pulo · Universitas Brawijaya

| Anggota | Peran |
| :-- | :-- |
| **Yance Adhy Nata Panjaitan** | Ketua Tim · Frontend panel instansi |
| **Albert Juniawan Pasundan** | Backend · DevOps |
| **Christama Ezra Yudianto** | Project Manager · AI Engineer (computer vision & LLM) · Frontend sisi warga |

## 📄 Lisensi

[MIT](LICENSE) © 2026 Tim Peh Pulo
