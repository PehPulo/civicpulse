// Endpoint /laporan
// Kontrak: docs/API.md & docs/openapi.yaml
import { Hono } from 'hono'
import { INDEKS_WILAYAH, W } from '../lib/wilayah.js'
import {
  ATURAN_LAPORAN,
  GalatDomain,
  KODE_GALAT,
  PERAN,
  STATUS,
  buatKodeLacak,
  buatLaporan,
  evaluasiVerifikasi,
  hitungUlangPrioritas,
  periksaVerifikasi,
  tampilanPublik,
  terapkanTransisi,
  bolehSupervisi,
  bolehUbahStatus,
  dalamAkses,
} from '@civicpulse/core'
import { opsionalWarga, wajibInstansi, wajibWarga } from '../middleware/identitas.js'
import { sanitasiObjek, sanitasiTeks, urlFotoAman } from '../lib/sanitizer.js'
import * as repo from '../repositories/laporan.js'

const catatanSistem = (ke) =>
  ke === STATUS.TERVERIFIKASI
    ? 'Dikonfirmasi warga sekitar lewat foto berlokasi.'
    : 'Verifikasi warga tidak mendukung klaim selesai. Laporan dibuka ulang.'

async function generateKodeUnik() {
  for (let i = 0; i < 10; i++) {
    const k = buatKodeLacak()
    const ada = await repo.cari(k)
    if (!ada) return k
  }
  throw new GalatDomain(KODE_GALAT.VALIDASI, 'Gagal menghasilkan kode lacak unik, coba lagi.')
}

export const laporan = new Hono()
  // GET /laporan
  .get('/', opsionalWarga, async (c) => {
    const { kategoriId, status, wilayahId } = c.req.query()
    const daftar = await repo.semua({ kategoriId, status, wilayahId })
    const deviceId = c.get('deviceId')
    return c.json({ data: daftar.map((l) => tampilanPublik(l, deviceId)) })
  })

  // GET /laporan/:kode
  .get('/:kode', opsionalWarga, async (c) => {
    const kode = c.req.param('kode')
    const item = await repo.cari(kode)
    if (!item) {
      throw new GalatDomain(KODE_GALAT.TIDAK_DITEMUKAN, `Laporan ${kode} tidak ditemukan.`)
    }
    const deviceId = c.get('deviceId')
    return c.json({ data: tampilanPublik(item, deviceId) })
  })

  // POST /laporan
  .post('/', wajibWarga, async (c) => {
    const deviceId = c.get('deviceId')
    const hariIni = await repo.hitungHariIni(deviceId)
    if (hariIni >= ATURAN_LAPORAN.batasHarian) {
      throw new GalatDomain(KODE_GALAT.BATAS_HARIAN, `Maksimal ${ATURAN_LAPORAN.batasHarian} laporan per hari.`)
    }

    const rawInput = await c.req.json().catch(() => ({}))
    const input = sanitasiObjek(rawInput)
    const semuaLaporan = await repo.semua()
    const kode = await generateKodeUnik()

    const item = buatLaporan(input, {
      daftarWilayah: W,
      semuaLaporan,
      pelaporId: deviceId,
      kode,
    })

    await repo.simpan(item)
    return c.json({ data: tampilanPublik(item, deviceId) }, 201)
  })

  // POST /laporan/:kode/dukungan
  .post('/:kode/dukungan', wajibWarga, async (c) => {
    const kode = c.req.param('kode')
    const deviceId = c.get('deviceId')
    const item = await repo.cari(kode)
    if (!item) {
      throw new GalatDomain(KODE_GALAT.TIDAK_DITEMUKAN, `Laporan ${kode} tidak ditemukan.`)
    }

    if (item.pelaporId === deviceId || item.dukungan?.includes(deviceId)) {
      throw new GalatDomain(KODE_GALAT.SUDAH_DUKUNG, 'Kamu sudah tercatat mengalami masalah ini.')
    }

    const semuaLaporan = await repo.semua()
    const baru = hitungUlangPrioritas(
      { ...item, dukungan: [...(item.dukungan ?? []), deviceId] },
      { daftarWilayah: W, semuaLaporan },
    )

    await repo.simpan(baru)
    return c.json({ data: tampilanPublik(baru, deviceId) })
  })

  // POST /laporan/:kode/verifikasi
  .post('/:kode/verifikasi', wajibWarga, async (c) => {
    const kode = c.req.param('kode')
    const deviceId = c.get('deviceId')
    const item = await repo.cari(kode)
    if (!item) {
      throw new GalatDomain(KODE_GALAT.TIDAK_DITEMUKAN, `Laporan ${kode} tidak ditemukan.`)
    }

    const rawData = await c.req.json().catch(() => ({}))
    const data = sanitasiObjek(rawData)
    const v = { ...data, deviceId, waktu: new Date().toISOString() }
    const cek = periksaVerifikasi(item, v)
    if (!cek.sah) {
      throw new GalatDomain(KODE_GALAT.VERIFIKASI_DITOLAK, cek.alasan[0], cek)
    }

    let baru = { ...item, verifikasi: [...(item.verifikasi ?? []), { ...v, sah: true, cek }] }
    const ke = evaluasiVerifikasi(baru)
    if (ke) {
      baru = terapkanTransisi(baru, ke, { oleh: PERAN.SISTEM, catatan: catatanSistem(ke) })
    }

    await repo.simpan(baru)
    return c.json({ data: tampilanPublik(baru, deviceId) })
  })

  // POST /laporan/:kode/status
  // Catatan supervisi dari admin provinsi/pusat untuk laporan di wilayahnya (status TIDAK berubah).
  .post('/:kode/supervisi', wajibInstansi, async (c) => {
    const item = await repo.cari(c.req.param('kode'))
    if (!item) throw new GalatDomain(KODE_GALAT.TIDAK_DITEMUKAN, 'Laporan tidak ditemukan.')
    const akses = c.get('akses')
    if (!bolehSupervisi(akses))
      throw new GalatDomain(KODE_GALAT.DILARANG, 'Catatan supervisi hanya untuk admin provinsi/pusat.')
    if (!dalamAkses(item, akses, INDEKS_WILAYAH))
      throw new GalatDomain(KODE_GALAT.DILARANG, 'Laporan ini di luar wilayah kewenangan Anda.')
    const body = await c.req.json().catch(() => ({}))
    const catatan = sanitasiTeks(String(body?.catatan ?? '')).slice(0, 280)
    if (catatan.length < 5) throw new GalatDomain(KODE_GALAT.VALIDASI, 'Catatan supervisi minimal 5 karakter.')
    const info = c.get('instansi')
    const baru = {
      ...item,
      supervisi: [
        ...(item.supervisi ?? []),
        { tingkat: akses.tingkat, oleh: info?.petugas ?? 'Admin', catatan, waktu: new Date().toISOString() },
      ].slice(-20),
    }
    await repo.simpan(baru)
    return c.json({ data: tampilanPublik(baru) }, 201)
  })

  .post('/:kode/status', wajibInstansi, async (c) => {
    const kode = c.req.param('kode')
    const item = await repo.cari(kode)
    if (!item) {
      throw new GalatDomain(KODE_GALAT.TIDAK_DITEMUKAN, `Laporan ${kode} tidak ditemukan.`)
    }

    // Yurisdiksi: hanya admin kab/kota pemilik wilayah yang menangani laporan.
    const akses = c.get('akses')
    if (!bolehUbahStatus(akses))
      throw new GalatDomain(KODE_GALAT.DILARANG, 'Admin provinsi/pusat mengawasi; status diubah admin kab/kota.')
    if (!dalamAkses(item, akses, INDEKS_WILAYAH))
      throw new GalatDomain(KODE_GALAT.DILARANG, 'Laporan ini di luar wilayah kewenangan Anda.')

    const body = await c.req.json().catch(() => ({}))
    const { ke, catatan, tanggapan, buktiUrl } = body

    if (!ke) {
      throw new GalatDomain(KODE_GALAT.VALIDASI, 'Field ke wajib diisi.')
    }
    if (buktiUrl != null && buktiUrl !== '' && !urlFotoAman(buktiUrl)) {
      throw new GalatDomain(KODE_GALAT.VALIDASI, 'URL foto bukti tidak valid.')
    }

    let baru = terapkanTransisi(item, ke, {
      oleh: PERAN.INSTANSI,
      catatan: sanitasiTeks(catatan ?? ''),
      buktiUrl: buktiUrl || null,
    })

    if (tanggapan) {
      const instansiInfo = c.get('instansi')
      baru = {
        ...baru,
        tanggapan: {
          isi: sanitasiTeks(tanggapan),
          petugas: instansiInfo?.petugas || 'Dinas PUTR',
          waktu: new Date().toISOString(),
          buktiUrl: buktiUrl || null,
        },
      }
    }

    await repo.simpan(baru)
    const deviceId = c.get('deviceId')
    return c.json({ data: tampilanPublik(baru, deviceId) })
  })
