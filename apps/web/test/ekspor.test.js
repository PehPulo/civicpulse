import { describe, expect, it } from 'vitest'
import { KOLOM_LAPORAN, keCsv, laporanUntukJson } from '../src/lib/ekspor.js'

describe('keCsv', () => {
  it('menulis kepala dan baris dengan pemisah CRLF', () => {
    const csv = keCsv([{ a: 1, b: 'x' }], [{ kunci: 'a' }, { kunci: 'b' }])
    expect(csv).toBe('a,b\r\n1,x')
  })

  it('meng-escape koma, kutip, dan baris baru (RFC 4180)', () => {
    const csv = keCsv([{ t: 'Jalan "rusak", parah\nsekali' }], [{ kunci: 't' }])
    expect(csv.split('\r\n')[1]).toBe('"Jalan ""rusak"", parah\nsekali"')
  })

  it('nilai kosong menjadi sel kosong', () => {
    expect(keCsv([{ a: null, b: undefined }], [{ kunci: 'a' }, { kunci: 'b' }])).toBe('a,b\r\n,')
  })
})

describe('ekspor laporan publik', () => {
  const laporan = {
    kode: 'CP-2026-0001',
    dibuat: '2026-11-01T00:00:00.000Z',
    kategoriId: 'drainase',
    status: 'diterima',
    wilayahId: 'dayeuhkolot',
    lat: -6.98,
    lng: 107.62,
    prioritas: { skor: 73, level: 'Tinggi', versiRumus: '1.0' },
    jumlahDukungan: 2,
    verifikasi: [
      { sah: true, beres: true },
      { sah: false, beres: true },
    ],
    riwayat: [{ waktu: '2026-11-01T00:00:00.000Z' }],
    judul: 'Saluran, tersumbat',
    deskripsi: 'Air meluap',
    fotoUrl: 'data:image/jpeg;base64,AAAA',
    saya: { pelapor: true },
  }
  const wilayah = { kecamatan: 'Dayeuhkolot', kabupaten: 'Kab. Bandung' }

  it('CSV memakai label yang mudah dibaca dan menghitung verifikasi sah saja', () => {
    const [kepala, baris] = keCsv([laporan], KOLOM_LAPORAN, () => [wilayah]).split('\r\n')
    const kolom = kepala.split(',')
    const sel = Object.fromEntries(
      kolom.map((k, i) => [k, baris.match(/("([^"]|"")*"|[^,]*)(,|$)/g)[i].replace(/,$/, '')]),
    )
    expect(sel.kategori).toBe('Drainase tersumbat')
    expect(sel.status).toBe('Diterima')
    expect(sel.kecamatan).toBe('Dayeuhkolot')
    expect(sel.verifikasi_beres).toBe('1')
    expect(sel.judul).toBe('"Saluran, tersumbat"')
    expect(sel.ada_foto).toBe('ya')
  })

  it('tidak pernah mengekspor identitas perangkat, foto, atau field "saya"', () => {
    const csv = keCsv([laporan], KOLOM_LAPORAN, () => [wilayah])
    expect(csv).not.toMatch(/pelaporId|deviceId|base64/)
    const json = laporanUntukJson([laporan])[0]
    expect(json).not.toHaveProperty('fotoUrl')
    expect(json).not.toHaveProperty('saya')
    expect(json.adaFoto).toBe(true)
  })
})
