import { describe, expect, it } from 'vitest'
import wilayahData from '../../../data/processed/wilayah.json'
import { statistik } from '@civicpulse/core'
import { buatSeed } from '../src/services/seed.js'
import { angkaTerjamin, faktaDasbor, keluaranAman, keluaranWajar, ringkasanTemplate } from '../src/ai/ringkasan.js'

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

  it('membedakan "100%" dari "100 dari 100" (satuan persen ikut dicek)', () => {
    const fakta = ['- Risiko banjir wilayah: 100 dari 100 (BNPB)', '- Penduduk miskin: 6,19% (BPS)'].join('\n')
    expect(angkaTerjamin('Risiko banjir 100 dari 100, penduduk miskin 6,19%.', fakta)).toBe(true)
    expect(angkaTerjamin('Risiko banjir 100%.', fakta)).toBe(false)
    expect(angkaTerjamin('Penduduk miskin 6,19 orang.', fakta)).toBe(false)
  })

  it('menolak keluaran LLM rusak (menyalin format prompt atau berulang) walau tanpa angka', () => {
    const rusak = 'Warga pelasusari penasaran. Fakta laporan: -Fakta laporan: -Fakta laporan: -Fakta laporan:'
    expect(keluaranWajar(rusak)).toBe(false)
    expect(keluaranAman(rusak, 'Fakta apa pun')).toBe(false)
    expect(keluaranWajar('Jalan rusak di jalan rusak di jalan rusak di jalan rusak sekali.')).toBe(false)
    const baik = 'Warga melaporkan drainase tersumbat di Kecamatan Dayeuhkolot. Saluran perlu segera dibersihkan.'
    expect(keluaranWajar(baik)).toBe(true)
  })
})
