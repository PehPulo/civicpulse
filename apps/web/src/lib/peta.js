import wilayahData from '@civicpulse/data/wilayah.json'

export const PUSAT_PETA = [-6.92, 107.6]
export const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
export const TILE_ATRIBUSI = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

// Data wilayah statis untuk pratinjau instan di klien (deteksi kecamatan saat memilih titik).
// Sumber kebenaran tetap api.daftarWilayah(); keduanya berasal dari data/processed/wilayah.json.
export const WILAYAH = wilayahData.wilayah
export const DATA_ILUSTRASI = wilayahData.ilustrasi
export const wilayahById = (id) => WILAYAH.find((w) => w.id === id)
