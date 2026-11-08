import { describe, expect, it } from 'vitest'
import {
  TINGKAT,
  agregatWilayah,
  bolehSupervisi,
  bolehUbahStatus,
  buatSeed,
  dalamAkses,
  gabungWilayah,
  hitungPrioritas,
  namaLokasi,
  skorKinerjaWilayah,
  validasiAkses,
} from '../src/index.js'
import pilot from '../../../data/processed/wilayah.json' with { type: 'json' }
import nasional from '../../../data/processed/nasional.json' with { type: 'json' }

const W = gabungWilayah(pilot.wilayah, nasional)
const IDX = new Map(W.map((w) => [w.id, w]))
const T0 = Date.parse('2026-11-08T08:00:00.000Z')

describe('data nasional', () => {
  it('34 provinsi dan 514 kab/kota, setiap kab/kota punya provinsi yang ada', () => {
    expect(nasional.provinsi).toHaveLength(34)
    expect(nasional.kabkota).toHaveLength(514)
    const pv = new Set(nasional.provinsi.map((p) => p.id))
    expect(nasional.kabkota.every((k) => pv.has(k.provinsiId))).toBe(true)
    expect(nasional.provinsi.find((p) => p.id === 'jawa-barat').jumlahKabkota).toBe(27)
  })

  it('gabungWilayah: pilot tetap asli, kab/kota lain ilustrasi deterministik', () => {
    const asli = W.filter((w) => !w.ilustrasi)
    expect(asli).toHaveLength(pilot.wilayah.length)
    expect(asli.every((w) => w.provinsiId === 'jawa-barat' && w.kabkotaId)).toBe(true)
    expect(W.some((w) => w.id === 'kk-kota-bandung')).toBe(false) // tercakup pilot
    const sby = W.find((w) => w.id === 'kk-kota-surabaya')
    expect(sby).toMatchObject({ provinsiId: 'jawa-timur', ilustrasi: true })
    expect(gabungWilayah(pilot.wilayah, nasional).find((w) => w.id === 'kk-kota-surabaya')).toEqual(sby)
    expect(namaLokasi(sby)).toBe('Kota Surabaya')
    expect(namaLokasi(asli[0])).toMatch(/^Kec\. /)
    expect(hitungPrioritas(sby, 'banjir').faktor[0].sumber).toMatch(/Ilustrasi/)
  })
})

describe('tingkat admin & yurisdiksi', () => {
  const seed = buatSeed(W, T0)
  const lapJabar = seed.find((l) => l.kabkotaId === 'bandung')
  const lapJatim = seed.find((l) => l.provinsiId === 'jawa-timur')

  it('validasiAkses mengisi provinsi dari kab/kota dan menolak wilayah palsu', () => {
    expect(validasiAkses({ tingkat: 'kabkota', kabkotaId: 'kota-surabaya' }, nasional)).toEqual({
      tingkat: 'kabkota',
      provinsiId: 'jawa-timur',
      kabkotaId: 'kota-surabaya',
    })
    expect(validasiAkses({ tingkat: 'pusat', provinsiId: 'x' }, nasional).provinsiId).toBeNull()
    expect(() => validasiAkses({ tingkat: 'provinsi', provinsiId: 'atlantis' }, nasional)).toThrow()
    expect(() => validasiAkses({ tingkat: 'raja' }, nasional)).toThrow()
  })

  it('dalamAkses: kab/kota ⊂ provinsi ⊂ pusat', () => {
    const kab = { tingkat: TINGKAT.KABKOTA, provinsiId: 'jawa-barat', kabkotaId: 'bandung' }
    const prov = { tingkat: TINGKAT.PROVINSI, provinsiId: 'jawa-barat' }
    const pusat = { tingkat: TINGKAT.PUSAT }
    expect(dalamAkses(lapJabar, kab, IDX)).toBe(true)
    expect(dalamAkses(lapJatim, kab, IDX)).toBe(false)
    expect(dalamAkses(lapJabar, prov, IDX)).toBe(true)
    expect(dalamAkses(lapJatim, prov, IDX)).toBe(false)
    expect(dalamAkses(lapJatim, pusat, IDX)).toBe(true)
    // laporan lama tanpa kabkotaId tetap dikenali lewat wilayahnya
    const { kabkotaId: _k, provinsiId: _p, ...lama } = lapJabar
    expect(dalamAkses(lama, kab, IDX)).toBe(true)
  })

  it('wewenang: kab/kota menangani, provinsi/pusat mengawasi', () => {
    expect(bolehUbahStatus({ tingkat: 'kabkota' })).toBe(true)
    expect(bolehUbahStatus({ tingkat: 'provinsi' })).toBe(false)
    expect(bolehSupervisi({ tingkat: 'pusat' })).toBe(true)
    expect(bolehSupervisi({ tingkat: 'kabkota' })).toBe(false)
  })

  it('agregatWilayah: jumlah per provinsi = total laporan', () => {
    const ag = agregatWilayah(seed, 'provinsiId', IDX, new Date(T0).toISOString())
    expect([...ag.values()].reduce((s, a) => s + a.total, 0)).toBe(seed.length)
    expect(ag.size).toBe(34)
    for (const a of ag.values()) {
      expect(a.terbuka).toBeLessThanOrEqual(a.total)
      expect(a.lewatSla).toBeLessThanOrEqual(a.terbuka)
    }
  })

  it('skorKinerjaWilayah: bobot 50/30/20, komponen kosong dibagi ulang', () => {
    expect(skorKinerjaWilayah({ total: 0 })).toBeNull()
    // 80% tepat, 50% terverifikasi, 2 dari 10 terbuka lewat ⇒ 0,5·80 + 0,3·50 + 0,2·80 = 71
    expect(skorKinerjaWilayah({ total: 12, terbuka: 10, lewatSla: 2, persenTepat: 80, persenTerverifikasi: 50 })).toBe(
      71,
    )
    // belum ada klaim ⇒ hanya komponen lewat target: 1 dari 4 lewat ⇒ 75
    expect(
      skorKinerjaWilayah({ total: 4, terbuka: 4, lewatSla: 1, persenTepat: null, persenTerverifikasi: null }),
    ).toBe(75)
  })
})
