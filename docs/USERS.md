# Kontrak Pengguna & Hak Akses

> Pemilik: **Ezra** · v1 · Implementasi: `packages/core/src/status.js` (PERAN), `apps/api/src/middleware/identitas.js`

## Aktor

| Peran | Siapa | Identitas (MVP) | Kebutuhan utama |
| :-- | :-- | :-- | :-- |
| `publik` | Siapa pun | Tidak ada | Melihat peta, dasbor, laporan, metodologi |
| `warga` | Pelapor, pemberi +1, verifikator | `X-Device-Id`: UUID v4 dibuat di perangkat (`localStorage`) | Melapor < 60 detik, tahu laporannya diurus, ikut membuktikan |
| `instansi` | Petugas Dinas PUTR / BPBD / kecamatan | akun wilayah (username + password) ⇒ token Bearer (8 jam) | Antrean yang diurutkan risiko, memperbarui status, hak jawab |
| `analis` | Bappeda, DPRD, jurnalis, peneliti | Sama dengan publik | Melihat kesenjangan antarwilayah di Dasbor |
| `sistem` | Proses otomatis | Internal | Skor, transisi otomatis verifikasi |

**Privasi:** tanpa nama, NIK, nomor HP, atau email warga. Foto dikompres & EXIF dibuang di klien, koordinat disimpan terpisah.

## Matriks hak akses

| Aksi | publik | warga | instansi | sistem | Endpoint |
| :-- | :-: | :-: | :-: | :-: | :-- |
| Lihat wilayah, laporan, statistik | ✅ | ✅ | ✅ | | `GET /wilayah`, `/laporan`, `/statistik` |
| Buat laporan (maks. 5/hari/perangkat) | | ✅ | | | `POST /laporan` |
| +1 "saya juga mengalami" (1×/laporan, bukan pelapor) | | ✅ | | | `POST /laporan/:kode/dukungan` |
| Verifikasi penyelesaian (1×/siklus, bukan pelapor) | | ✅ | | | `POST /laporan/:kode/verifikasi` |
| `diterima → diproses`, `diproses → klaim_selesai`, `dibuka_ulang → diproses` | | | ✅ | | `POST /laporan/:kode/status` |
| Menulis tanggapan publik + bukti | | | ✅ | | `POST /laporan/:kode/status` |
| `klaim_selesai → terverifikasi / dibuka_ulang` | | | | ✅ | otomatis |
| Reset data demo | | (mode lokal) | | | `api.reset()` |

## Tingkat admin

Implementasi: `packages/core/src/nasional.js` (`TINGKAT`, `validasiAkses`, `dalamAkses`, `bolehUbahStatus`, `bolehSupervisi`).
Login `POST /auth/instansi { username, password }` ⇒ JWT berisi username, tingkat & yurisdiksi akun.

| Tingkat | Yurisdiksi | Sistem kerja | Menu panel |
| :-- | :-- | :-- | :-- |
| `kabkota` | satu kab/kota | **Menangani**: ubah status, tanggapan publik, foto bukti, aksi massal, jadwal regu | Ringkasan, Antrean, Peta tugas, Rencana kerja regu, Arahan atasan, Estimasi anggaran, Kinerja, Rekap & cetak |
| `provinsi` | satu provinsi | **Mengawasi** kab/kota: catatan supervisi, peringkat, kerentanan sosial | Ringkasan provinsi, Pantau laporan, Peta wilayah, Catatan supervisi, Peringkat kab/kota, Kerentanan sosial, Kebutuhan anggaran, Kinerja, Rekap & cetak |
| `pusat` | seluruh Indonesia | **Memantau** nasional: supervisi, peringkat provinsi, kerentanan sosial | Ringkasan nasional, Pantau laporan, Peta wilayah, Catatan supervisi, Peringkat provinsi, Kerentanan sosial, Kebutuhan anggaran, Kinerja, Rekap & cetak |

- Server menolak (403 `DILARANG`) ubah status dari provinsi/pusat, dan setiap aksi pada laporan di luar yurisdiksi.
- `POST /laporan/:kode/supervisi { catatan }` (5–280 karakter): hanya provinsi/pusat, dalam yurisdiksi; status tidak berubah.
- Cakupan provinsi → kab/kota di sidebar hanya **mempersempit** tampilan; tidak pernah memperluas akses.
- Peta wilayah hanya menampilkan **satu cakupan**: kab/kota ⇒ batas kab/kotanya; provinsi ⇒ kab/kota di provinsinya; pusat ⇒ 34 provinsi.

## Akun instansi

Implementasi: `packages/core/src/akun.js`, `apps/api/src/repositories/akun.js`, `apps/api/src/routes/auth.js`.

- **Satu akun = satu wilayah kerja:** `admin.pusat`, `admin.<provinsi>` (mis. `admin.jawa-barat`), `admin.<kabkota>` (mis. `admin.kota-bandung`). Password awal semua akun = `INSTANSI_SANDI_DEMO` (dev: `civicpulse2026`).
- **Password:** hash scrypt dengan salt acak per akun, dibandingkan waktu-konstan; scrypt tetap dihitung untuk username yang tidak ada; pesan galat sama untuk username/password salah; percobaan dibatasi per IP (`AUTH_BATAS_PER_15_MENIT`).
- **Ganti password:** `POST /auth/sandi { lama, baru }` (8–72 karakter, huruf + angka, beda dari yang lama). Halaman Profil mengingatkan akun yang masih memakai password awal.
- **Profil** (`POST /auth/profil`) disimpan di akun sehingga terlihat oleh atasan.
- **Admin bawahan:** `GET /auth/admin` ⇒ provinsi melihat admin kab/kota di provinsinya; pusat melihat admin provinsi (dan `?provinsiId=` untuk admin kab/kota satu provinsi); kab/kota 403. Berisi profil publik (tanpa hash), terakhir masuk, status password, dan beban data wilayah (terbuka, lewat target, skor kinerja). Halaman panel: **Admin kab/kota** / **Admin provinsi**.
- **Batasan saat ini:** akun disimpan di memori server (hilang saat restart; per instance di Vercel). Tabel Supabase `akun_instansi` dengan antarmuka repositori yang sama = langkah berikutnya.

## Persona singkat (untuk proposal & UX)

| Persona | Cerita |
| :-- | :-- |
| **Bu Ani, 42, Dayeuhkolot** | Rumahnya kebanjiran tiap hujan deras. Tidak sempat mengawal laporan, ingin tahu laporannya benar-benar diurus. |
| **Pak Dedi, petugas UPT Jalan** | 200 laporan per minggu, semua terlihat sama penting. Butuh urutan yang bisa dipertanggungjawabkan ke atasan. |
| **Rina, staf Bappeda** | Menyusun usulan anggaran. Butuh bukti wilayah mana yang rawan tapi tidak bersuara. |
