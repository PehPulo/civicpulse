import { describe, expect, it } from 'vitest'
import wilayahData from '../../../data/processed/wilayah.json'
import {
  GalatDomain,
  STATUS,
  buatLaporan,
  hitungSerupa,
  ringkasWilayah,
  statistik,
  tampilanPublik,
  wilayahSenyap,
} from '../src/index.js'

const W = wilayahData.wilayah
const WAKTU = '2026-11-07T00:00:00.000Z'
const input = {
  kategoriId: 'drainase',
  lat: -6.9876,
  lng: 107.6247,
  deskripsi: 'Saluran tersumbat sampah, air meluap.',
}

describe('buatLaporan', () => {
  it('mendeteksi wilayah, status awal diterima, skor ada', () => {
    const l = buatLaporan(input, {
      daftarWilayah: W,
      semuaLaporan: [],
      pelaporId: 'p1',
      kode: 'CP-2026-1111',
      waktu: WAKTU,
    })
    expect(l.wilayahId).toBe('dayeuhkolot')
    expect(l.status).toBe(STATUS.DITERIMA)
    expect(l.riwayat).toHaveLength(1)
    expect(l.prioritas.skor).toBeGreaterThan(0)
  })

  it('validasi: deskripsi terlalu pendek', () => {
    expect(() =>
      buatLaporan({ ...input, deskripsi: 'pendek' }, { daftarWilayah: W, semuaLaporan: [], pelaporId: 'p', kode: 'x' }),
    ).toThrow(GalatDomain)
  })
})

describe('tampilanPublik (privasi)', () => {
  const l = buatLaporan(input, {
    daftarWilayah: W,
    semuaLaporan: [],
    pelaporId: 'p1',
    kode: 'CP-2026-1111',
    waktu: WAKTU,
  })
  l.dukungan = ['d1', 'd2']
  l.verifikasi = [{ deviceId: 'v1', beres: true, lat: 1, lng: 2, waktu: WAKTU, sah: true }]

  it('tidak membocorkan identitas perangkat atau lokasi verifikator', () => {
    const json = JSON.stringify(tampilanPublik(l, 'orang-lain'))
    for (const rahasia of ['p1', 'd1', 'v1', '"lat":1']) expect(json).not.toContain(rahasia)
  })

  it('menghitung `saya` dari deviceId peminta', () => {
    expect(tampilanPublik(l, 'p1').saya).toEqual({ pelapor: true, dukung: false, verifikasi: false })
    expect(tampilanPublik(l, 'd2').saya.dukung).toBe(true)
    expect(tampilanPublik(l).jumlahDukungan).toBe(2)
  })
})

describe('hitungSerupa', () => {
  const lain = (pelaporId, ekstra = {}) => ({
    kode: pelaporId,
    kategoriId: 'drainase',
    lat: -6.9878,
    lng: 107.6249,
    dibuat: '2026-11-01T00:00:00.000Z',
    pelaporId,
    dukungan: [],
    ...ekstra,
  })
  it('menghitung pelapor unik dalam 500 m dan 30 hari', () => {
    const semua = [
      lain('a'),
      lain('b', { dukungan: ['a', 'c'] }),
      lain('jauh', { lat: -6.9, lng: 107.6 }),
      lain('lama', { dibuat: '2026-09-01T00:00:00.000Z' }),
      lain('beda', { kategoriId: 'jalan' }),
    ]
    expect(hitungSerupa(semua, { ...input, waktu: WAKTU, pelaporId: 'saya' })).toBe(3) // a, b, c
  })
})

describe('analitik', () => {
  it('wilayah risiko tinggi tanpa laporan terdeteksi senyap', () => {
    const ramai = Array.from({ length: 6 }, (_, i) => ({
      kode: `k${i}`,
      wilayahId: 'coblong',
      status: STATUS.DITERIMA,
      dibuat: '2026-11-01T00:00:00.000Z',
      riwayat: [],
    }))
    const senyap = wilayahSenyap(ringkasWilayah(ramai, W, WAKTU)).map((w) => w.wilayahId)
    expect(senyap).toContain('cisarua')
    expect(senyap).not.toContain('coblong')
  })

  it('statistik punya bentuk sesuai kontrak GET /statistik', () => {
    const s = statistik([], W, WAKTU)
    expect(s).toMatchObject({ total: 0, persenTerverifikasi: 0, medianHariTangani: null })
    expect(s.mingguan).toHaveLength(8)
    expect(s.perWilayah).toHaveLength(W.length)
  })
})
