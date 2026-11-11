# Kontrak Frontend

> Folder: [`apps/web`](../apps/web)

## Rute

| Path | Halaman |
| :-- | :-- |
| `/` | Beranda |
| `/lapor` | Form lapor 3 langkah + hasil skor |
| `/laporan/:kode` | Detail, linimasa, +1, verifikasi warga |
| `/peta` | Peta laporan + filter |
| `/dasbor` | Dasbor akuntabilitas: KPI, Perlu Perhatian, Wilayah Senyap, grafik mingguan, peta kesenjangan |
| `/metodologi` | Rumus interaktif, sumber data, batasan |
| `/lacak` | Cari kode lacak + "Laporan saya" |
| `/instansi/masuk` | Masuk panel instansi (username wilayah + password) |
| `/instansi` | Ringkasan sesuai tingkat admin (kab/kota, provinsi, pusat) |
| `/instansi/antrean` | Antrean / pantau laporan, urut skor & target waktu |
| `/instansi/laporan/:kode` | Tindak lanjut: ubah status, tanggapan publik, CCTV terdekat |
| `/instansi/peta` | Peta tugas / wilayah |
| `/instansi/supervisi`, `/instansi/arahan-pusat` | Arahan berjenjang pusat → provinsi → kab/kota |
| `/instansi/rencana`, `/anggaran`, `/kinerja`, `/rekap` | Rencana kerja regu, anggaran, kinerja, rekap & cetak |
| `/instansi/admin`, `/peringkat`, `/kerentanan` | Admin wilayah bawahan, peringkat, kerentanan sosial |
| `*` | Halaman 404 |

Halaman panel instansi ada di `src/pages/instansi/` dan `src/components/instansi/`; semuanya dibungkus `WajibInstansi`
(tanpa sesi ⇒ diarahkan ke `/instansi/masuk`) dan `LayoutInstansi` (menu sesuai tingkat admin).

## Aturan (diperiksa saat review)

1. **Data hanya lewat `services/api.js`.** Dilarang `fetch` / `localStorage` di halaman atau komponen.
2. **Baca data dengan `useApi`, ubah data dengan `useAksi`.** Daftar otomatis dimuat ulang setelah mutasi.
3. **Aturan bisnis dari `@civicpulse/core`.** Label status, kategori, dan ambang **tidak** di-hardcode di JSX.
4. **Setiap halaman punya 3 state:** loading, kosong, galat (pesan dari `error.message`).
5. **Mobile-first.** Dicek di 360 px dan 1280 px. Target sentuh ≥ 44 px.
6. **Aksesibilitas:** semua input ber-label, tombol toggle pakai `aria-pressed`, galat pakai `role="alert"`, kontras teks ≥ 4.5:1.
7. **Gaya:** Tailwind + kelas utilitas di `src/index.css` (`btn-primary`, `btn-ghost`, `card`, `tag-ilustrasi`). Warna lewat token di `tailwind.config.js`, bukan hex di JSX.
8. Tampilkan `tag-ilustrasi` bila `DATA_ILUSTRASI` true (data wilayah belum asli), dan label "Laporan contoh" di halaman berbasis laporan (Peta, Dasbor) selama `api.mode === 'lokal'`.

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

**`/peta`:** `react-leaflet` `CircleMarker` warna `warnaLevel(prioritas.level)`; filter kategori/status/wilayah ⇒ `api.daftarLaporan({ kategoriId, status, wilayahId })`; popup ⇒ link ke `/laporan/:kode`; legenda.

**`/metodologi`:** tampilkan `BOBOT`, `AMBANG`, `NORMALISASI`, `VERSI_RUMUS` dari core (bukan diketik ulang), tabel sumber dari `api.daftarWilayah().sumber`, batasan dari [DATA.md](DATA.md).

**`/lacak`:** input kode (validasi pola `CP-YYYY-NNNN`) ⇒ `navigate('/laporan/' + kode)`; bagian **"Laporan saya"** dari `api.daftarLaporan()` yang `saya.pelapor === true` (tersimpan per perangkat, tanpa login). Kode tidak ditemukan ⇒ pesan galat dari `api.getLaporan`.

**`*` 404:** pesan ramah + tautan ke Beranda, Lapor, Lacak.

**`/dasbor`:** `api.statistik()` ⇒ kartu KPI, daftar `perluPerhatian`, kartu **Wilayah Senyap**, grafik `mingguan`, peta `perWilayah` (warna `skorKesenjangan`).
