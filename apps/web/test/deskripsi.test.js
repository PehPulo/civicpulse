import { describe, expect, it } from 'vitest'
import { draftDeskripsi, draftJudul, tambahKalimat } from '../src/ai/deskripsi.js'
import registry from '../../../ml/models.json'
import { KATEGORI } from '@civicpulse/core'

const wilayah = { kecamatan: 'Dayeuhkolot', kabupaten: 'Kab. Bandung' }
const detail = [{ kalimat: 'Saluran air tertutup sampah' }, { kalimat: 'Air saluran meluap ke jalan' }]

describe('draf deskripsi', () => {
  it('menyusun kalimat dari detail AI dan lokasi', () => {
    expect(draftDeskripsi({ kategoriLabel: 'Drainase tersumbat', detail, wilayah })).toBe(
      'Saluran air tertutup sampah. Air saluran meluap ke jalan. Lokasi di Kec. Dayeuhkolot, Kab. Bandung.',
    )
  })

  it('tetap membuat draf tanpa AI (hanya kategori)', () => {
    const d = draftDeskripsi({ kategoriLabel: 'Banjir', detail: null, wilayah: null })
    expect(d).toBe('Ada masalah banjir.')
    expect(d.length).toBeGreaterThanOrEqual(10) // lolos validasi minimal deskripsi
  })

  it('judul memakai detail utama + kecamatan dan maks 80 karakter', () => {
    expect(draftJudul({ kategoriLabel: 'Drainase tersumbat', detail, wilayah })).toBe(
      'Saluran air tertutup sampah di Kec. Dayeuhkolot',
    )
    expect(draftJudul({ kategoriLabel: 'x'.repeat(200), detail: null, wilayah }).length).toBeLessThanOrEqual(80)
  })

  it('pilihan cepat tidak digandakan', () => {
    const a = tambahKalimat('Saluran tersumbat.', 'Mengganggu lalu lintas.')
    expect(tambahKalimat(a, 'Mengganggu lalu lintas.')).toBe('Saluran tersumbat. Mengganggu lalu lintas.')
  })
})

describe('registry label detail', () => {
  const det = registry.model[registry.aktif.vision].label.detail

  it('setiap kategori punya label detail unik', () => {
    for (const k of KATEGORI) {
      expect(det[k.id]?.length, k.id).toBeGreaterThanOrEqual(2)
      expect(new Set(det[k.id].map((d) => d.id)).size).toBe(det[k.id].length)
      expect(new Set(det[k.id].map((d) => d.prompt)).size).toBe(det[k.id].length)
    }
  })

  it('kalimat detail tidak memuat angka (draf tidak boleh mengarang ukuran)', () => {
    for (const daftar of Object.values(det)) for (const d of daftar) expect(d.kalimat).not.toMatch(/\d/)
  })
})
