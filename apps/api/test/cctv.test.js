// GET /cctv/laporan/:kode — hanya petugas login, hanya laporan dalam yurisdiksi, hanya kamera terdekat.
import { beforeEach, describe, expect, it } from 'vitest'
import { buatApp } from '../src/app.js'
import { _resetMemori } from '../src/repositories/laporan.js'

const app = buatApp()
const req = (path, init) => app.request(`/api/v1${path}`, init)
const DEVICE = '22222222-2222-4222-8222-222222222222'

async function token(username) {
  const r = await req('/auth/instansi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password: 'civicpulse2026' }),
  })
  return (await r.json()).data.token
}

async function laporanDekatAsiaAfrika() {
  const r = await req('/laporan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Device-Id': DEVICE },
    body: JSON.stringify({
      kategoriId: 'jalan',
      lat: -6.9228,
      lng: 107.6107,
      deskripsi: 'Jalan berlubang dekat Asia Afrika.',
    }),
  })
  return (await r.json()).data.kode
}

describe('CCTV publik lewat backend', () => {
  beforeEach(() => _resetMemori())

  it('tanpa token 401; token palsu 401; kode tidak valid 400', async () => {
    const kode = await laporanDekatAsiaAfrika()
    expect((await req(`/cctv/laporan/${kode}`)).status).toBe(401)
    const palsu = await req(`/cctv/laporan/${kode}`, { headers: { Authorization: 'Bearer abc.def.ghi' } })
    expect(palsu.status).toBe(401)
    const t = await token('admin.kota-bandung')
    const aneh = await req('/cctv/laporan/..%2Fetc', { headers: { Authorization: `Bearer ${t}` } })
    expect(aneh.status).toBe(400)
  })

  it('admin kab/kota lain ditolak 403; admin wilayahnya & provinsinya mendapat kamera terdekat saja', async () => {
    const kode = await laporanDekatAsiaAfrika()
    const luar = await req(`/cctv/laporan/${kode}`, {
      headers: { Authorization: `Bearer ${await token('admin.kota-malang')}` },
    })
    expect(luar.status).toBe(403)

    for (const u of ['admin.kota-bandung', 'admin.jawa-barat', 'admin.pusat']) {
      const r = await req(`/cctv/laporan/${kode}`, { headers: { Authorization: `Bearer ${await token(u)}` } })
      expect(r.status).toBe(200)
      expect(r.headers.get('cache-control')).toContain('no-store')
      const { data } = await r.json()
      expect(data.jauh).toBe(false)
      expect(data.kamera.length).toBeGreaterThan(0)
      expect(data.kamera.length).toBeLessThanOrEqual(5)
      expect(data.kamera.every((c) => c.jarakM <= 1000)).toBe(true)
      expect(data.kamera.map((c) => c.nama)).toContain('Tamblong - Asia Afrika')
      expect(data.kamera[0].portal.url).toMatch(/^https:\/\/[^/]+\.go\.id\//)
      expect(data.portal[0].id).toBe('kota-bandung')
    }
  })

  it('respons API membawa CSP ketat & HSTS', async () => {
    const r = await req('/health')
    expect(r.headers.get('content-security-policy')).toBe("default-src 'none'; frame-ancestors 'none'")
    expect(r.headers.get('strict-transport-security')).toContain('max-age=')
    const docs = await req('/docs')
    expect(docs.headers.get('content-security-policy')).toBeNull()
  })
})
