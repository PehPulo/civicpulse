import { describe, expect, it } from 'vitest'
import wilayahData from '../../../data/processed/wilayah.json'
import { STATUS, evaluasiVerifikasi, statistik } from '@civicpulse/core'
import { buatSeed } from '../src/services/seed.js'

const W = wilayahData.wilayah
const seed = buatSeed(W, Date.parse('2026-11-07T08:00:00.000Z'))

describe('seed demo', () => {
  it('jumlah & kode unik', () => {
    expect(seed.length).toBe(38)
    expect(new Set(seed.map((l) => l.kode)).size).toBe(seed.length)
  })

  it('laporan demo CP-2026-0417 siap diverifikasi (1/3)', () => {
    const l = seed.find((x) => x.kode === 'CP-2026-0417')
    expect(l.status).toBe(STATUS.KLAIM_SELESAI)
    expect(l.verifikasi).toHaveLength(1)
    expect(evaluasiVerifikasi(l, '2026-11-07T08:00:00.000Z')).toBeNull() // tidak langsung dibuka ulang
  })

  it('semua status tampil agar dasbor & peta bervariasi', () => {
    const ada = new Set(seed.map((l) => l.status))
    for (const s of [STATUS.DITERIMA, STATUS.DIPROSES, STATUS.KLAIM_SELESAI, STATUS.TERVERIFIKASI])
      expect(ada).toContain(s)
  })

  it('wilayah rawan pinggiran terdeteksi "senyap"', () => {
    const senyap = statistik(seed, W, '2026-11-07T08:00:00.000Z').wilayahSenyap.map((w) => w.wilayahId)
    expect(senyap).toEqual(expect.arrayContaining(['cisarua']))
    expect(senyap).not.toContain('coblong')
  })
})
