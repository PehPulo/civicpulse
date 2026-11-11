# Arsitektur CivicPulse

> Status: **v1** · Keputusan arsitektur dicatat sebagai ADR di [`adr/`](adr/).

## 1. Gambaran besar

```
                       ┌───────────────────────────── apps/web (React + Vite) ─────────────────────────────┐
 Warga / Publik ─────► │ pages/ ─► hooks/useApi ─► services/api.js ───► adapters/http.js ───────────────┐  │
 Petugas Instansi ───► │                                                                                 │  │
                       │ ai/index.js (klien tipis, model AI ada di server: /ai)                        │  │
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
3. **Kontrak dulu, kode kemudian.** Bentuk data dan endpoint didefinisikan di `docs/` sebelum diimplementasikan. Tes API (`apps/api/test`) adalah **referensi perilaku** untuk backend.
4. **AI = saran, bukan keputusan.** AI tidak pernah mengubah skor atau status ([ADR-0003](adr/0003-ai-di-browser.md)).
5. **Selalu lewat backend.** Semua data, login, wewenang, dan AI diperiksa `apps/api` ([ADR-0005](adr/0005-selalu-lewat-backend.md)); web tidak punya mode tanpa server.

## 3. Struktur repo

```
.
├── apps/
│   ├── web/                 Frontend React: sisi warga & panel instansi
│   │   └── src/
│   │       ├── pages/       Satu file per route
│   │       ├── components/  Komponen UI dipakai ulang
│   │       ├── hooks/       useApi, useAksi
│   │       ├── services/    api.js (facade) · adapters/ · seed.js · identitas.js
│   │       ├── ai/          index.js (antarmuka) · worker.js (model)
│   │       └── lib/         util murni UI (foto, peta)
│   └── api/                 Backend Hono di Vercel Functions
│       ├── src/routes/      HTTP saja
│       ├── src/middleware/  identitas, galat
│       ├── src/repositories/ akses Supabase
│       └── db/migrations/   skema SQL
├── packages/core/           Aturan bisnis bersama + unit test
├── data/                    raw → scripts → processed (+ schema)
├── ml/                      registry model, dataset evaluasi, laporan
├── docs/                    Semua kontrak (dokumen ini dan lainnya)
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
