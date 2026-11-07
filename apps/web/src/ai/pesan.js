// PEMILIK: Ezra (AI) · KONTRAK: docs/AI.md § LLM
// Susunan pesan chat untuk LLM. Satu sumber untuk browser (worker.js) dan evaluasi (ml/), agar yang diuji = yang dipakai.

const contoh = (c, label) =>
  c
    ? [
        { role: 'user', content: `${label}:\n${c.fakta}\n\nRingkasan:` },
        { role: 'assistant', content: c.jawaban },
      ]
    : []

/** Ringkasan Dasbor untuk pejabat daerah. */
export const pesanRingkasan = (cfg, fakta) => [
  { role: 'system', content: cfg.prompt.sistem },
  ...contoh(cfg.prompt.contohRingkasan, 'Fakta dasbor'),
  { role: 'user', content: `Fakta dasbor:\n${fakta}\n\nRingkasan:` },
]

/** Ringkasan satu laporan untuk instansi teknis (hasil computer vision + data wilayah). */
export const pesanLaporan = (cfg, fakta) => [
  { role: 'system', content: cfg.prompt.laporan },
  ...contoh(cfg.prompt.contohLaporan, 'Fakta laporan'),
  { role: 'user', content: `Fakta laporan:\n${fakta}\n\nRingkasan:` },
]
