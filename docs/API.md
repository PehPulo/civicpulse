# Kontrak API v1

> Pemilik kontrak: **Ezra** · Implementasi: **Albert** (`apps/api`) · Spesifikasi mesin: [`openapi.yaml`](openapi.yaml)
> Implementasi referensi perilaku: `apps/web/src/services/adapters/local.js`. Bila ragu, backend **harus** berperilaku sama.

## Konvensi

| Hal | Aturan |
| :-- | :-- |
| Base URL | `{host}/api/v1` |
| Format | JSON UTF-8. Sukses: `{ "data": … }`. Galat: `{ "error": { "kode", "pesan", "detail?" } }` |
| Identitas warga | Header `X-Device-Id: <uuid v4>` (wajib untuk semua `POST` warga, opsional untuk `GET` agar field `saya` terisi) |
| Identitas instansi | Header `Authorization: Bearer <token>` dari `POST /auth/instansi` |
| Waktu | ISO 8601 UTC |
| Aturan bisnis | **Wajib** memanggil fungsi `@civicpulse/core`; jangan menulis ulang rumus di route |
| CORS | hanya origin di `CORS_ORIGIN` |

## Galat

| HTTP | `kode` | Kapan |
| :-: | :-- | :-- |
| 400 | `VALIDASI` | Input salah bentuk. `detail` = `{ field: pesan }` |
| 401 | `TIDAK_BERWENANG` | Token instansi tidak ada/salah, PIN salah |
| 404 | `TIDAK_DITEMUKAN` | Kode laporan / endpoint tidak ada |
| 409 | `TRANSISI_TIDAK_SAH` | Perubahan status tidak sesuai [STATUS.md](STATUS.md) |
| 409 | `SUDAH_DUKUNG` | Perangkat sudah +1 atau adalah pelapor |
| 422 | `VERIFIKASI_DITOLAK` | Gagal syarat verifikasi. `detail.alasan[]` |
| 429 | `BATAS_HARIAN` | > 5 laporan/hari/perangkat |
| 500 | `INTERNAL` | Lainnya (jangan bocorkan stack trace) |

## Laporan publik

Semua endpoint yang mengembalikan laporan memakai **proyeksi publik** `core.tampilanPublik(laporan, deviceId)`:
entitas [DATA-MODEL.md](DATA-MODEL.md#laporan) **tanpa** `pelaporId`, `dukungan[]`, dan `deviceId/lat/lng` verifikator, **ditambah**:

```json
{ "jumlahDukungan": 3, "saya": { "pelapor": false, "dukung": true, "verifikasi": false } }
```

## Endpoint

| Method | Path | Peran | Body | Respons `data` |
| :-- | :-- | :-- | :-- | :-- |
| GET | `/health` | publik | | `{ ok, mode, versi, waktu }` |
| GET | `/wilayah` | publik | | `{ ilustrasi, sumber, wilayah[] }` |
| GET | `/laporan?kategoriId&status&wilayahId` | publik | | `LaporanPublik[]` (terbaru dulu) |
| GET | `/laporan/:kode` | publik | | `LaporanPublik` |
| POST | `/laporan` | warga | `{ kategoriId, lat, lng, judul?, deskripsi, fotoUrl?, ai? }` | `LaporanPublik` (201) |
| POST | `/laporan/:kode/dukungan` | warga | | `LaporanPublik` (skor dihitung ulang) |
| POST | `/laporan/:kode/verifikasi` | warga | `{ beres, fotoUrl, lat, lng, waktuFoto, ai? }` | `LaporanPublik` (status bisa berubah otomatis) |
| POST | `/laporan/:kode/status` | instansi | `{ ke, catatan?, tanggapan?, buktiUrl? }` | `LaporanPublik` |
| POST | `/unggah` | warga/instansi | multipart `file` (JPEG/PNG/WebP ≤ 1 MB) | `{ url }` (201) |
| GET | `/statistik` | publik | | keluaran `core.statistik()` |
| POST | `/auth/instansi` | publik | `{ pin }` | `{ token, petugas }` |

### Langkah implementasi per endpoint (Albert)

| Endpoint | Panggil dari core | Catatan |
| :-- | :-- | :-- |
| `POST /laporan` | `buatLaporan(input, { daftarWilayah, semuaLaporan, pelaporId, kode, waktu })` | cek `hitungHariIni(deviceId) < 5`; kode unik (retry bila bentrok) |
| `POST /dukungan` | `hitungUlangPrioritas(...)` | tolak bila pelapor/sudah dukung ⇒ `SUDAH_DUKUNG` |
| `POST /verifikasi` | `periksaVerifikasi` lalu `evaluasiVerifikasi` lalu `terapkanTransisi(…, {oleh:'sistem'})` | simpan `sah`, `cek` |
| `POST /status` | `terapkanTransisi(laporan, ke, { oleh: 'instansi', catatan, buktiUrl })` | `tanggapan` ⇒ field `tanggapan` |
| `GET /statistik` | `statistik(laporan, wilayah)` | `Cache-Control: max-age=60` |
| cron harian | `evaluasiVerifikasi` untuk semua `klaim_selesai` | Vercel Cron `0 1 * * *` |

## Tes kontrak

Koleksi Postman: [`postman/civicpulse.postman_collection.json`](postman/civicpulse.postman_collection.json) (variabel `baseUrl`).
OpenAPI juga bisa diimpor langsung ke Postman. Jalankan lokal:

```bash
npm run dev:api
postman collection run docs/postman/civicpulse.postman_collection.json --env-var "baseUrl=http://localhost:8787/api/v1"
```
