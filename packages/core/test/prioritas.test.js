import { describe, expect, it } from 'vitest'
import { BOBOT, VERSI_RUMUS, hitungPrioritas, tingkat } from '../src/index.js'

const wilayah = {
  id: 'dayeuhkolot',
  kecamatan: 'Dayeuhkolot',
  kabupaten: 'Kab. Bandung',
  miskin: 6.4,
  risiko: { banjir: 92, longsor: 18, jalan: 55 },
  kejadian5th: { banjir: 6, longsor: 0, jalan: 2 },
}

describe('hitungPrioritas', () => {
  it('bobot berjumlah 100%', () => {
    expect(Object.values(BOBOT).reduce((a, b) => a + b, 0)).toBeCloseTo(1)
  })

  it('menghitung skor sesuai rumus terdokumentasi (docs/SCORING.md)', () => {
    // 0.35·92 + 0.25·100 + 0.20·37.8 + 0.20·40 = 72.76 → 73
    const p = hitungPrioritas(wilayah, 'drainase', 4)
    expect(p.skor).toBe(73)
    expect(p.level).toBe('Tinggi')
    expect(p.versiRumus).toBe(VERSI_RUMUS)
  })

  it('jumlah kontribusi faktor = skor (bisa dijelaskan)', () => {
    const p = hitungPrioritas(wilayah, 'jalan', 2)
    const total = p.faktor.reduce((s, f) => s + f.kontribusi, 0)
    expect(Math.round(total)).toBe(p.skor)
  })

  it('kalimat alasan memuat faktor terbesar', () => {
    const p = hitungPrioritas(wilayah, 'banjir', 0)
    expect(p.penjelasan).toMatch(/^Prioritas sedang: wilayah berisiko banjir tinggi, 6 kejadian banjir/)
    expect(p.penjelasan).not.toMatch(/warga lain/) // faktor bernilai 0 tidak disebut
  })

  it('menolak kategori tak dikenal', () => {
    expect(() => hitungPrioritas(wilayah, 'gempa')).toThrow()
  })

  it('ambang level', () => {
    expect(tingkat(70)).toBe('Tinggi')
    expect(tingkat(69)).toBe('Sedang')
    expect(tingkat(40)).toBe('Sedang')
    expect(tingkat(39)).toBe('Rendah')
  })
})
