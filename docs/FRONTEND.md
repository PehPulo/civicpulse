# Kontrak Frontend

> Pemilik: **Ezra** (integrasi, arsitektur, AI) · Kontributor: **Yance**, **Ezra** · Folder: [`apps/web`](../apps/web)

## Route

| Path | Halaman | Status | PIC |
| :-- | :-- | :-: | :-- |
| `/` | Landing | ✅ | Ezra |
| `/lapor` | Form lapor 3 langkah + hasil skor | ✅ | Ezra |
| `/laporan/:kode` | Detail, linimasa, +1, verifikasi | ✅ | Ezra |
| `/peta` | Peta laporan + filter | 🔜 | Yance |
| `/dasbor` | Dasbor akuntabilitas (KPI, Perlu Perhatian, Wilayah Senyap, grafik) | 🔜 | Ezra |
| `/metodologi` | Rumus, sumber data, batasan | 🔜 | Yance |
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

## Panduan per halaman baru

**`/peta` (Yance):** `react-leaflet` `CircleMarker` warna `warnaLevel(prioritas.level)`; filter kategori/status/wilayah ⇒ `api.daftarLaporan({ kategoriId, status, wilayahId })`; popup ⇒ link ke `/laporan/:kode`; legenda.

**`/metodologi` (Yance):** tampilkan `BOBOT`, `AMBANG`, `NORMALISASI`, `VERSI_RUMUS` dari core (bukan diketik ulang), tabel sumber dari `api.daftarWilayah().sumber`, batasan dari [DATA.md](DATA.md).

**`/dasbor` (Ezra):** `api.statistik()` ⇒ kartu KPI, daftar `perluPerhatian`, kartu **Wilayah Senyap**, grafik `mingguan`, peta `perWilayah` (warna `skorKesenjangan`).

**`/instansi` (Ezra):** `api.loginInstansi(pin)` (PIN demo lokal: `2026`), antrean `daftarLaporan()` diurutkan `prioritas.skor` desc, aksi dari `transisiBerikutnya(status, 'instansi')`, `api.ubahStatus(kode, { ke, catatan, tanggapan })`, tombol reset data demo (`api.reset()`).
