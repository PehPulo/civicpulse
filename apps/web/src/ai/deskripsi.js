// PEMILIK: Ezra (AI) · KONTRAK: docs/AI.md § Draf deskripsi
//
// Draf judul & deskripsi laporan dari hasil computer vision + lokasi. Sengaja DETERMINISTIK (template),
// bukan LLM: cepat, tanpa unduhan tambahan, dan tidak bisa mengarang fakta. Warga selalu bisa mengubahnya.

/** Pilihan cepat untuk melengkapi draf. Teks ini ditambahkan apa adanya ke deskripsi. */
export const PILIHAN_CEPAT = {
  sejak: ['Terjadi sejak hari ini.', 'Sudah sekitar seminggu.', 'Sudah lebih dari sebulan.'],
  dampak: [
    'Mengganggu lalu lintas.',
    'Membahayakan pengendara.',
    'Air masuk ke rumah warga.',
    'Dilalui anak sekolah setiap hari.',
  ],
}

const lokasi = (wilayah) => (wilayah ? ` di Kec. ${wilayah.kecamatan}` : '')

/**
 * @param {{ kategoriLabel: string, detail?: {kalimat: string}[] | null, wilayah?: {kecamatan: string, kabupaten: string} | null }} p
 * @returns {string} draf deskripsi, contoh: "Saluran air tertutup sampah. Air saluran meluap ke jalan. Lokasi di Kec. Dayeuhkolot, Kab. Bandung."
 */
export function draftDeskripsi({ kategoriLabel, detail, wilayah }) {
  const kalimat = detail?.length ? detail.map((d) => `${d.kalimat}.`) : [`Ada masalah ${kategoriLabel.toLowerCase()}.`]
  if (wilayah) kalimat.push(`Lokasi di Kec. ${wilayah.kecamatan}, ${wilayah.kabupaten}.`)
  return kalimat.join(' ')
}

/** Draf judul singkat (≤ 80 karakter). */
export function draftJudul({ kategoriLabel, detail, wilayah }) {
  const inti = detail?.[0]?.kalimat ?? kategoriLabel
  return `${inti}${lokasi(wilayah)}`.slice(0, 80)
}

/** Tambahkan kalimat pilihan cepat ke deskripsi tanpa duplikat, dengan spasi yang rapi. */
export function tambahKalimat(deskripsi, kalimat) {
  const d = deskripsi.trim()
  if (d.includes(kalimat)) return d
  return d ? `${d} ${kalimat}` : kalimat
}
