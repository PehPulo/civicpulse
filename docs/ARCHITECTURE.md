# Arsitektur CivicPulse

> Pemilik dokumen: **Ezra (System Integrator)** · Status: **v1, dibekukan 2026-11-07**
> Perubahan arsitektur wajib lewat PR yang disetujui Ezra dan dicatat sebagai ADR di [`adr/`](adr/).

## 1. Gambaran besar

```
                       ┌───────────────────────────── apps/web (React + Vite) ─────────────────────────────┐
 Warga / Publik ─────► │ pages/ ─► hooks/useApi ─► services/api.js ─┬─► adapters/local.js (localStorage)   │
 Petugas Instansi ───► │                                             └─► adapters/http.js ───────────────┐  │
                       │ ai/ (Web Worker · Transformers.js · CLIP)  ◄── ml/models.json                 │  │
                       └──────────────────────────────┬──────────────────────────────────────────────────┼──┘
                                                      │ import                                           │ HTTPS /api/v1
                                         ┌────────────▼────────────┐                        ┌───────────▼──────────┐
                                         │   packages/core         │ ◄──────── import ───── │ apps/api (Hono)      │
                                         │   aturan bisnis murni   │                        │ routes → core → repo │
                                         └────────────▲────────────┘                        └───────────┬──────────┘
                                                      │ import                                          │
                                         ┌────────────┴────────────┐                        ┌───────────▼──────────┐
                                         │ data/processed/*.json   │ ◄── data/scripts ◄──── │ Supabase (Postgres + │
                                         │ (IRBI · DIBI · BPS)     │      data/raw          │ Storage foto)        │
                                         └─────────────────────────┘                        └──────────────────────┘
```

## 2. Prinsip

1. **Aturan bisnis hanya di `packages/core`.** Skor, alur status, verifikasi, dan analitik tidak boleh ditulis ulang di web atau api. Akibatnya mode lokal dan mode server **selalu menghasilkan angka yang sama**.
2. **UI hanya bicara dengan `services/api.js`.** Halaman tidak tahu apakah datanya dari localStorage atau server ([ADR-0002](adr/0002-adapter-lokal-dan-http.md)).
3. **Kontrak dulu, kode kemudian.** Bentuk data dan endpoint didefinisikan di `docs/` sebelum diimplementasikan. Implementasi lokal (`adapters/local.js`) adalah **referensi perilaku** untuk backend.
4. **AI = saran, bukan keputusan.** AI tidak pernah mengubah skor atau status ([ADR-0003](adr/0003-ai-di-browser.md)).
5. **Offline-first untuk demo.** Tanpa `VITE_API_URL`, aplikasi berjalan penuh tanpa internet (kecuali tile peta).

## 3. Struktur repo

```
.
├── apps/
│   ├── web/                 Frontend React (Ezra + Yance)
│   │   └── src/
│   │       ├── pages/       Satu file per route
│   │       ├── components/  Komponen UI dipakai ulang
│   │       ├── hooks/       useApi, useAksi
│   │       ├── services/    api.js (facade) · adapters/ · seed.js · identitas.js
│   │       ├── ai/          index.js (antarmuka) · worker.js (model)        ← Ezra
│   │       └── lib/         util murni UI (foto, peta)
│   └── api/                 Backend Hono di Vercel Functions                ← Albert
│       ├── src/routes/      HTTP saja
│       ├── src/middleware/  identitas, galat
│       ├── src/repositories/ akses Supabase
│       └── db/migrations/   skema SQL
├── packages/core/           Aturan bisnis bersama + unit test               ← Ezra
├── data/                    raw → scripts → processed (+ schema)            ← Albert
├── ml/                      registry model, dataset evaluasi, laporan       ← Albert
├── docs/                    Semua kontrak (dokumen ini dan lainnya)         ← Ezra
└── submission/              Berkas lomba (PDF, PPT, screenshot)
```

## 4. Alur utama

**Membuat laporan**

```
Lapor.jsx ─► api.buatLaporan({kategoriId, lat, lng, deskripsi, foto})
              ├─ lib/foto.kompresFoto()              ⇒ JPEG ≤ 960 px, EXIF dibuang
              └─ adapter.buatLaporan()
                   ├─ core.validasiInputLaporan()
                   ├─ core.wilayahTerdekat()         ⇒ kecamatan
                   ├─ core.hitungSerupa()            ⇒ pelapor unik 500 m / 30 hari
                   ├─ core.hitungPrioritas()         ⇒ skor + kalimat alasan
                   └─ simpan                         ⇒ status DITERIMA
```

**Verifikasi warga**

```
DetailLaporan.jsx ─► ai.cekVerifikasi(foto)          ⇒ saran {beres, yakin} | null
                 ─► api.kirimVerifikasi(...)
                      ├─ core.periksaVerifikasi()    ⇒ radius 200 m, setelah klaim, bukan pelapor, 1×/perangkat
                      ├─ simpan verifikasi sah
                      └─ core.evaluasiVerifikasi()   ⇒ TERVERIFIKASI | DIBUKA_ULANG | tetap
```

## 5. Indeks kontrak

| Dokumen | Isi |
| :-- | :-- |
| [TENTANG-PROYEK.md](TENTANG-PROYEK.md) | Penjelasan proyek untuk semua orang (non-teknis) |
| [USERS.md](USERS.md) | Aktor, peran, matriks hak akses |
| [DATA-MODEL.md](DATA-MODEL.md) | Entitas & field |
| [STATUS.md](STATUS.md) | State machine & verifikasi |
| [SCORING.md](SCORING.md) | Rumus skor & analitik dasbor |
| [API.md](API.md) · [openapi.yaml](openapi.yaml) | Endpoint REST |
| [AI.md](AI.md) | Antarmuka & aturan AI |
| [MLOPS.md](MLOPS.md) | Siklus hidup model |
| [DEVOPS.md](DEVOPS.md) | Environment, CI/CD, deploy, keamanan |
| [DATA.md](DATA.md) | Pipeline & sumber data publik |
| [FRONTEND.md](FRONTEND.md) | Route & konvensi UI |
