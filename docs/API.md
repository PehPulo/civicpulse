# Kontrak API v1

> Implementasi: `apps/api` · Spesifikasi mesin: [`openapi.yaml`](openapi.yaml)
> Perilaku acuan: tes di `apps/api/test` dan aturan di `packages/core`. Web selalu memanggil endpoint ini (ADR-0005).

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
| GET | `/cctv/laporan/:kode` | instansi (dalam yurisdiksi) | | `{ kamera[≤5]: { nama, lat, lng, jarakM, arah, portal }, jauh, portal[] }`; 401 tanpa token, 403 di luar wilayah, 400 kode tidak valid, `Cache-Control: no-store`. Data: [data/README.md](../data/README.md) |
| POST | `/unggah` | warga/instansi | multipart `file` (JPEG/PNG/WebP ≤ 1 MB) | `{ url }` (201) |
| GET | `/statistik` | publik | | keluaran `core.statistik()` |
| POST | `/auth/instansi` | publik | `{ username, password }` | `{ token, username, petugas, nama, unit, jabatan, tingkat, provinsiId, kabkotaId, wilayahNama, sandiDiganti }`; 401 pesan sama untuk username/password salah, 429 percobaan berlebih |
| POST | `/auth/sandi` | instansi | `{ lama, baru }` | `{ berhasil: true }`; 401 password lama salah, 400 password baru lemah |
| POST | `/auth/profil` | instansi | `{ nama, unit, jabatan? }` | sesi baru (profil disimpan di akun) |
| GET | `/auth/admin` | provinsi/pusat | `?provinsiId=` (pusat saja) | admin bawahan: profil publik + `terakhirMasuk`, `sandiDiganti`, `beban { total, terbuka, lewatSla, persenTepat, skor }`; 403 untuk kab/kota |
| GET | `/auth/saya` | instansi | | profil publik akun sendiri |
| POST | `/ai/foto` | publik | multipart `file` (JPEG/PNG/WebP ≤ 1,5 MB), `tugas` (`klasifikasi`\|`detail`\|`verifikasi`), `kategoriId?` | hasil computer vision (`{ kategoriId, yakin, top3, modelVersi }` / `{ detail[] }` / `{ beres, yakin }`); 429 per IP, 503 bila antrean penuh. Foto tidak disimpan |
| POST | `/ai/ringkasan-dasbor` | publik | `{ bahan }` = keluaran `core.bahanDasbor()` (hanya angka & id wilayah, ≤ 2 KB) | `{ ringkasan \| null, sumber: 'ai'\|'template', alasan?, model?, cache }`; 429 bila > `AI_BATAS_PER_MENIT` per IP. Rincian keamanan: [AI.md § LLM](AI.md) |
| POST | `/ai/tulis/:tugas` | publik / instansi (per tugas) | sesuai tugas, ≤ 4 KB (lihat [AI.md § tugas tambahan](AI.md)) | `{ teks \| null, sumber: 'ai'\|'template', alasan?, model?, prompt, fakta?, saran?, cache }`; 401 tugas petugas tanpa token, 403 di luar yurisdiksi, 404 tugas/kode tidak dikenal, 429 per tugas per IP |

### Pemetaan endpoint ke `packages/core`

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
