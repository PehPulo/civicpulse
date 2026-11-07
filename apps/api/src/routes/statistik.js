// TODO(Albert): ambil semua laporan dari repository lalu `statistik(laporan, wilayah)` dari @civicpulse/core.
// Cache 60 detik (header Cache-Control) agar dasbor ringan.
import { Hono } from 'hono'
import { belumAda } from '../middleware/galat.js'

export const statistik = new Hono().get('/', () => belumAda('GET /statistik'))
