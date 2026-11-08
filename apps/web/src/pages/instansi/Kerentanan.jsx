// Kerentanan sosial (admin provinsi & pusat; relevan untuk Kemensos): indeksKerentanan() (@civicpulse/core, diuji)
// menggabungkan kemiskinan wilayah dengan beban laporan yang belum tertangani ⇒ sasaran pendampingan/bantuan.
// Pusat ⇒ per provinsi; provinsi ⇒ per kab/kota; dipersempit ke satu kab/kota ⇒ per kecamatan (bila data pilot).
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { HeartHandshake, Info } from 'lucide-react'
import { TINGKAT, indeksKerentanan } from '@civicpulse/core'
import { api } from '../../services/api.js'
import { useApi } from '../../hooks/useApi.js'
import { WILAYAH, kabkotaById, lokasiPendek, provinsiById, wilayahById } from '../../lib/peta.js'
import { useCakupan } from '../../components/instansi/cakupan.js'
import { Batang, HanyaUntuk, JudulHalaman, Kerangka, Panel, PesanGalat } from '../../components/instansi/ui.jsx'

const WARNA = { Tinggi: 'bg-tinggi', Sedang: 'bg-sedang', Rendah: 'bg-rendah' }
const TEKS = { Tinggi: 'text-tinggi', Sedang: 'text-sedang', Rendah: 'text-rendah' }

export default function Kerentanan() {
  const k = useCakupan()
  const { efektif } = k
  const navigate = useNavigate()
  const { data, loading, error } = useApi(() => api.daftarLaporan({}), [])

  const kunci =
    efektif.tingkat === TINGKAT.PUSAT ? 'provinsiId' : efektif.tingkat === TINGKAT.PROVINSI ? 'kabkotaId' : 'id'
  const satuan = { provinsiId: 'provinsi', kabkotaId: 'kab/kota', id: 'kecamatan/wilayah' }[kunci]
  const hasil = useMemo(() => {
    const wilayah = WILAYAH.filter(
      (w) =>
        efektif.tingkat === TINGKAT.PUSAT ||
        (efektif.tingkat === TINGKAT.PROVINSI
          ? w.provinsiId === efektif.provinsiId
          : w.kabkotaId === efektif.kabkotaId),
    )
    return indeksKerentanan(wilayah, k.saring(data), kunci)
  }, [data, k, kunci, efektif])
  const nama = (id) =>
    kunci === 'provinsiId'
      ? provinsiById(id)?.nama
      : kunci === 'kabkotaId'
        ? kabkotaById(id)?.nama
        : lokasiPendek(wilayahById(id))
  const jumlah = (lv) => hasil.filter((h) => h.level === lv).length

  const buka = (id) => {
    if (kunci === 'provinsiId') k.setCakupan({ provinsiId: id, kabkotaId: null })
    else if (kunci === 'kabkotaId') k.setCakupan({ provinsiId: efektif.provinsiId, kabkotaId: id })
    navigate('/instansi/antrean')
  }

  return (
    <HanyaUntuk
      boleh={k.mengawasi}
      pesan="Kerentanan sosial dipakai admin provinsi & pusat untuk menentukan wilayah sasaran pendampingan."
    >
      <JudulHalaman
        judul={`Kerentanan sosial · ${k.namaCakupan}`}
        ikon={HeartHandshake}
        sub="Indeks = 50% kemiskinan + 30% beban laporan terbuka + 20% porsi lewat target. Untuk menentukan sasaran pendampingan & bantuan sosial."
      />
      <PesanGalat galat={error} />

      <div className="mb-5 grid grid-cols-3 gap-3">
        {['Tinggi', 'Sedang', 'Rendah'].map((lv) => (
          <div key={lv} className="relative overflow-hidden rounded-2xl border border-line bg-white p-4">
            <span className={`absolute inset-x-0 top-0 h-1 ${WARNA[lv]}`} aria-hidden="true" />
            <p className="text-xs font-semibold text-ink-soft">Kerentanan {lv.toLowerCase()}</p>
            <p className={`mt-1 text-3xl font-extrabold tabular-nums ${TEKS[lv]}`}>{jumlah(lv)}</p>
            <p className="text-xs text-ink-faint">{satuan}</p>
          </div>
        ))}
      </div>

      <Panel judul={`Peringkat kerentanan per ${satuan} (${hasil.length})`} ikon={HeartHandshake} padat>
        {loading ? (
          <div className="p-5">
            <Kerangka baris={6} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="bg-paper text-left text-xs text-ink-soft">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">#</th>
                  <th className="px-3 py-2.5 font-semibold">Wilayah</th>
                  <th className="px-3 py-2.5 font-semibold">Indeks</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Penduduk miskin</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Laporan terbuka</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Lewat target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {hasil.slice(0, 50).map((h, i) => (
                  <tr key={h.id} className="hover:bg-paper/70">
                    <td className="px-4 py-2.5 text-xs font-bold text-ink-faint">{i + 1}</td>
                    <td className="px-3 py-2.5">
                      {kunci === 'id' ? (
                        <span className="font-semibold">{nama(h.id)}</span>
                      ) : (
                        <button type="button" onClick={() => buka(h.id)} className="font-semibold hover:text-brand-700">
                          {nama(h.id)}
                        </button>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-8 text-right font-extrabold tabular-nums ${TEKS[h.level]}`}>{h.skor}</span>
                        <div className="w-24">
                          <Batang nilai={h.skor} warna={WARNA[h.level]} label={`Indeks ${nama(h.id)}`} />
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {h.miskin == null ? '–' : `${String(h.miskin).replace('.', ',')}%`}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{h.terbuka}</td>
                    <td className={`px-4 py-2.5 text-right tabular-nums ${h.lewatSla ? 'font-bold text-tinggi' : ''}`}>
                      {h.lewatSla}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="flex items-start gap-2 border-t border-line bg-amber-50 px-4 py-2.5 text-xs text-amber-900">
          <Info size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
          Kemiskinan: BPS untuk kecamatan pilot Bandung Raya; wilayah lain memakai nilai ilustrasi (bukan data BPS).
          Indeks adalah alat bantu penapisan, bukan penetapan penerima bantuan.
        </p>
      </Panel>
    </HanyaUntuk>
  )
}
