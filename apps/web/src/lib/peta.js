import { gabungWilayah, namaLokasi } from '@civicpulse/core'
import wilayahData from '@civicpulse/data/wilayah.json'
import nasionalData from '@civicpulse/data/nasional.json'

export const PUSAT_PETA = [-6.92, 107.6]
export const PUSAT_INDONESIA = [-2.5, 118]
export const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
export const TILE_ATRIBUSI = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

// Data wilayah statis untuk pratinjau instan di klien: kecamatan pilot (data asli) + wilayah ilustrasi per
// kab/kota se-Indonesia (gabungWilayah di core, sama persis dengan server). Sumber: data/processed/*.json.
export const WILAYAH = gabungWilayah(wilayahData.wilayah, nasionalData)
export const WILAYAH_PILOT = wilayahData.wilayah
export const DATA_ILUSTRASI = wilayahData.ilustrasi
export const SUMBER_DATA = wilayahData.sumber
export const SUMBER_BATAS = nasionalData.sumber
export const PROVINSI = nasionalData.provinsi
export const KABKOTA = nasionalData.kabkota

const indeks = new Map(WILAYAH.map((w) => [w.id, w]))
const indeksProvinsi = new Map(PROVINSI.map((p) => [p.id, p]))
const indeksKabkota = new Map(KABKOTA.map((k) => [k.id, k]))
export const INDEKS_WILAYAH = indeks
export const wilayahById = (id) => indeks.get(id)
export const provinsiById = (id) => indeksProvinsi.get(id)
export const kabkotaById = (id) => indeksKabkota.get(id)

/** "Kec. Coblong" (pilot) atau "Kota Surabaya" (ilustrasi). */
export const lokasiPendek = (w) => namaLokasi(w)
/** "Kec. Coblong, Kota Bandung" (pilot) atau "Kota Surabaya, Jawa Timur" (ilustrasi). */
export const lokasiPanjang = (w) =>
  !w
    ? '-'
    : w.ilustrasi
      ? `${w.kecamatan}, ${provinsiById(w.provinsiId)?.nama ?? ''}`
      : `Kec. ${w.kecamatan}, ${w.kabupaten}`
