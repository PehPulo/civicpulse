# CivicPulse — Lapor Berkonteks

Platform pelaporan warga (jalan rusak, banjir, drainase tersumbat) yang otomatis memperkaya setiap laporan dengan data publik lokasinya (risiko bencana, riwayat kejadian, kemiskinan), memberi **skor prioritas yang bisa dijelaskan**, dan baru dinyatakan selesai setelah **diverifikasi warga sekitar**.

> Subtema: **Civic Reporting & Accountability** — Web In Action, MIA 2026.

![Landing page CivicPulse](civicpulse/docs/landing.png)

## Isi Repository

| Path | Isi |
| --- | --- |
| [`civicpulse/`](civicpulse) | Source code aplikasi (React + Vite + Tailwind) — lihat [README aplikasi](civicpulse/README.md) |
| [`submission/`](submission) | Berkas submission (PDF, screenshot, sumber slide) |

## Cara Menjalankan

Prasyarat: Node.js 18+.

```bash
git clone https://github.com/PehPulo/civicpulse.git
cd civicpulse/civicpulse
npm install
npm run dev
# buka http://localhost:5173
```

Build produksi: `npm run build`, lalu `npm run preview`.
