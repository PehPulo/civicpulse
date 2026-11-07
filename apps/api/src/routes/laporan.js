// TODO(Albert): implementasikan setiap handler sesuai docs/API.md. Pola untuk setiap mutasi:
//   1. ambil data via repositories/laporan.js
//   2. jalankan aturan dari @civicpulse/core (buatLaporan, terapkanTransisi, periksaVerifikasi, …)
//   3. simpan via repository, balas { data: <Laporan> }
// Acuan perilaku yang benar: apps/web/src/services/adapters/local.js (implementasi lokal kontrak yang sama).
import { Hono } from 'hono'
import { belumAda } from '../middleware/galat.js'
import { wajibInstansi, wajibWarga } from '../middleware/identitas.js'

export const laporan = new Hono()
  .get('/', () => belumAda('GET /laporan'))
  .get('/:kode', () => belumAda('GET /laporan/:kode'))
  .post('/', wajibWarga, () => belumAda('POST /laporan'))
  .post('/:kode/dukungan', wajibWarga, () => belumAda('POST /laporan/:kode/dukungan'))
  .post('/:kode/verifikasi', wajibWarga, () => belumAda('POST /laporan/:kode/verifikasi'))
  .post('/:kode/status', wajibInstansi, () => belumAda('POST /laporan/:kode/status'))
