import { describe, expect, it } from 'vitest'
import { BIAYA_SATUAN_ASUMSI, estimasiAnggaran, indeksKerentanan, rencanaKerja, reguMinimal } from '../src/index.js'

const T0 = '2026-11-08T00:00:00.000Z'
const hariLalu = (n) => new Date(Date.parse(T0) - n * 86_400_000).toISOString()
// level Rendah ⇒ target 14 hari
const lap = (kode, umurHari, { status = 'diterima', skor = 30, kategoriId = 'jalan', wilayahId = 'w1' } = {}) => ({
  kode,
  status,
  kategoriId,
  wilayahId,
  dibuat: hariLalu(umurHari),
  prioritas: { skor, level: 'Rendah' },
  riwayat: [],
})

describe('rencanaKerja', () => {
  const daftar = [lap('A', 13), lap('B', 1), lap('C', 20), lap('D', 5), lap('E', 2, { status: 'terverifikasi' })]

  it('hanya laporan terbuka, tenggat terdekat dulu (EDF), slot = regu × kapasitas per hari', () => {
    const r = rencanaKerja(daftar, { regu: 1, kapasitas: 1, sekarang: T0 })
    expect(r.total).toBe(4)
    expect(r.tugas.map((t) => t.kode)).toEqual(['C', 'A', 'D', 'B'])
    expect(r.tugas.map((t) => t.hari)).toEqual([1, 2, 3, 4])
    expect(r.hari).toBe(4)
    // C sudah lewat (20 > 14). A: tenggat 1 hari lagi, dijadwalkan hari ke-2 ⇒ terlambat baru.
    expect(r).toMatchObject({ sudahLewat: 1, terlambat: 2, terlambatBaru: 1 })
  })

  it('regu tambahan menyelamatkan yang belum lewat; reguMinimal menemukannya', () => {
    const r2 = rencanaKerja(daftar, { regu: 2, kapasitas: 1, sekarang: T0 })
    expect(r2.tugas.find((t) => t.kode === 'A')).toMatchObject({ hari: 1, regu: 2, terlambat: false })
    expect(r2.terlambatBaru).toBe(0)
    expect(r2.perRegu).toEqual([2, 2])
    expect(reguMinimal(daftar, { kapasitas: 1, sekarang: T0 })).toBe(2)
  })
})

describe('estimasiAnggaran', () => {
  it('jumlah terbuka per kategori × biaya satuan; laporan selesai tidak dihitung', () => {
    const e = estimasiAnggaran([
      lap('A', 1, { kategoriId: 'jalan' }),
      lap('B', 1, { kategoriId: 'jalan' }),
      lap('C', 1, { kategoriId: 'longsor' }),
      lap('D', 1, { kategoriId: 'longsor', status: 'terverifikasi' }),
    ])
    expect(e.jumlah).toBe(3)
    expect(e.total).toBe(2 * BIAYA_SATUAN_ASUMSI.jalan + BIAYA_SATUAN_ASUMSI.longsor)
    expect(estimasiAnggaran([lap('A', 1)], { jalan: 1000 }).total).toBe(1000)
    expect(estimasiAnggaran([lap('A', 1)], { jalan: -5 }).total).toBe(0)
  })
})

describe('indeksKerentanan', () => {
  const wilayah = [
    { id: 'w1', miskin: 10, provinsiId: 'p1' },
    { id: 'w2', miskin: 5, provinsiId: 'p1' },
    { id: 'w3', miskin: 2, provinsiId: 'p2' },
  ]
  const laporan = [
    lap('A', 20, { wilayahId: 'w1' }),
    lap('B', 1, { wilayahId: 'w1' }),
    lap('C', 1, { wilayahId: 'w2' }),
  ]

  it('50% kemiskinan + 30% beban terbuka + 20% porsi lewat target', () => {
    const h = indeksKerentanan(wilayah, laporan, 'id', T0)
    // w1: 50·1 + 30·(2/2) + 20·(1/2) = 90 · w2: 50·0,5 + 30·0,5 + 0 = 40 · w3: 50·0,2 = 10
    expect(h.map((x) => [x.id, x.skor, x.level])).toEqual([
      ['w1', 90, 'Tinggi'],
      ['w2', 40, 'Sedang'],
      ['w3', 10, 'Rendah'],
    ])
  })

  it('agregasi per provinsi: kemiskinan = rata-rata wilayah, laporan dijumlah', () => {
    const p = indeksKerentanan(wilayah, laporan, 'provinsiId', T0)
    expect(p.find((x) => x.id === 'p1')).toMatchObject({ miskin: 7.5, terbuka: 3, lewatSla: 1 })
    expect(p.find((x) => x.id === 'p2')).toMatchObject({ miskin: 2, terbuka: 0 })
  })
})
