# Kontrak Frontend

> Pemilik: **Ezra** (Frontend Lead, **sisi warga/pelapor**, integrasi, AI) · **Yance** (**sisi instansi/admin**) · Folder: [`apps/web`](../apps/web)

## Pembagian: sisi warga vs sisi instansi

| Sisi | Pemilik | Folder | Rute |
| :-- | :-- | :-- | :-- |
| **Warga / pelapor** (publik) | Ezra | `src/pages/*.jsx`, `src/components/*.jsx`, `src/lib/` | `/`, `/lapor`, `/laporan/:kode`, `/peta`, `/dasbor`, `/metodologi`, `/lacak`, `/data`, 404 |
| **Instansi / admin** (petugas) | Yance | `src/pages/instansi/**`, `src/components/instansi/**` | `/instansi/masuk`, `/instansi`, `/instansi/laporan/:kode`, `/instansi/kinerja` |

Rute (`App.jsx`), `Navbar`, dan `Footer` sudah didaftarkan Ezra. Yance **hanya mengedit dua folder `instansi/`**, jadi kedua sisi bisa dikerjakan paralel tanpa konflik. Yang dipakai bersama (milik Ezra, tinggal dipakai): `services/api.js`, `hooks/`, `@civicpulse/core`, `components/Prioritas.jsx`. Butuh perubahan di sana? Minta lewat issue/PR, jangan diedit langsung.

## Route

| Path | Halaman | Status | PIC |
| :-- | :-- | :-: | :-- |
| `/` | Landing | ✅ | Ezra |
| `/lapor` | Form lapor 3 langkah + hasil skor | ✅ | Ezra |
| `/laporan/:kode` | Detail, linimasa, +1, verifikasi | ✅ | Ezra |
| `/peta` | Peta laporan + filter | 🔜 | Ezra |
| `/dasbor` | Dasbor akuntabilitas: KPI, ringkasan LLM, Perlu Perhatian, Wilayah Senyap ✅ · grafik mingguan & peta kesenjangan 🔜 | 🟡 | Ezra |
| `/metodologi` | Rumus, sumber data, batasan | 🔜 | Ezra |
| `/lacak` | Cari kode lacak + "Laporan saya" | 🔜 | Ezra |
| `/data` | Data Terbuka: unduh laporan publik & statistik (CSV/JSON) | 🔜 | Ezra |
| `*` | Halaman 404 | 🔜 | Ezra |
| `/instansi/masuk` | Login petugas dengan PIN | 🔜 | Yance |
| `/instansi` | Antrean kerja diurutkan prioritas + filter | 🔜 | Yance |
| `/instansi/laporan/:kode` | Tindak lanjut: ubah status, catatan, tanggapan publik | 🔜 | Yance |
| `/instansi/kinerja` | Kinerja instansi: median hari tangani, dibuka ulang, per wilayah | 🔜 | Yance |

## Aturan (diperiksa saat review)

1. **Data hanya lewat `services/api.js`.** Dilarang `fetch` / `localStorage` di halaman atau komponen.
2. **Baca data dengan `useApi`, ubah data dengan `useAksi`.** Daftar otomatis dimuat ulang setelah mutasi.
3. **Aturan bisnis dari `@civicpulse/core`.** Label status, kategori, dan ambang **tidak** di-hardcode di JSX.
4. **Setiap halaman punya 3 state:** loading, kosong, galat (pesan dari `error.message`).
5. **Mobile-first.** Dicek di 360 px dan 1280 px. Target sentuh ≥ 44 px.
6. **Aksesibilitas:** semua input ber-label, tombol toggle pakai `aria-pressed`, galat pakai `role="alert"`, kontras teks ≥ 4.5:1.
7. **Gaya:** Tailwind + kelas utilitas di `src/index.css` (`btn-primary`, `btn-ghost`, `card`, `tag-ilustrasi`). Warna lewat token di `tailwind.config.js`, bukan hex di JSX.
8. Tampilkan `tag-ilustrasi` bila `DATA_ILUSTRASI` true.

## Penamaan

| Jenis | Pola | Contoh |
| :-- | :-- | :-- |
| Halaman / komponen | `PascalCase.jsx` | `DasborAkuntabilitas.jsx` |
| Hook | `useXxx.js` | `useApi.js` |
| Util / service | `camelCase.js` | `foto.js` |
| Bahasa | Identifier & UI dalam **Bahasa Indonesia** (konsisten dengan domain) | `hitungPrioritas`, `daftarLaporan` |

## Contoh pola halaman

```jsx
import { useApi } from '../hooks/useApi.js'
import { api } from '../services/api.js'

export default function Peta() {
  const { data: laporan, loading, error } = useApi(() => api.daftarLaporan(), [])
  if (loading) return <p>Memuat…</p>
  if (error) return <p role="alert">{error.message}</p>
  if (!laporan.length) return <p>Belum ada laporan.</p>
  return /* … */
}
```

## Panduan per halaman baru

**`/peta` (Ezra):** `react-leaflet` `CircleMarker` warna `warnaLevel(prioritas.level)`; filter kategori/status/wilayah ⇒ `api.daftarLaporan({ kategoriId, status, wilayahId })`; popup ⇒ link ke `/laporan/:kode`; legenda.

**`/metodologi` (Ezra):** tampilkan `BOBOT`, `AMBANG`, `NORMALISASI`, `VERSI_RUMUS` dari core (bukan diketik ulang), tabel sumber dari `api.daftarWilayah().sumber`, batasan dari [DATA.md](DATA.md).

**`/lacak` (Ezra):** input kode (validasi pola `CP-YYYY-NNNN`) ⇒ `navigate('/laporan/' + kode)`; bagian **"Laporan saya"** dari `api.daftarLaporan()` yang `saya.pelapor === true` (tersimpan per perangkat, tanpa login). Kode tidak ditemukan ⇒ pesan galat dari `api.getLaporan`.

**`/data` (Ezra):** tujuan transparansi publik. Unduh `api.daftarLaporan()` sebagai **CSV** & **JSON**, dan `api.statistik()` sebagai JSON. Logika konversi di `src/lib/ekspor.js` (`keCsv(baris, kolom)`, escape koma/kutip/baris baru) **dengan unit test** di `apps/web/test/ekspor.test.js`. Data yang diunduh hanyalah tampilan publik (tanpa `pelaporId`/lokasi verifikator, sudah dijamin `tampilanPublik`). Tampilkan kamus data (nama kolom + arti), lisensi, dan label ilustrasi.

**`*` 404 (Ezra):** pesan ramah + tautan ke Beranda, Lapor, Lacak.

**`/dasbor` (Ezra):** `api.statistik()` ⇒ kartu KPI, daftar `perluPerhatian`, kartu **Wilayah Senyap**, grafik `mingguan`, peta `perWilayah` (warna `skorKesenjangan`).

## Sisi instansi (Yance)

Semua halaman di bawah `/instansi` dibungkus `WajibInstansi` (tanpa sesi ⇒ diarahkan ke `/instansi/masuk`) dan `LayoutInstansi` (menu + `<Outlet />`). Keduanya sudah berfungsi.

**`LayoutInstansi` (`components/instansi/LayoutInstansi.jsx`):** menu Antrean & Kinerja, nama petugas dari `api.sesiInstansi().petugas`, tombol **Keluar** (`api.logoutInstansi()` lalu ke `/instansi/masuk`), tombol **Reset data demo** (`api.reset()`, dengan konfirmasi). Pertahankan `<Outlet />`.

**`/instansi/masuk` (`pages/instansi/Masuk.jsx`):** input PIN (`type="password"`, ber-label) ⇒ `useAksi(api.loginInstansi)`; sukses ⇒ `navigate(location.state?.dari ?? '/instansi')`; gagal ⇒ `error.message` dengan `role="alert"`. Tampilkan petunjuk "PIN demo: 2026" hanya bila `api.mode === 'lokal'`.

**`/instansi` Antrean (`pages/instansi/Antrean.jsx`):** `useApi(() => api.daftarLaporan(filter), [filter])`, urutkan `prioritas.skor` menurun; default hanya status di `STATUS_TERBUKA` (dari core). Filter status, kategori, wilayah. Tiap baris: kode, judul, wilayah, badge prioritas (`components/Prioritas.jsx`), label dari `LABEL_STATUS`, umur laporan, jumlah dukungan ⇒ klik ke `/instansi/laporan/:kode`. Di atas: jumlah per status.

**`/instansi/laporan/:kode` Tindak lanjut (`pages/instansi/TindakLanjut.jsx`):** `api.getLaporan(kode)`; tampilkan foto, deskripsi, rincian skor, riwayat, dan ringkasan verifikasi warga (`ringkasVerifikasi` dari core, termasuk tanda `aiMeragukan`). Tombol aksi **hanya** dari `transisiBerikutnya(status, 'instansi')` (jangan di-hardcode). Form `catatan` (riwayat) + `tanggapan` (hak jawab publik) ⇒ `useAksi((p) => api.ubahStatus(kode, p))` dengan `{ ke, catatan, tanggapan }`. Instansi **tidak bisa** menandai `terverifikasi`; jelaskan ini di UI.

**`/instansi/kinerja` (`pages/instansi/Kinerja.jsx`):** dari `api.statistik()`: `medianHariTangani`, `persenTerverifikasi`, jumlah `dibuka_ulang` (`perStatus`), tabel `perWilayah`, daftar `perluPerhatian`. Tujuannya: instansi melihat kinerjanya sendiri secara jujur (akuntabilitas).
