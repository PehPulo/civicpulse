# data/: Dataset Wilayah

> **Pemilik implementasi:** Albert · **Kontrak:** [docs/DATA.md](../docs/DATA.md) (baca ini dulu)

```
data/
├── raw/          ✏️ File ASLI dari BNPB/BPS (jangan diedit manual), lihat raw/README.md
├── scripts/
│   ├── build.js     ✏️ raw → processed (belum diimplementasikan)
│   └── validate.js  cek processed/wilayah.json (jalan di CI)
├── schema/       skema JSON wilayah
└── processed/    wilayah.json, dipakai web & api (saat ini DATA ILUSTRASI)
```

```bash
npm run data:build      # bangun ulang dari data/raw
npm run data:validate   # wajib lulus sebelum PR
```
