import { describe, expect, it } from 'vitest'
import { PERAN, STATUS, evaluasiVerifikasi, periksaVerifikasi } from '../src/index.js'

const KLAIM = '2026-11-05T00:00:00.000Z'
const lap = (verifikasi = []) => ({
  kode: 'CP-2026-0002',
  lat: -6.9876,
  lng: 107.6247,
  pelaporId: 'pelapor',
  status: STATUS.KLAIM_SELESAI,
  riwayat: [
    { status: STATUS.DITERIMA, waktu: '2026-11-01T00:00:00.000Z', oleh: PERAN.SISTEM },
    { status: STATUS.DIPROSES, waktu: '2026-11-02T00:00:00.000Z', oleh: PERAN.INSTANSI },
    { status: STATUS.KLAIM_SELESAI, waktu: KLAIM, oleh: PERAN.INSTANSI },
  ],
  verifikasi,
})
const v = (deviceId, beres, ekstra = {}) => ({
  deviceId,
  beres,
  lat: -6.9877,
  lng: 107.6248,
  waktu: '2026-11-06T00:00:00.000Z',
  waktuFoto: '2026-11-06T00:00:00.000Z',
  sah: true,
  ...ekstra,
})

describe('periksaVerifikasi', () => {
  it('sah bila dekat, setelah klaim, dan bukan pelapor', () => {
    expect(periksaVerifikasi(lap(), v('w1', true)).sah).toBe(true)
  })

  it('ditolak bila di luar radius 200 m', () => {
    const r = periksaVerifikasi(lap(), v('w1', true, { lat: -6.99, lng: 107.64 }))
    expect(r.sah).toBe(false)
    expect(r.lokasiOk).toBe(false)
  })

  it('ditolak bila foto diambil sebelum klaim', () => {
    expect(periksaVerifikasi(lap(), v('w1', true, { waktuFoto: '2026-11-04T00:00:00.000Z' })).waktuOk).toBe(false)
  })

  it('pelapor tidak boleh memverifikasi sendiri', () => {
    expect(periksaVerifikasi(lap(), v('pelapor', true)).sah).toBe(false)
  })

  it('satu perangkat hanya sekali per siklus', () => {
    expect(periksaVerifikasi(lap([v('w1', true)]), v('w1', true)).sah).toBe(false)
  })

  it('AI hanya memberi tanda, tidak menggugurkan', () => {
    const r = periksaVerifikasi(lap(), v('w1', true, { ai: { beres: false, yakin: 0.9 } }))
    expect(r.sah).toBe(true)
    expect(r.aiMeragukan).toBe(true)
  })
})

describe('evaluasiVerifikasi', () => {
  const sekarang = '2026-11-07T00:00:00.000Z'
  it('3 "beres" ⇒ terverifikasi', () => {
    expect(evaluasiVerifikasi(lap([v('a', true), v('b', true), v('c', true)]), sekarang)).toBe(STATUS.TERVERIFIKASI)
  })
  it('mayoritas "belum" ⇒ dibuka ulang', () => {
    expect(evaluasiVerifikasi(lap([v('a', false), v('b', false), v('c', true)]), sekarang)).toBe(STATUS.DIBUKA_ULANG)
  })
  it('belum cukup suara ⇒ tetap', () => {
    expect(evaluasiVerifikasi(lap([v('a', true)]), sekarang)).toBeNull()
  })
  it('verifikasi tidak sah tidak dihitung', () => {
    expect(evaluasiVerifikasi(lap([v('a', true), v('b', true), v('c', true, { sah: false })]), sekarang)).toBeNull()
  })
  it('lewat 14 hari tanpa cukup verifikasi ⇒ dibuka ulang', () => {
    expect(evaluasiVerifikasi(lap([v('a', true)]), '2026-11-25T00:00:00.000Z')).toBe(STATUS.DIBUKA_ULANG)
  })
})
