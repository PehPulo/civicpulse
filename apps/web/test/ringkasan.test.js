import { describe, expect, it } from 'vitest'
import wilayahData from '../../../data/processed/wilayah.json'
import { statistik } from '@civicpulse/core'
import { buatSeed } from '../src/services/seed.js'
import { angkaTerjamin, faktaDasbor, ringkasanTemplate } from '../src/ai/ringkasan.js'

const W = wilayahData.wilayah
const sekarang = '2026-11-07T08:00:00.000Z'
const stat = statistik(buatSeed(W, Date.parse(sekarang)), W, sekarang)

describe('ringkasan dasbor', () => {
  it('fakta memuat angka kunci & wilayah senyap', () => {
    const f = faktaDasbor(stat)
    expect(f).toContain(`Total laporan: ${stat.total}`)
    expect(f).toContain('Wilayah senyap: Cisarua')
  })

  it('template selalu lolos pengaman angka', () => {
    expect(angkaTerjamin(ringkasanTemplate(stat), faktaDasbor(stat))).toBe(true)
  })

  it('menolak keluaran LLM yang mengarang angka', () => {
    const fakta = faktaDasbor(stat)
    expect(angkaTerjamin(`Terdapat ${stat.total} laporan.`, fakta)).toBe(true)
    expect(angkaTerjamin('Terdapat 999 laporan dan 12,7% kemiskinan.', fakta)).toBe(false)
  })
})
