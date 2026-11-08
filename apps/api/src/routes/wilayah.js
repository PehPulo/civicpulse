import { Hono } from 'hono'
import { NASIONAL, PILOT, W } from '../lib/wilayah.js'

// GET /wilayah: kecamatan pilot (data asli) + wilayah ilustrasi per kab/kota, beserta daftar provinsi & kab/kota.
export const wilayah = new Hono().get('/', (c) => {
  c.header('Cache-Control', 'public, max-age=3600')
  return c.json({
    data: {
      ilustrasi: PILOT.ilustrasi,
      sumber: { ...PILOT.sumber, batas: NASIONAL.sumber },
      wilayah: W,
      provinsi: NASIONAL.provinsi,
      kabkota: NASIONAL.kabkota,
    },
  })
})
