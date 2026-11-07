import { describe, expect, it } from 'vitest'
import { GalatDomain, PERAN, STATUS, bisaTransisi, terapkanTransisi, transisiBerikutnya } from '../src/index.js'

const baru = () => ({
  kode: 'CP-2026-0001',
  status: STATUS.DITERIMA,
  riwayat: [{ status: STATUS.DITERIMA, waktu: '2026-11-01T00:00:00.000Z', oleh: PERAN.SISTEM }],
})

describe('state machine status', () => {
  it('alur normal instansi', () => {
    let l = terapkanTransisi(baru(), STATUS.DIPROSES, { oleh: PERAN.INSTANSI })
    l = terapkanTransisi(l, STATUS.KLAIM_SELESAI, { oleh: PERAN.INSTANSI, catatan: 'Sudah dikeruk' })
    expect(l.status).toBe(STATUS.KLAIM_SELESAI)
    expect(l.riwayat).toHaveLength(3)
  })

  it('immutable: laporan asal tidak berubah', () => {
    const asal = baru()
    terapkanTransisi(asal, STATUS.DIPROSES, { oleh: PERAN.INSTANSI })
    expect(asal.status).toBe(STATUS.DITERIMA)
  })

  it('instansi tidak boleh menandai terverifikasi sendiri', () => {
    expect(bisaTransisi(STATUS.KLAIM_SELESAI, STATUS.TERVERIFIKASI, PERAN.INSTANSI)).toBe(false)
  })

  it('melompati tahap ditolak dengan TRANSISI_TIDAK_SAH', () => {
    try {
      terapkanTransisi(baru(), STATUS.KLAIM_SELESAI, { oleh: PERAN.INSTANSI })
      expect.unreachable()
    } catch (e) {
      expect(e).toBeInstanceOf(GalatDomain)
      expect(e.kode).toBe('TRANSISI_TIDAK_SAH')
    }
  })

  it('daftar aksi berikutnya untuk instansi', () => {
    expect(transisiBerikutnya(STATUS.DIBUKA_ULANG, PERAN.INSTANSI)).toEqual([STATUS.DIPROSES])
    expect(transisiBerikutnya(STATUS.KLAIM_SELESAI, PERAN.INSTANSI)).toEqual([])
  })
})
