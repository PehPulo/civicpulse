// Cache AI bersama: jawaban kembar dari cache, "Susun ulang" (segar) memaksa panggilan baru dan menggantikan isi cache.
import { describe, expect, it } from 'vitest'
import { buatCache } from '../src/ai/penjaga.js'

describe('buatCache', () => {
  it('kedua kali dari cache; segar ⇒ panggil ulang dan simpan hasil baru', async () => {
    const cache = buatCache({ ttlMs: 60_000 })
    let n = 0
    const buat = async () => ({ teks: `versi ${++n}` })
    expect(await cache('k', buat)).toEqual({ teks: 'versi 1', cache: false })
    expect(await cache('k', buat)).toEqual({ teks: 'versi 1', cache: true })
    expect(await cache('k', buat, Date.now(), { segar: true })).toEqual({ teks: 'versi 2', cache: false })
    expect(await cache('k', buat)).toEqual({ teks: 'versi 2', cache: true })
    expect(n).toBe(2)
  })
})
