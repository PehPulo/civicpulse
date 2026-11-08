# Evaluasi ringkasan Dasbor · groq-gpt-oss-120b-v1

> Dibuat otomatis oleh `node --env-file=.env ml/eval-llm.js` pada 2026-11-08. Model Groq `openai/gpt-oss-120b`, 10 statistik berbeda dari data demo, pengaman `keluaranAman` (sama dengan server).

**Lolos pengaman: 10/10** (gerbang ≥ 80%: ✅ lulus) · rata-rata 701 token/ringkasan · latensi median 807 ms. Yang ditolak otomatis diganti ringkasan template di aplikasi.

## #1 · ✅ lolos · 784 ms · 692 token

```
- Total laporan: 20
- Persen laporan yang terverifikasi warga dari yang diklaim selesai: 33%
- Median waktu dari laporan masuk sampai terverifikasi: 9,2 hari
- Wilayah paling perlu perhatian: Dayeuhkolot (Kab. Bandung), 2 laporan belum selesai, risiko bencana 100 dari 100
- Wilayah senyap: Lembang (Kab. Bandung Barat), risiko 100 dari 100 tetapi hanya 0 laporan dalam 30 hari (rata-rata wilayah 1,3)
- Wilayah senyap: Cisarua (Kab. Bandung Barat), risiko 100 dari 100 tetapi hanya 0 laporan dalam 30 hari (rata-rata wilayah 1,3)
```

> Dari 20 laporan, 33% klaim selesai telah terverifikasi warga dengan median 9,2 hari. Dayeuhkolot (Kab. Bandung) paling perlu perhatian karena masih ada 2 laporan belum selesai dan risiko bencana 100 dari 100. Lembang dan Cisarua (Kab. Bandung Barat) masing‑masing berisiko 100 dari 100 namun tidak ada laporan dalam 30 hari, sehingga diperlukan penjangkauan aktif ke warga di kedua wilayah tersebut.

## #2 · ✅ lolos · 918 ms · 711 token

```
- Total laporan: 27
- Persen laporan yang terverifikasi warga dari yang diklaim selesai: 45%
- Median waktu dari laporan masuk sampai terverifikasi: 10,2 hari
- Wilayah paling perlu perhatian: Lembang (Kab. Bandung Barat), 2 laporan belum selesai, risiko bencana 100 dari 100
- Wilayah senyap: Cisarua (Kab. Bandung Barat), risiko 100 dari 100 tetapi hanya 0 laporan dalam 30 hari (rata-rata wilayah 1,4)
```

> Dari 27 laporan, 45% klaim selesai telah terverifikasi warga dengan median 10,2 hari. Lembang (Kab. Bandung Barat) paling perlu perhatian karena masih ada 2 laporan belum selesai dengan risiko bencana 100 dari 100. Cisarua (Kab. Bandung Barat) berisiko 100 dari 100 namun tidak ada laporan dalam 30 hari, sehingga diperlukan penjangkauan aktif ke warga.

## #3 · ✅ lolos · 922 ms · 714 token

```
- Total laporan: 25
- Persen laporan yang terverifikasi warga dari yang diklaim selesai: 50%
- Median waktu dari laporan masuk sampai terverifikasi: 9,2 hari
- Wilayah paling perlu perhatian: Bojongsoang (Kab. Bandung), 2 laporan belum selesai, risiko bencana 100 dari 100
- Wilayah senyap: Cisarua (Kab. Bandung Barat), risiko 100 dari 100 tetapi hanya 0 laporan dalam 30 hari (rata-rata wilayah 1,5)
```

> Dari 25 laporan, 50% klaim selesai telah terverifikasi warga dengan median 9,2 hari. Bojongsoang (Kab. Bandung) paling perlu perhatian karena masih ada 2 laporan belum selesai dan risiko bencana 100 dari 100. Cisarua (Kab. Bandung Barat) berisiko 100 dari 100 namun tidak ada laporan dalam 30 hari, sehingga diperlukan penjangkauan aktif ke warga.

## #4 · ✅ lolos · 878 ms · 733 token

```
- Total laporan: 24
- Persen laporan yang terverifikasi warga dari yang diklaim selesai: 60%
- Median waktu dari laporan masuk sampai terverifikasi: 6,6 hari
- Wilayah paling perlu perhatian: Lembang (Kab. Bandung Barat), 2 laporan belum selesai, risiko bencana 100 dari 100
- Wilayah senyap: Lembang (Kab. Bandung Barat), risiko 100 dari 100 tetapi hanya 0 laporan dalam 30 hari (rata-rata wilayah 0,9)
- Wilayah senyap: Cisarua (Kab. Bandung Barat), risiko 100 dari 100 tetapi hanya 0 laporan dalam 30 hari (rata-rata wilayah 0,9)
```

> Dari 24 laporan, 60% klaim selesai telah terverifikasi warga dengan median 6,6 hari. Lembang (Kab. Bandung Barat) paling perlu perhatian karena masih ada 2 laporan belum selesai dan risiko bencana 100 dari 100. Lembang dan Cisarua (Kab. Bandung Barat) sama-sama berisiko 100 dari 100 namun tidak ada laporan dalam 30 hari (rata‑rata wilayah 0,9), sehingga diperlukan penjangkauan proaktif ke warga di kedua wilayah tersebut.

## #5 · ✅ lolos · 807 ms · 690 token

```
- Total laporan: 30
- Persen laporan yang terverifikasi warga dari yang diklaim selesai: 33%
- Median waktu dari laporan masuk sampai terverifikasi: 9,7 hari
- Wilayah paling perlu perhatian: Bojongsoang (Kab. Bandung), 2 laporan belum selesai, risiko bencana 100 dari 100
- Wilayah senyap: Lembang (Kab. Bandung Barat), risiko 100 dari 100 tetapi hanya 0 laporan dalam 30 hari (rata-rata wilayah 1,1)
- Wilayah senyap: Cisarua (Kab. Bandung Barat), risiko 100 dari 100 tetapi hanya 0 laporan dalam 30 hari (rata-rata wilayah 1,1)
```

> Dari 30 laporan, 33% klaim selesai telah terverifikasi warga dengan median 9,7 hari. Bojongsoang (Kab. Bandung) paling perlu perhatian karena masih ada 2 laporan belum selesai dan risiko bencana 100 dari 100. Lembang dan Cisarua (Kab. Bandung Barat) masing‑masing berisiko 100 dari 100 namun tidak ada laporan dalam 30 hari, sehingga diperlukan penjangkauan aktif ke warga di kedua wilayah tersebut.

## #6 · ✅ lolos · 856 ms · 708 token

```
- Total laporan: 31
- Persen laporan yang terverifikasi warga dari yang diklaim selesai: 36%
- Median waktu dari laporan masuk sampai terverifikasi: 10,2 hari
- Wilayah paling perlu perhatian: Dayeuhkolot (Kab. Bandung), 3 laporan belum selesai, risiko bencana 100 dari 100
- Wilayah senyap: Lembang (Kab. Bandung Barat), risiko 100 dari 100 tetapi hanya 0 laporan dalam 30 hari (rata-rata wilayah 1)
- Wilayah senyap: Cisarua (Kab. Bandung Barat), risiko 100 dari 100 tetapi hanya 0 laporan dalam 30 hari (rata-rata wilayah 1)
```

> Dari 31 laporan, 36% klaim selesai telah terverifikasi warga dengan median waktu 10,2 hari. Dayeuhkolot (Kab. Bandung) paling perlu perhatian karena masih ada 3 laporan belum selesai dan risiko bencana 100 dari 100. Lembang dan Cisarua (Kab. Bandung Barat) masing‑masing berisiko 100 dari 100 namun tidak ada laporan dalam 30 hari, sehingga diperlukan penjangkauan proaktif ke warga di kedua wilayah tersebut.

## #7 · ✅ lolos · 755 ms · 688 token

```
- Total laporan: 32
- Persen laporan yang terverifikasi warga dari yang diklaim selesai: 50%
- Median waktu dari laporan masuk sampai terverifikasi: 10,2 hari
- Wilayah paling perlu perhatian: Dayeuhkolot (Kab. Bandung), 3 laporan belum selesai, risiko bencana 100 dari 100
- Wilayah senyap: Lembang (Kab. Bandung Barat), risiko 100 dari 100 tetapi hanya 0 laporan dalam 30 hari (rata-rata wilayah 0,6)
- Wilayah senyap: Cisarua (Kab. Bandung Barat), risiko 100 dari 100 tetapi hanya 0 laporan dalam 30 hari (rata-rata wilayah 0,6)
```

> Dari 32 laporan, 50% klaim selesai telah terverifikasi warga dengan median 10,2 hari. Dayeuhkolot (Kab. Bandung) paling perlu perhatian karena masih ada 3 laporan belum selesai dan risiko bencana 100 dari 100. Lembang dan Cisarua (Kab. Bandung Barat) masing‑masing berisiko 100 dari 100 namun tidak ada laporan dalam 30 hari, sehingga diperlukan penjangkauan aktif ke warga.

## #8 · ✅ lolos · 734 ms · 689 token

```
- Total laporan: 31
- Persen laporan yang terverifikasi warga dari yang diklaim selesai: 50%
- Median waktu dari laporan masuk sampai terverifikasi: 9,7 hari
- Wilayah paling perlu perhatian: Bojongsoang (Kab. Bandung), 3 laporan belum selesai, risiko bencana 100 dari 100
- Wilayah senyap: Lembang (Kab. Bandung Barat), risiko 100 dari 100 tetapi hanya 0 laporan dalam 30 hari (rata-rata wilayah 0,6)
- Wilayah senyap: Cisarua (Kab. Bandung Barat), risiko 100 dari 100 tetapi hanya 0 laporan dalam 30 hari (rata-rata wilayah 0,6)
```

> Dari 31 laporan, 50% klaim selesai telah terverifikasi warga dengan median 9,7 hari. Bojongsoang (Kab. Bandung) paling perlu perhatian karena masih ada 3 laporan belum selesai dan risiko bencana 100 dari 100. Lembang dan Cisarua (Kab. Bandung Barat) masing‑masing berisiko 100 dari 100 namun tidak ada laporan dalam 30 hari, sehingga diperlukan penjangkauan proaktif ke kedua wilayah tersebut.

## #9 · ✅ lolos · 762 ms · 693 token

```
- Total laporan: 35
- Persen laporan yang terverifikasi warga dari yang diklaim selesai: 38%
- Median waktu dari laporan masuk sampai terverifikasi: 9,2 hari
- Wilayah paling perlu perhatian: Dayeuhkolot (Kab. Bandung), 3 laporan belum selesai, risiko bencana 100 dari 100
- Wilayah senyap: Baleendah (Kab. Bandung), risiko 100 dari 100 tetapi hanya 0 laporan dalam 30 hari (rata-rata wilayah 0,1)
- Wilayah senyap: Bojongsoang (Kab. Bandung), risiko 100 dari 100 tetapi hanya 0 laporan dalam 30 hari (rata-rata wilayah 0,1)
```

> Dari 35 laporan, 38% klaim selesai telah terverifikasi warga dengan median 9,2 hari. Dayeuhkolot (Kab. Bandung) paling perlu perhatian karena masih ada 3 laporan belum selesai dan risiko bencana 100 dari 100. Baleendah dan Bojongsoang (Kab. Bandung) masing‑masing berisiko 100 dari 100 namun tidak ada laporan dalam 30 hari, sehingga diperlukan penjangkauan aktif ke warga di kedua wilayah tersebut.

## #10 · ✅ lolos · 717 ms · 693 token

```
- Total laporan: 38
- Persen laporan yang terverifikasi warga dari yang diklaim selesai: 43%
- Median waktu dari laporan masuk sampai terverifikasi: 9,7 hari
- Wilayah paling perlu perhatian: Dayeuhkolot (Kab. Bandung), 3 laporan belum selesai, risiko bencana 100 dari 100
- Wilayah senyap: Baleendah (Kab. Bandung), risiko 100 dari 100 tetapi hanya 0 laporan dalam 30 hari (rata-rata wilayah 0,1)
- Wilayah senyap: Bojongsoang (Kab. Bandung), risiko 100 dari 100 tetapi hanya 0 laporan dalam 30 hari (rata-rata wilayah 0,1)
```

> Dari 38 laporan, 43% klaim selesai telah terverifikasi warga dengan median 9,7 hari. Dayeuhkolot (Kab. Bandung) paling perlu perhatian karena masih ada 3 laporan belum selesai dan risiko bencana 100 dari 100. Baleendah dan Bojongsoang (Kab. Bandung) masing‑masing berisiko 100 dari 100 namun tidak ada laporan dalam 30 hari, sehingga diperlukan penjangkauan aktif ke warga di kedua wilayah tersebut.
