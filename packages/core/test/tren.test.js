import { describe, expect, it } from 'vitest'
import { analisisGrafik } from '../src/tren.js'

const SEKARANG = '2026-11-10T00:00:00Z'
const hariLalu = (n) => new Date(Date.parse(SEKARANG) - n * 86_400_000).toISOString()
const lap = (kode, hari, status, kategoriId = 'banjir', kab = 'a', level = 'Rendah') => ({
  kode,
  dibuat: hariLalu(hari),
  status,
  kategoriId,
  kabkotaId: kab,
  prioritas: { level },
})

describe('analisisGrafik', () => {
  const data = [
    lap('1', 2, 'diterima', 'banjir', 'a', 'Tinggi'), // lewat target (Tinggi)
    lap('2', 3, 'terverifikasi', 'banjir', 'a'),
    lap('3', 10, 'diproses', 'jalan', 'b'),
    lap('4', 20, 'terverifikasi', 'jalan', 'b'),
    lap('5', 35, 'terverifikasi', 'banjir', 'b'),
    lap('6', 40, 'klaim_selesai', 'drainase', 'a'),
    lap('7', 200, 'diterima', 'banjir', 'a'), // di luar 12 minggu
  ]
  const h = analisisGrafik(data, {
    kelompok: (l) => l.kabkotaId,
    namaKelompok: (id) => `Kab ${id}`,
    sekarang: SEKARANG,
    minimalKelompok: 2,
  })

  it('tren 12 minggu: total masuk = laporan dalam jendela, terbagi selesai/belum', () => {
    expect(h.mingguan).toHaveLength(12)
    const masuk = h.mingguan.reduce((s, m) => s + m.masuk, 0)
    expect(masuk).toBe(6)
    expect(h.mingguan.every((m) => m.selesai + m.belum === m.masuk)).toBe(true)
    expect(h.mingguan.at(-1).masuk).toBe(2) // 2 & 3 hari lalu
  })

  it('kategori urut terbanyak, status lengkap, wilayah urut laju terendah', () => {
    expect(h.kategori[0]).toMatchObject({ id: 'banjir', jumlah: 4 })
    expect(h.status.reduce((s, x) => s + x.jumlah, 0)).toBe(7)
    expect(h.wilayah[0]).toMatchObject({ id: 'a', total: 4, selesai: 1, laju: 25 })
    expect(h.wilayah[1]).toMatchObject({ id: 'b', laju: 67 })
  })

  it('poin analisis memuat angka yang benar', () => {
    const teks = h.poin.map((p) => p.teks).join('\n')
    expect(teks).toContain('3 dari 7 laporan (43%) sudah selesai')
    expect(teks).toContain('Banjir / genangan paling banyak dilaporkan: 4 laporan (57%')
    expect(teks).toContain('Kab a punya tingkat penyelesaian terendah: 25%')
    expect(h.poin.find((p) => p.judul === 'Target waktu')).toBeTruthy()
  })

  it('tanpa laporan ⇒ tanpa poin, tanpa galat', () => {
    expect(analisisGrafik([], { sekarang: SEKARANG }).poin).toEqual([])
  })
})
