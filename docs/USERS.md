# Kontrak Pengguna & Hak Akses

> Pemilik: **Ezra** · v1 · Implementasi: `packages/core/src/status.js` (PERAN), `apps/api/src/middleware/identitas.js`

## Aktor

| Peran | Siapa | Identitas (MVP) | Kebutuhan utama |
| :-- | :-- | :-- | :-- |
| `publik` | Siapa pun | Tidak ada | Melihat peta, dasbor, laporan, metodologi |
| `warga` | Pelapor, pemberi +1, verifikator | `X-Device-Id`: UUID v4 dibuat di perangkat (`localStorage`) | Melapor < 60 detik, tahu laporannya diurus, ikut membuktikan |
| `instansi` | Petugas Dinas PUTR / BPBD / kecamatan | PIN demo ⇒ token Bearer (8 jam) | Antrean yang diurutkan risiko, memperbarui status, hak jawab |
| `analis` | Bappeda, DPRD, jurnalis, peneliti | Sama dengan publik | Melihat kesenjangan antarwilayah, ekspor data |
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

## Persona singkat (untuk proposal & UX)

| Persona | Cerita |
| :-- | :-- |
| **Bu Ani, 42, Dayeuhkolot** | Rumahnya kebanjiran tiap hujan deras. Tidak sempat mengawal laporan, ingin tahu laporannya benar-benar diurus. |
| **Pak Dedi, petugas UPT Jalan** | 200 laporan per minggu, semua terlihat sama penting. Butuh urutan yang bisa dipertanggungjawabkan ke atasan. |
| **Rina, staf Bappeda** | Menyusun usulan anggaran. Butuh bukti wilayah mana yang rawan tapi tidak bersuara. |
