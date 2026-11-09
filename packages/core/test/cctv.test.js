import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { arahMataAngin, cctvTerdekat, drafPermintaanRekaman, portalCctv } from '../src/index.js'

const data = JSON.parse(readFileSync(new URL('../../../data/processed/cctv.json', import.meta.url), 'utf-8'))
const nasional = JSON.parse(readFileSync(new URL('../../../data/processed/nasional.json', import.meta.url), 'utf-8'))

const kamera = [
  { nama: 'A', lat: -6.9218, lng: 107.6119, portal: 'kota-bandung' },
  { nama: 'B', lat: -6.9175, lng: 107.6191, portal: 'kota-bandung' },
  { nama: 'Jauh', lat: -6.95, lng: 107.69, portal: 'kota-bandung' },
]

describe('CCTV publik terdekat', () => {
  it('menyaring radius, mengurutkan jarak, memberi arah', () => {
    const h = cctvTerdekat({ lat: -6.9215, lng: 107.6115 }, kamera)
    expect(h.map((c) => c.nama)).toEqual(['A', 'B'])
    expect(h[0].jarakM).toBeLessThan(100)
    expect(h[1].arah).toBe('timur laut')
    expect(cctvTerdekat({ lat: null, lng: 1 }, kamera)).toEqual([])
  })

  it('arah mata angin dasar', () => {
    expect(arahMataAngin(0, 0, 1, 0)).toBe('utara')
    expect(arahMataAngin(0, 0, 0, -1)).toBe('barat')
    expect(arahMataAngin(0, 0, -1, 1)).toBe('tenggara')
  })

  it('portal kab/kota didahulukan, lalu provinsi', () => {
    const p = portalCctv({ kabkotaId: 'kota-jakarta-pusat', provinsiId: 'dki-jakarta' }, data.portal)
    expect(p.map((x) => x.id)).toEqual(['dki-jakarta'])
    expect(portalCctv({ kabkotaId: 'kota-bandung', provinsiId: 'jawa-barat' }, data.portal)[0].id).toBe('kota-bandung')
  })

  it('draf permintaan memuat kode, jendela waktu, dan kamera', () => {
    const laporan = {
      kode: 'CP-1',
      judul: 'Jalan berlubang',
      lat: -6.9215,
      lng: 107.6115,
      dibuat: '2026-11-01T03:00:00Z',
    }
    const t = drafPermintaanRekaman({ laporan, kamera: cctvTerdekat(laporan, kamera), portal: data.portal[0] })
    expect(t).toContain('CP-1')
    expect(t).toMatch(/09\.00 s\.d\. .*11\.00 WIB/)
    expect(t).toContain('1. A')
  })

  it('dataset: wilayah valid, koordinat di Indonesia, tiap kamera punya portal resmi .go.id', () => {
    const kab = new Set(nasional.kabkota.map((k) => k.id))
    const prov = new Set(nasional.provinsi.map((p) => p.id))
    const portal = new Map(data.portal.map((p) => [p.id, p]))
    for (const p of data.portal) {
      expect(p.tingkat === 'provinsi' ? prov.has(p.wilayahId) : kab.has(p.wilayahId)).toBe(true)
      expect(new URL(p.url).hostname.endsWith('.go.id')).toBe(true)
    }
    expect(data.kamera.length).toBeGreaterThan(100)
    for (const c of data.kamera) {
      expect(portal.has(c.portal)).toBe(true)
      expect(c.lat).toBeGreaterThan(-11.5)
      expect(c.lat).toBeLessThan(6.5)
      expect(c.lng).toBeGreaterThan(94)
      expect(c.lng).toBeLessThan(141.5)
    }
  })
})
