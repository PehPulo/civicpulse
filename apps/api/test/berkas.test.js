// Database berkas (DATA_FILE): laporan baru tetap ada setelah server "restart" (muat ulang dari berkas).
import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { _resetMemori, cari, muatDariBerkas, semua, simpan, tulisKeBerkas } from '../src/repositories/laporan.js'

const folder = mkdtempSync(join(tmpdir(), 'civicpulse-db-'))
const berkas = join(folder, 'sub', 'laporan.json')
afterAll(() => rmSync(folder, { recursive: true, force: true }))

const contoh = (kode) => ({ kode, judul: `Laporan ${kode}`, status: 'diterima', dibuat: new Date().toISOString() })

describe('database berkas DATA_FILE', () => {
  it('berkas belum ada ⇒ null; tulis lalu muat ulang ⇒ data sama, termasuk laporan baru', async () => {
    expect(muatDariBerkas(berkas)).toBeNull()
    _resetMemori([contoh('CP-2026-0001'), contoh('CP-2026-0002')])
    tulisKeBerkas(berkas)
    await simpan(contoh('CP-2026-0003'))
    tulisKeBerkas(berkas)

    _resetMemori([]) // "restart": memori kosong
    expect(muatDariBerkas(berkas)).toBe(3)
    expect((await cari('CP-2026-0003')).judul).toBe('Laporan CP-2026-0003')
    expect(await semua()).toHaveLength(3)

    const isi = JSON.parse(readFileSync(berkas, 'utf-8'))
    expect(isi.versi).toBe(1)
    expect(isi.laporan).toHaveLength(3)
  })

  it('berkas hanya bisa dibaca pemiliknya (0600) di Linux', () => {
    if (process.platform === 'win32') return
    expect(statSync(berkas).mode & 0o777).toBe(0o600)
  })
})
