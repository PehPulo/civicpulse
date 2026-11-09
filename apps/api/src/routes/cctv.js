// GET /cctv/laporan/:kode   (Bearer instansi) CCTV publik resmi di sekitar satu laporan + portal wilayahnya.
// Keamanan: hanya petugas yang login, hanya laporan dalam yurisdiksinya (dalamAkses), data titik kamera tidak
// pernah dikirim utuh — hanya ≤5 kamera terdekat dari laporan yang boleh dilihat. Tidak dipakai untuk warga.
// Data: data/processed/cctv.json (lihat data/README.md); logika: packages/core/src/cctv.js.
import { Hono } from 'hono'
import { GalatDomain, KODE_GALAT, POLA_KODE, cctvUntukLaporan, dalamAkses } from '@civicpulse/core'
import dataCctv from '@civicpulse/data/cctv.json' with { type: 'json' }
import { INDEKS_WILAYAH } from '../lib/wilayah.js'
import { wajibInstansi } from '../middleware/identitas.js'
import * as repoAsli from '../repositories/laporan.js'

export function buatRuteCctv({ repo = repoAsli, data = dataCctv } = {}) {
  return new Hono().get('/laporan/:kode', wajibInstansi, async (c) => {
    const kode = c.req.param('kode')
    if (!POLA_KODE.test(kode)) throw new GalatDomain(KODE_GALAT.VALIDASI, 'Kode laporan tidak valid.')
    const item = await repo.cari(kode)
    if (!item) throw new GalatDomain(KODE_GALAT.TIDAK_DITEMUKAN, 'Laporan tidak ditemukan.')
    if (!dalamAkses(item, c.get('akses'), INDEKS_WILAYAH))
      throw new GalatDomain(KODE_GALAT.DILARANG, 'Laporan ini di luar wilayah kewenangan Anda.')
    c.header('Cache-Control', 'private, no-store')
    return c.json({ data: cctvUntukLaporan(item, INDEKS_WILAYAH.get(item.wilayahId), data) })
  })
}
