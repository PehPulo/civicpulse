import { describe, expect, it } from 'vitest'
import { STATUS, arahanMenunggu, arahanUntuk, buatArahan, tujuanArahan } from '../src/index.js'

const lap = (supervisi, status = STATUS.DIPROSES) => ({ status, supervisi })
const pusat = (waktu, catatan = 'Percepat penanganan') => buatArahan({ tingkat: 'pusat', catatan, waktu })
const prov = (waktu, catatan = 'Segera turunkan regu') => buatArahan({ tingkat: 'provinsi', catatan, waktu })

describe('arahan berjenjang', () => {
  it('pusat mengarahkan provinsi, provinsi mengarahkan kab/kota; catatan lama disimpulkan dari pengirim', () => {
    expect(pusat('2026-11-01T00:00:00Z').untuk).toBe('provinsi')
    expect(prov('2026-11-01T00:00:00Z').untuk).toBe('kabkota')
    expect(tujuanArahan({ tingkat: 'pusat' })).toBe('provinsi')
    expect(tujuanArahan({ tingkat: 'provinsi' })).toBe('kabkota')
  })

  it('kab/kota hanya menerima arahan provinsi, bukan langsung dari pusat', () => {
    const l = lap([pusat('2026-11-01T00:00:00Z')])
    expect(arahanUntuk(l, 'kabkota')).toHaveLength(0)
    expect(arahanMenunggu(l, 'kabkota')).toBe(false)
    expect(arahanMenunggu(l, 'provinsi')).toBe(true)
  })

  it('arahan pusat dianggap ditindaklanjuti setelah provinsi meneruskan arahan ke kab/kota', () => {
    const l = lap([pusat('2026-11-01T00:00:00Z'), prov('2026-11-02T00:00:00Z')])
    expect(arahanMenunggu(l, 'provinsi')).toBe(false)
    expect(arahanMenunggu(l, 'kabkota')).toBe(true)
    // arahan pusat baru setelah itu ⇒ menunggu lagi
    const l2 = lap([...l.supervisi, pusat('2026-11-03T00:00:00Z', 'Mohon laporan perkembangan')])
    expect(arahanMenunggu(l2, 'provinsi')).toBe(true)
  })

  it('laporan yang sudah tidak terbuka tidak lagi menunggu tindak lanjut; pusat tidak menerima arahan', () => {
    const l = lap([pusat('2026-11-01T00:00:00Z'), prov('2026-11-02T00:00:00Z')], STATUS.TERVERIFIKASI)
    expect(arahanMenunggu(l, 'kabkota')).toBe(false)
    expect(arahanMenunggu(l, 'provinsi')).toBe(false)
    expect(arahanMenunggu(lap([prov('2026-11-02T00:00:00Z')]), 'pusat')).toBe(false)
  })
})
