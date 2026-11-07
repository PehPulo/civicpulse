// bahaya: jenis bahaya IRBI/DIBI yang relevan untuk kategori laporan.
export const KATEGORI = [
  { id: 'drainase', label: 'Drainase tersumbat', bahaya: 'banjir', namaBahaya: 'banjir' },
  { id: 'banjir', label: 'Banjir / genangan', bahaya: 'banjir', namaBahaya: 'banjir' },
  { id: 'jalan', label: 'Jalan rusak', bahaya: 'jalan', namaBahaya: 'kerusakan jalan' },
  { id: 'longsor', label: 'Tanah longsor', bahaya: 'longsor', namaBahaya: 'longsor' },
  { id: 'lainnya', label: 'Lainnya', bahaya: 'banjir', namaBahaya: 'bencana' },
]

export const ID_KATEGORI = KATEGORI.map((k) => k.id)
export const kategoriById = (id) => KATEGORI.find((k) => k.id === id)
