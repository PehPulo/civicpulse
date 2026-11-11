# apps/api: Backend CivicPulse

> Backend Hono CivicPulse. Kontrak endpoint: [docs/API.md](../../docs/API.md).

Hono yang berjalan di Vercel Functions, dengan data di Supabase (Postgres + Storage).

## Baca dulu (urut)

1. [docs/API.md](../../docs/API.md): kontrak semua endpoint
2. [docs/DATA-MODEL.md](../../docs/DATA-MODEL.md) dan [docs/STATUS.md](../../docs/STATUS.md)
3. [ADR-0005](../../docs/adr/0005-selalu-lewat-backend.md): web **selalu** memanggil API ini (tidak ada mode lokal), jadi semua pemeriksaan keamanan wajib ada di sini

## Struktur

```
apps/api/
├── api/index.js          Entry Vercel (jangan diubah)
├── src/
│   ├── app.js            Rakit router & middleware
│   ├── config.js         Satu-satunya tempat membaca env var
│   ├── server.js         Server lokal: npm run dev:api
│   ├── routes/           ✏️ KERJAKAN DI SINI: parsing HTTP saja, tanpa aturan bisnis
│   ├── repositories/     ✏️ KERJAKAN DI SINI: satu-satunya lapisan yang menyentuh Supabase
│   └── middleware/       identitas (X-Device-Id, ✏️ JWT instansi), pemetaan galat
├── db/migrations/        Skema SQL (tambah file baru, jangan ubah yang sudah dijalankan)
└── test/                 ✏️ Tambah tes per endpoint
```

## Pola setiap endpoint

```js
// routes/laporan.js
.post('/', wajibWarga, async (c) => {
  const input = await c.req.json()
  const semua = await repo.semua()                                     // 1. ambil data
  const laporan = buatLaporan(input, { daftarWilayah, semuaLaporan: semua,
    pelaporId: c.get('deviceId'), kode: kodeUnik() })                  // 2. aturan dari @civicpulse/core
  await repo.simpan(laporan)                                           // 3. simpan
  return c.json({ data: tampilanPublik(laporan, c.get('deviceId')) }, 201) // 4. selalu proyeksi publik
})
```

**Jangan** menulis ulang rumus skor, status, atau verifikasi di sini. Semuanya **wajib** memanggil `@civicpulse/core`.

## Perintah

```bash
npm run dev:api     # http://localhost:8787/api/v1/health
npm test            # tes semua paket
```
