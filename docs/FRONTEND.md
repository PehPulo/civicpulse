# Kontrak Frontend

> Pemilik: **Ezra** (Frontend Lead, integrasi, arsitektur, AI) · Kontributor: **Yance** (Peta, Metodologi, Lacak, Data Terbuka, 404) · Folder: [`apps/web`](../apps/web)

## Route

| Path | Halaman | Status | PIC |
| :-- | :-- | :-: | :-- |
| `/` | Landing | ✅ | Ezra |
| `/lapor` | Form lapor 3 langkah + hasil skor | ✅ | Ezra |
| `/laporan/:kode` | Detail, linimasa, +1, verifikasi | ✅ | Ezra |
| `/peta` | Peta laporan + filter | 🔜 | Yance |
| `/dasbor` | Dasbor akuntabilitas: KPI, ringkasan LLM, Perlu Perhatian, Wilayah Senyap ✅ · grafik mingguan & peta kesenjangan 🔜 | 🟡 | Ezra |
| `/metodologi` | Rumus, sumber data, batasan | 🔜 | Yance |
| `/lacak` | Cari kode lacak + "Laporan saya" | 🔜 | Yance |
| `/data` | Data Terbuka: unduh laporan publik & statistik (CSV/JSON) | 🔜 | Yance |
| `*` | Halaman 404 | 🔜 | Yance |
| `/instansi` | Mode instansi: login PIN, antrean, ubah status | 🔜 | Ezra |

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

## Halaman Yance: kerja paralel tanpa konflik

Rute, import di `App.jsx`, dan menu di `Navbar.jsx` **sudah didaftarkan Ezra**. File halaman Yance sudah ada sebagai kerangka (`Peta.jsx`, `Metodologi.jsx`, `Lacak.jsx`, `DataTerbuka.jsx`, `TidakDitemukan.jsx`). Yance **hanya mengganti isi file miliknya** dan file baru yang ia buat (`lib/ekspor.js`, `test/ekspor.test.js`), jadi tidak pernah bentrok dengan pekerjaan Ezra. Butuh komponen bersama yang baru? Buat file baru, jangan ubah komponen Ezra; minta di PR.

## Panduan per halaman baru

**`/peta` (Yance):** `react-leaflet` `CircleMarker` warna `warnaLevel(prioritas.level)`; filter kategori/status/wilayah ⇒ `api.daftarLaporan({ kategoriId, status, wilayahId })`; popup ⇒ link ke `/laporan/:kode`; legenda.

**`/metodologi` (Yance):** tampilkan `BOBOT`, `AMBANG`, `NORMALISASI`, `VERSI_RUMUS` dari core (bukan diketik ulang), tabel sumber dari `api.daftarWilayah().sumber`, batasan dari [DATA.md](DATA.md).

**`/lacak` (Yance):** input kode (validasi pola `CP-YYYY-NNNN`) ⇒ `navigate('/laporan/' + kode)`; bagian **"Laporan saya"** dari `api.daftarLaporan()` yang `saya.pelapor === true` (tersimpan per perangkat, tanpa login). Kode tidak ditemukan ⇒ pesan galat dari `api.getLaporan`.

**`/data` (Yance):** tujuan transparansi publik. Unduh `api.daftarLaporan()` sebagai **CSV** & **JSON**, dan `api.statistik()` sebagai JSON. Logika konversi di `src/lib/ekspor.js` (`keCsv(baris, kolom)`, escape koma/kutip/baris baru) **dengan unit test** di `apps/web/test/ekspor.test.js`. Data yang diunduh hanyalah tampilan publik (tanpa `pelaporId`/lokasi verifikator, sudah dijamin `tampilanPublik`). Tampilkan kamus data (nama kolom + arti), lisensi, dan label ilustrasi.

**`*` 404 (Yance):** pesan ramah + tautan ke Beranda, Lapor, Lacak.

**`/dasbor` (Ezra):** `api.statistik()` ⇒ kartu KPI, daftar `perluPerhatian`, kartu **Wilayah Senyap**, grafik `mingguan`, peta `perWilayah` (warna `skorKesenjangan`).

**`/instansi` (Ezra):** `api.loginInstansi(pin)` (PIN demo lokal: `2026`), antrean `daftarLaporan()` diurutkan `prioritas.skor` desc, aksi dari `transisiBerikutnya(status, 'instansi')`, `api.ubahStatus(kode, { ke, catatan, tanggapan })`, tombol reset data demo (`api.reset()`).
