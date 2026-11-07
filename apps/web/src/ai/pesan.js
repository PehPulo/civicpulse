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

const desimal = (x) => String(x).replace('.', ',')

/**
 * Fakta satu laporan untuk LLM (hanya ini yang dilihat model; pengaman angka membandingkan ke teks ini).
 * @param {{ kategoriLabel: string, yakin?: number|null, detail?: {kalimat: string}[]|null,
 *           wilayah: {kecamatan: string, kabupaten: string, miskin: number, risiko: Record<string, number>}, bahaya: string }} p
 */
export function faktaLaporan({ kategoriLabel, yakin, detail, wilayah, bahaya }) {
  return [
    `- Jenis masalah menurut AI foto: ${kategoriLabel}${yakin != null ? ` (keyakinan ${Math.round(yakin * 100)}%)` : ''}`,
    ...(detail?.length
      ? [
          `- Kondisi terlihat: ${detail
            .slice(0, 2)
            .map((d) => d.kalimat.toLowerCase())
            .join('; ')}`,
        ]
      : []),
    `- Lokasi: Kecamatan ${wilayah.kecamatan}, ${wilayah.kabupaten}`,
    `- Risiko ${bahaya} wilayah: ${wilayah.risiko[bahaya]} dari 100 (BNPB)`,
    `- Penduduk miskin ${wilayah.kabupaten}: ${desimal(wilayah.miskin)}% (BPS)`,
  ].join('\n')
}
