// Tes kontrak lengkap API CivicPulse (docs/API.md & docs/openapi.yaml).
import { beforeEach, describe, expect, it } from 'vitest'
import { buatApp } from '../src/app.js'
import { _resetMemori } from '../src/repositories/laporan.js'

const app = buatApp()
const req = (path, init) => app.request(`/api/v1${path}`, init)

const DEVICE_1 = '11111111-1111-4111-8111-111111111111'
const DEVICE_2 = '22222222-2222-4222-8222-222222222222'
const DEVICE_3 = '33333333-3333-4333-8333-333333333333'
const DEVICE_4 = '44444444-4444-4444-8444-444444444444'

// Helper fake valid JPEG bytes (FF D8 FF E0 ...)
function buatFakeJpegBlob() {
  const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01])
  return new Blob([bytes], { type: 'image/jpeg' })
}

describe('apps/api (Kontrak Lengkap & Best Practice)', () => {
  beforeEach(() => {
    _resetMemori([])
  })

  it('GET /health mengembalikan status ok dan versi', async () => {
    const res = await req('/health')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.ok).toBe(true)
    expect(body.data.mode).toBe('server')
    expect(body.data.versi).toBe('1.0.0')
  })

  it('Security headers & OpenAPI docs aktif', async () => {
    const resDocs = await req('/docs')
    expect(resDocs.status).toBe(200)
    expect(resDocs.headers.get('x-frame-options')).toBe('DENY')
    expect(resDocs.headers.get('x-content-type-options')).toBe('nosniff')

    const resSpec = await req('/openapi.json')
    expect(resSpec.status).toBe(200)
    const spec = await resSpec.json()
    expect(spec.info.title).toBe('CivicPulse API')
  })

  it('GET /wilayah mengembalikan dataset pilot', async () => {
    const res = await req('/wilayah')
    expect(res.status).toBe(200)
    const { data } = await res.json()
    expect(data.wilayah.length).toBeGreaterThan(0)
    expect(data.wilayah[0]).toHaveProperty('id')
    expect(data.wilayah[0]).toHaveProperty('risiko')
  })

  it('POST /auth/instansi menolak password salah (401) dan menerima akun benar (200 + JWT)', async () => {
    const salah = await req('/auth/instansi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin.kota-bandung', password: 'salah' }),
    })
    expect(salah.status).toBe(401)
    const err = await salah.json()
    expect(err.error.kode).toBe('TIDAK_BERWENANG')

    const benar = await req('/auth/instansi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin.kota-bandung', password: 'civicpulse2026' }),
    })
    expect(benar.status).toBe(200)
    const { data } = await benar.json()
    expect(data.token).toBeDefined()
    expect(data.petugas).toContain('Petugas')
  })

  it('Alur lengkap: POST /laporan -> GET -> dukung -> status -> verifikasi -> statistik (dengan sanitasi XSS)', async () => {
    // 1. POST /laporan tanpa header device id => 400
    const errDevice = await req('/laporan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kategoriId: 'jalan',
        lat: -6.9876,
        lng: 107.6247,
        deskripsi: 'Jalan berlubang cukup parah dan berbahaya.',
      }),
    })
    expect(errDevice.status).toBe(400)
    expect((await errDevice.json()).error.kode).toBe('VALIDASI')

    // 2. POST /laporan berhasil & teks disanitasi dari tag berbahaya
    const buatRes = await req('/laporan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Id': DEVICE_1,
      },
      body: JSON.stringify({
        kategoriId: 'jalan',
        lat: -6.9876,
        lng: 107.6247,
        deskripsi: '<script>alert(1)</script>Jalan berlubang cukup parah.',
      }),
    })
    expect(buatRes.status).toBe(201)
    const { data: laporan1 } = await buatRes.json()
    expect(laporan1.kode).toMatch(/^CP-\d{4}-\d{4}$/)
    expect(laporan1.status).toBe('diterima')
    expect(laporan1.deskripsi).toBe('scriptalert(1)/scriptJalan berlubang cukup parah.')
    expect(laporan1.saya.pelapor).toBe(true)
    expect(laporan1.jumlahDukungan).toBe(0)

    const kode = laporan1.kode

    // 3. GET /laporan/:kode
    const getRes = await req(`/laporan/${kode}`, {
      headers: { 'X-Device-Id': DEVICE_2 },
    })
    expect(getRes.status).toBe(200)
    const { data: detail } = await getRes.json()
    expect(detail.kode).toBe(kode)
    expect(detail.saya.pelapor).toBe(false)

    // 4. POST /laporan/:kode/dukungan oleh pelapor sendiri => 409 SUDAH_DUKUNG
    const dukungPelapor = await req(`/laporan/${kode}/dukungan`, {
      method: 'POST',
      headers: { 'X-Device-Id': DEVICE_1 },
    })
    expect(dukungPelapor.status).toBe(409)
    expect((await dukungPelapor.json()).error.kode).toBe('SUDAH_DUKUNG')

    // POST dukungan oleh DEVICE_2 => sukses
    const dukung2 = await req(`/laporan/${kode}/dukungan`, {
      method: 'POST',
      headers: { 'X-Device-Id': DEVICE_2 },
    })
    expect(dukung2.status).toBe(200)
    const { data: laporanDukung } = await dukung2.json()
    expect(laporanDukung.jumlahDukungan).toBe(1)
    expect(laporanDukung.saya.dukung).toBe(true)

    // Dukung lagi oleh DEVICE_2 => 409
    const dukungLagi = await req(`/laporan/${kode}/dukungan`, {
      method: 'POST',
      headers: { 'X-Device-Id': DEVICE_2 },
    })
    expect(dukungLagi.status).toBe(409)

    // 5. POST /laporan/:kode/status tanpa token instansi => 401
    const statusTanpaAuth = await req(`/laporan/${kode}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ke: 'diproses' }),
    })
    expect(statusTanpaAuth.status).toBe(401)

    // Yurisdiksi: admin kab/kota lain dan admin provinsi tidak boleh mengubah status (403)
    const login = async (body) =>
      (
        await (
          await req('/auth/instansi', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
        ).json()
      ).data.token
    for (const t of [
      await login({ username: 'admin.kota-bandung', password: 'civicpulse2026' }),
      await login({ username: 'admin.jawa-barat', password: 'civicpulse2026' }),
    ]) {
      const r = await req(`/laporan/${kode}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify({ ke: 'diproses' }),
      })
      expect(r.status).toBe(403)
    }
    // Admin provinsi boleh memberi catatan supervisi; admin provinsi lain tidak
    const tProv = await login({ username: 'admin.jawa-barat', password: 'civicpulse2026' })
    const tProvLain = await login({ username: 'admin.jawa-timur', password: 'civicpulse2026' })
    const sup = (t) =>
      req(`/laporan/${kode}/supervisi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify({ catatan: 'Mohon dipercepat, sudah lewat target.' }),
      })
    expect((await sup(tProv)).status).toBe(201)
    expect((await sup(tProvLain)).status).toBe(403)

    // Login admin kab/kota pemilik wilayah (Dayeuhkolot ⇒ Kab. Bandung)
    const token = await login({ username: 'admin.bandung', password: 'civicpulse2026' })

    // Ubah status ke diproses
    const statusDiproses = await req(`/laporan/${kode}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ke: 'diproses', catatan: 'Tim jalan disiapkan.' }),
    })
    expect(statusDiproses.status).toBe(200)
    expect((await statusDiproses.json()).data.status).toBe('diproses')

    // Ubah status ke klaim_selesai dengan tanggapan
    const statusKlaim = await req(`/laporan/${kode}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ke: 'klaim_selesai',
        catatan: 'Pengaspalan selesai dilakukan.',
        tanggapan: 'Perbaikan jalan telah selesai dikerjakan.',
      }),
    })
    expect(statusKlaim.status).toBe(200)
    const klaimJson = await statusKlaim.json()
    expect(klaimJson.data.status).toBe('klaim_selesai')
    expect(klaimJson.data.tanggapan.isi).toContain('selesai')

    // 6. Verifikasi warga
    const waktuSekarang = new Date().toISOString()
    // Pelapor sendiri verifikasi => 422
    const verifPelapor = await req(`/laporan/${kode}/verifikasi`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Id': DEVICE_1,
      },
      body: JSON.stringify({
        beres: true,
        fotoUrl: 'https://storage/foto1.jpg',
        lat: -6.9876,
        lng: 107.6247,
        waktuFoto: waktuSekarang,
      }),
    })
    expect(verifPelapor.status).toBe(422)
    expect((await verifPelapor.json()).error.kode).toBe('VERIFIKASI_DITOLAK')

    // Verifikasi sah 1 oleh DEVICE_2
    const v1 = await req(`/laporan/${kode}/verifikasi`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Id': DEVICE_2,
      },
      body: JSON.stringify({
        beres: true,
        fotoUrl: 'https://storage/foto1.jpg',
        lat: -6.9876,
        lng: 107.6247,
        waktuFoto: waktuSekarang,
      }),
    })
    expect(v1.status).toBe(200)
    expect((await v1.json()).data.status).toBe('klaim_selesai')

    // Verifikasi sah 2 oleh DEVICE_3
    const v2 = await req(`/laporan/${kode}/verifikasi`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Id': DEVICE_3,
      },
      body: JSON.stringify({
        beres: true,
        fotoUrl: 'https://storage/foto2.jpg',
        lat: -6.9876,
        lng: 107.6247,
        waktuFoto: waktuSekarang,
      }),
    })
    expect(v2.status).toBe(200)

    // Verifikasi sah 3 oleh DEVICE_4 => otomatis bertransisi ke terverifikasi
    const v3 = await req(`/laporan/${kode}/verifikasi`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Id': DEVICE_4,
      },
      body: JSON.stringify({
        beres: true,
        fotoUrl: 'https://storage/foto3.jpg',
        lat: -6.9876,
        lng: 107.6247,
        waktuFoto: waktuSekarang,
      }),
    })
    expect(v3.status).toBe(200)
    const hasilAkhir = await v3.json()
    expect(hasilAkhir.data.status).toBe('terverifikasi')

    // 7. GET /statistik
    const statRes = await req('/statistik')
    expect(statRes.status).toBe(200)
    const { data: statData } = await statRes.json()
    expect(statData.total).toBe(1)
    expect(statData.persenTerverifikasi).toBe(100)
  })

  it('POST /unggah memvalidasi magic bytes dan menolak file spoofing/non-gambar', async () => {
    // 1. Tanpa file
    const resTanpaFile = await req('/unggah', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(resTanpaFile.status).toBe(400)

    // 2. Berkas teks yang menyamar jadi JPEG (spoofing) => ditolak 400
    const formPalsu = new FormData()
    formPalsu.append('file', new Blob(['bukan gambar sama sekali'], { type: 'image/jpeg' }), 'palsu.jpg')
    const resPalsu = await req('/unggah', { method: 'POST', body: formPalsu })
    expect(resPalsu.status).toBe(400)
    expect((await resPalsu.json()).error.pesan).toContain('bukan format gambar valid')

    // 3. Berkas JPEG asli (dengan header magic bytes FF D8 FF) => 201
    const formAsli = new FormData()
    formAsli.append('file', buatFakeJpegBlob(), 'asli.jpg')
    const resAsli = await req('/unggah', { method: 'POST', body: formAsli })
    expect(resAsli.status).toBe(201)
    const { data } = await resAsli.json()
    expect(data.url).toMatch(/^data:image\/jpeg;base64,/)
  })

  it('Batas harian pelaporan 5 per hari per deviceId', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await req('/laporan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Id': DEVICE_1,
        },
        body: JSON.stringify({
          kategoriId: 'jalan',
          lat: -6.9876,
          lng: 107.6247,
          deskripsi: `Laporan ke-${i + 1} jalan berlubang cukup parah.`,
        }),
      })
      expect(res.status).toBe(201)
    }

    // Laporan ke-6 ditolak batas harian
    const resKe6 = await req('/laporan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Id': DEVICE_1,
      },
      body: JSON.stringify({
        kategoriId: 'jalan',
        lat: -6.9876,
        lng: 107.6247,
        deskripsi: 'Laporan ke-6 jalan berlubang cukup parah.',
      }),
    })
    expect(resKe6.status).toBe(429)
    expect((await resKe6.json()).error.kode).toBe('BATAS_HARIAN')
  })
})
