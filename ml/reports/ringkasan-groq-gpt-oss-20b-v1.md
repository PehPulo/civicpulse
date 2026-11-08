# Evaluasi ringkasan Dasbor · groq-gpt-oss-20b-v1

> Dibuat otomatis oleh `node --env-file=.env ml/eval-llm.js` pada 2026-11-08. Model Groq `openai/gpt-oss-20b`, 10 statistik berbeda dari data demo, pengaman `keluaranAman` (sama dengan server).

**Lolos pengaman: 10/10** (gerbang ≥ 80%: ✅ lulus) · rata-rata 663 token/ringkasan · latensi median 598 ms. Yang ditolak otomatis diganti ringkasan template di aplikasi.

## #1 · ✅ lolos · 599 ms · 674 token

```
- Total laporan: 20
- Persen laporan yang terverifikasi warga dari yang diklaim selesai: 33%
- Median waktu dari laporan masuk sampai terverifikasi: 9,2 hari
- Wilayah paling perlu perhatian: Dayeuhkolot (Kab. Bandung), 2 laporan belum selesai, risiko bencana 100 dari 100
- Wilayah senyap: Lembang (Kab. Bandung Barat), risiko 100 dari 100 tetapi hanya 0 laporan dalam 30 hari (rata-rata wilayah 1,3)
- Wilayah senyap: Cisarua (Kab. Bandung Barat), risiko 100 dari 100 tetapi hanya 0 laporan dalam 30 hari (rata-rata wilayah 1,3)
```

> Dari 20 laporan, 33% klaim selesai sudah terverifikasi warga dengan median 9,2 hari. Dayeuhkolot (Kab. Bandung) paling perlu perhatian karena masih ada 2 laporan belum selesai dengan risiko bencana 100 dari 100. Lembang dan Cisarua (Kab. Bandung Barat) berisiko 100 dari 100 namun tidak ada laporan dalam 30 hari, sehingga perlu penjangkauan langsung ke warga.

## #2 · ✅ lolos · 663 ms · 623 token

```
- Total laporan: 27
- Persen laporan yang terverifikasi warga dari yang diklaim selesai: 45%
- Median waktu dari laporan masuk sampai terverifikasi: 10,2 hari
- Wilayah paling perlu perhatian: Lembang (Kab. Bandung Barat), 2 laporan belum selesai, risiko bencana 100 dari 100
- Wilayah senyap: Cisarua (Kab. Bandung Barat), risiko 100 dari 100 tetapi hanya 0 laporan dalam 30 hari (rata-rata wilayah 1,4)
```

> Dari 27 laporan, 45% klaim selesai sudah terverifikasi warga dengan median 10,2 hari. Lembang (Kab. Bandung Barat) paling perlu perhatian karena masih ada 2 laporan belum selesai dengan risiko bencana 100 dari 100. Cisarua (Kab. Bandung Barat) berisiko 100 dari 100 namun tidak ada laporan dalam 30 hari, sehingga perlu penjangkauan langsung ke warga.

## #3 · ✅ lolos · 590 ms · 632 token

```
- Total laporan: 25
- Persen laporan yang terverifikasi warga dari yang diklaim selesai: 50%
- Median waktu dari laporan masuk sampai terverifikasi: 9,2 hari
- Wilayah paling perlu perhatian: Bojongsoang (Kab. Bandung), 2 laporan belum selesai, risiko bencana 100 dari 100
- Wilayah senyap: Cisarua (Kab. Bandung Barat), risiko 100 dari 100 tetapi hanya 0 laporan dalam 30 hari (rata-rata wilayah 1,5)
```

> Dari 25 laporan, 50% klaim selesai sudah terverifikasi warga dengan median 9,2 hari. Bojongsoang (Kab. Bandung) paling perlu perhatian karena masih ada 2 laporan belum selesai dengan risiko bencana 100 dari 100. Cisarua (Kab. Bandung Barat) berisiko 100 dari 100 namun hanya mengirim 0 laporan dalam 30 hari, sehingga perlu penjangkauan langsung ke warga.

## #4 · ✅ lolos · 643 ms · 671 token

```
- Total laporan: 24
- Persen laporan yang terverifikasi warga dari yang diklaim selesai: 60%
- Median waktu dari laporan masuk sampai terverifikasi: 6,6 hari
- Wilayah paling perlu perhatian: Lembang (Kab. Bandung Barat), 2 laporan belum selesai, risiko bencana 100 dari 100
- Wilayah senyap: Lembang (Kab. Bandung Barat), risiko 100 dari 100 tetapi hanya 0 laporan dalam 30 hari (rata-rata wilayah 0,9)
- Wilayah senyap: Cisarua (Kab. Bandung Barat), risiko 100 dari 100 tetapi hanya 0 laporan dalam 30 hari (rata-rata wilayah 0,9)
```

> Dari 24 laporan, 60% klaim selesai sudah terverifikasi warga dengan median 6,6 hari. Lembang (Kab. Bandung Barat) paling perlu perhatian karena masih ada 2 laporan belum selesai dengan risiko bencana 100 dari 100. Lembang dan Cisarua (Kab. Bandung Barat) berisiko 100 dari 100 namun tidak ada laporan dalam 30 hari, sehingga perlu penjangkauan intensif ke warga.

## #5 · ✅ lolos · 598 ms · 668 token

```
- Total laporan: 30
- Persen laporan yang terverifikasi warga dari yang diklaim selesai: 33%
- Median waktu dari laporan masuk sampai terverifikasi: 9,7 hari
- Wilayah paling perlu perhatian: Bojongsoang (Kab. Bandung), 2 laporan belum selesai, risiko bencana 100 dari 100
- Wilayah senyap: Lembang (Kab. Bandung Barat), risiko 100 dari 100 tetapi hanya 0 laporan dalam 30 hari (rata-rata wilayah 1,1)
- Wilayah senyap: Cisarua (Kab. Bandung Barat), risiko 100 dari 100 tetapi hanya 0 laporan dalam 30 hari (rata-rata wilayah 1,1)
```

> Dari 30 laporan, 33% klaim selesai sudah terverifikasi warga dengan median 9,7 hari. Bojongsoang (Kab. Bandung) paling perlu perhatian karena masih ada 2 laporan belum selesai dengan risiko bencana 100 dari 100. Lembang dan Cisarua (Kab. Bandung Barat) berisiko 100 dari 100 namun tidak ada laporan dalam 30 hari, sehingga perlu penjangkauan langsung ke warga.

## #6 · ✅ lolos · 330 ms · 670 token

```
- Total laporan: 31
- Persen laporan yang terverifikasi warga dari yang diklaim selesai: 36%
- Median waktu dari laporan masuk sampai terverifikasi: 10,2 hari
- Wilayah paling perlu perhatian: Dayeuhkolot (Kab. Bandung), 3 laporan belum selesai, risiko bencana 100 dari 100
- Wilayah senyap: Lembang (Kab. Bandung Barat), risiko 100 dari 100 tetapi hanya 0 laporan dalam 30 hari (rata-rata wilayah 1)
- Wilayah senyap: Cisarua (Kab. Bandung Barat), risiko 100 dari 100 tetapi hanya 0 laporan dalam 30 hari (rata-rata wilayah 1)
```

> Dari 31 laporan, 36% klaim selesai sudah terverifikasi warga dengan median 10,2 hari. Dayeuhkolot (Kab. Bandung) paling perlu perhatian karena masih ada 3 laporan belum selesai dengan risiko bencana 100 dari 100. Lembang dan Cisarua (Kab. Bandung Barat) berisiko 100 dari 100 namun tidak ada laporan dalam 30 hari, sehingga perlu penjangkauan langsung ke warga.

## #7 · ✅ lolos · 666 ms · 674 token

```
- Total laporan: 32
- Persen laporan yang terverifikasi warga dari yang diklaim selesai: 50%
- Median waktu dari laporan masuk sampai terverifikasi: 10,2 hari
- Wilayah paling perlu perhatian: Dayeuhkolot (Kab. Bandung), 3 laporan belum selesai, risiko bencana 100 dari 100
- Wilayah senyap: Lembang (Kab. Bandung Barat), risiko 100 dari 100 tetapi hanya 0 laporan dalam 30 hari (rata-rata wilayah 0,6)
- Wilayah senyap: Cisarua (Kab. Bandung Barat), risiko 100 dari 100 tetapi hanya 0 laporan dalam 30 hari (rata-rata wilayah 0,6)
```

> Dari 32 laporan, 50% klaim selesai sudah terverifikasi warga dengan median 10,2 hari. Dayeuhkolot (Kab. Bandung) paling perlu perhatian karena masih ada 3 laporan belum selesai dengan risiko bencana 100 dari 100. Lembang dan Cisarua (Kab. Bandung Barat) berisiko 100 dari 100 namun tidak ada laporan dalam 30 hari, sehingga perlu penjangkauan langsung ke warga.

## #8 · ✅ lolos · 443 ms · 672 token

```
- Total laporan: 31
- Persen laporan yang terverifikasi warga dari yang diklaim selesai: 50%
- Median waktu dari laporan masuk sampai terverifikasi: 9,7 hari
- Wilayah paling perlu perhatian: Bojongsoang (Kab. Bandung), 3 laporan belum selesai, risiko bencana 100 dari 100
- Wilayah senyap: Lembang (Kab. Bandung Barat), risiko 100 dari 100 tetapi hanya 0 laporan dalam 30 hari (rata-rata wilayah 0,6)
- Wilayah senyap: Cisarua (Kab. Bandung Barat), risiko 100 dari 100 tetapi hanya 0 laporan dalam 30 hari (rata-rata wilayah 0,6)
```

> Dari 31 laporan, 50% klaim selesai sudah terverifikasi warga dengan median 9,7 hari. Bojongsoang (Kab. Bandung) paling perlu perhatian karena masih ada 3 laporan belum selesai dengan risiko bencana 100 dari 100. Lembang dan Cisarua (Kab. Bandung Barat) berisiko 100 dari 100 namun tidak ada laporan dalam 30 hari, sehingga perlu penjangkauan langsung ke warga.

## #9 · ✅ lolos · 587 ms · 675 token

```
- Total laporan: 35
- Persen laporan yang terverifikasi warga dari yang diklaim selesai: 38%
- Median waktu dari laporan masuk sampai terverifikasi: 9,2 hari
- Wilayah paling perlu perhatian: Dayeuhkolot (Kab. Bandung), 3 laporan belum selesai, risiko bencana 100 dari 100
- Wilayah senyap: Baleendah (Kab. Bandung), risiko 100 dari 100 tetapi hanya 0 laporan dalam 30 hari (rata-rata wilayah 0,1)
- Wilayah senyap: Bojongsoang (Kab. Bandung), risiko 100 dari 100 tetapi hanya 0 laporan dalam 30 hari (rata-rata wilayah 0,1)
```

> Dari 35 laporan, 38% klaim selesai sudah terverifikasi warga dengan median 9,2 hari. Dayeuhkolot (Kab. Bandung) paling perlu perhatian karena masih ada 3 laporan belum selesai dengan risiko bencana 100 dari 100. Baleendah dan Bojongsoang (Kab. Bandung) berisiko 100 dari 100 namun tidak ada laporan dalam 30 hari, sehingga perlu penjangkauan langsung ke warga.

## #10 · ✅ lolos · 570 ms · 671 token

```
- Total laporan: 38
- Persen laporan yang terverifikasi warga dari yang diklaim selesai: 43%
- Median waktu dari laporan masuk sampai terverifikasi: 9,7 hari
- Wilayah paling perlu perhatian: Dayeuhkolot (Kab. Bandung), 3 laporan belum selesai, risiko bencana 100 dari 100
- Wilayah senyap: Baleendah (Kab. Bandung), risiko 100 dari 100 tetapi hanya 0 laporan dalam 30 hari (rata-rata wilayah 0,1)
- Wilayah senyap: Bojongsoang (Kab. Bandung), risiko 100 dari 100 tetapi hanya 0 laporan dalam 30 hari (rata-rata wilayah 0,1)
```

> Dari 38 laporan, 43% klaim selesai sudah terverifikasi warga dengan median 9,7 hari. Dayeuhkolot (Kab. Bandung) paling perlu perhatian karena masih ada 3 laporan belum selesai dengan risiko bencana 100 dari 100. Baleendah dan Bojongsoang (Kab. Bandung) berisiko 100 dari 100 namun tidak ada laporan dalam 30 hari, sehingga perlu penjangkauan langsung ke warga.
