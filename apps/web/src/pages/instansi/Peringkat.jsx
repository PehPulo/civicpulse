// Peringkat wilayah untuk admin provinsi (kab/kota di provinsinya) & pusat (34 provinsi, atau kab/kota bila
// cakupan dipersempit). Angka: agregatWilayah() + skorKinerjaWilayah() (@civicpulse/core, diuji).
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDownUp, Download, Info, Medal } from 'lucide-react'
import { TINGKAT, agregatWilayah, skorKinerjaWilayah } from '@civicpulse/core'
import { api } from '../../services/api.js'
import { useApi } from '../../hooks/useApi.js'
import { INDEKS_WILAYAH, KABKOTA, PROVINSI } from '../../lib/peta.js'
import { useCakupan } from '../../components/instansi/cakupan.js'
import { Batang, JudulHalaman, Kerangka, Panel, PesanGalat, angka } from '../../components/instansi/ui.jsx'

const KOLOM = [
  { id: 'skor', label: 'Skor kinerja' },
  { id: 'terbuka', label: 'Terbuka' },
  { id: 'lewatSla', label: 'Lewat target' },
  { id: 'persenTepat', label: 'Klaim tepat' },
  { id: 'persenTerverifikasi', label: 'Diverifikasi warga' },
  { id: 'total', label: 'Total' },
]

const warnaSkor = (s) => (s == null ? 'bg-line' : s >= 75 ? 'bg-rendah' : s >= 50 ? 'bg-sedang' : 'bg-tinggi')

export default function Peringkat() {
  const k = useCakupan()
  const { efektif, setCakupan } = k
  const navigate = useNavigate()
  const [urut, setUrut] = useState({ kolom: 'skor', naik: false })
  const { data, loading, error } = useApi(() => api.daftarLaporan({}), [])

  const nasional = efektif.tingkat === TINGKAT.PUSAT
  const kunci = nasional ? 'provinsiId' : 'kabkotaId'
  const daftarWilayah = nasional ? PROVINSI : KABKOTA.filter((x) => x.provinsiId === efektif.provinsiId)

  const baris = useMemo(() => {
    const lap = (data ?? []).filter(
      (l) => nasional || INDEKS_WILAYAH.get(l.wilayahId)?.provinsiId === efektif.provinsiId,
    )
    const ag = agregatWilayah(lap, kunci, INDEKS_WILAYAH)
    return daftarWilayah.map((w) => {
      const a = ag.get(w.id) ?? { total: 0, terbuka: 0, lewatSla: 0, persenTepat: null, persenTerverifikasi: null }
      return { ...a, id: w.id, nama: w.nama, skor: skorKinerjaWilayah(a) }
    })
  }, [data, nasional, kunci, efektif.provinsiId, daftarWilayah])

  const terurut = [...baris].sort((a, b) => {
    const x = a[urut.kolom]
    const y = b[urut.kolom]
    if (x == null && y == null) return a.nama.localeCompare(b.nama, 'id')
    if (x == null) return 1
    if (y == null) return -1
    return urut.naik ? x - y : y - x
  })
  const dinilai = baris.filter((b) => b.skor != null)
  const rata = dinilai.length ? Math.round(dinilai.reduce((s, b) => s + b.skor, 0) / dinilai.length) : null

  const buka = (id) => {
    setCakupan(nasional ? { provinsiId: id, kabkotaId: null } : { provinsiId: efektif.provinsiId, kabkotaId: id })
    navigate('/instansi')
  }

  const unduh = () => {
    const kepala = ['Peringkat', 'Wilayah', ...KOLOM.map((c) => c.label)]
    const isi = terurut.map((b, i) => [i + 1, b.nama, ...KOLOM.map((c) => b[c.id] ?? '')])
    const csv = [kepala, ...isi].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
    a.download = `peringkat-${nasional ? 'provinsi' : efektif.provinsiId}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div>
      <JudulHalaman
        judul={nasional ? 'Peringkat provinsi' : `Peringkat kab/kota · ${k.namaCakupan.replace(/^Provinsi /, '')}`}
        ikon={Medal}
        sub="Skor kinerja = 50% klaim tepat waktu + 30% klaim diverifikasi warga + 20% (100 − % terbuka lewat target). Komponen tanpa data dibagi ulang bobotnya."
        kanan={
          <button type="button" onClick={unduh} className="btn-ghost min-h-10 text-sm" disabled={!data}>
            <Download size={16} aria-hidden="true" /> Unduh CSV
          </button>
        }
      />

      {error && <PesanGalat galat={error} />}

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-white p-4">
          <p className="text-xs font-semibold text-ink-soft">Wilayah dinilai</p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums">
            {dinilai.length}
            <span className="text-sm font-semibold text-ink-faint"> / {baris.length}</span>
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-4">
          <p className="text-xs font-semibold text-ink-soft">Rata-rata skor</p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums">{rata ?? '–'}</p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-4">
          <p className="text-xs font-semibold text-ink-soft">Perlu perhatian (skor &lt; 50)</p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums text-tinggi">
            {dinilai.filter((b) => b.skor < 50).length}
          </p>
        </div>
      </div>

      <Panel judul={`${baris.length} ${nasional ? 'provinsi' : 'kab/kota'}`} ikon={Medal} padat>
        {loading ? (
          <div className="p-5">
            <Kerangka baris={6} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-paper text-left text-xs text-ink-soft">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">#</th>
                  <th className="px-4 py-2.5 font-semibold">Wilayah</th>
                  {KOLOM.map((c) => (
                    <th key={c.id} className="px-3 py-2.5 font-semibold">
                      <button
                        type="button"
                        onClick={() =>
                          setUrut((u) => ({ kolom: c.id, naik: u.kolom === c.id ? !u.naik : c.id === 'lewatSla' }))
                        }
                        className={`inline-flex items-center gap-1 ${urut.kolom === c.id ? 'text-brand-700' : ''}`}
                        aria-label={`Urutkan menurut ${c.label}`}
                      >
                        {c.label} <ArrowDownUp size={12} aria-hidden="true" />
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {terurut.map((b, i) => (
                  <tr key={b.id} className="hover:bg-paper/70">
                    <td className="px-4 py-2.5 text-xs font-bold text-ink-faint">{i + 1}</td>
                    <td className="px-4 py-2.5">
                      <button
                        type="button"
                        onClick={() => buka(b.id)}
                        className="text-left font-semibold text-ink hover:text-brand-700"
                      >
                        {b.nama}
                      </button>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-8 text-right font-extrabold tabular-nums">{b.skor ?? '–'}</span>
                        <div className="w-20">
                          <Batang nilai={b.skor ?? 0} warna={warnaSkor(b.skor)} label={`Skor ${b.nama}`} />
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 tabular-nums">{angka(b.terbuka)}</td>
                    <td className={`px-3 py-2.5 tabular-nums ${b.lewatSla ? 'font-bold text-tinggi' : ''}`}>
                      {angka(b.lewatSla)}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums">{b.persenTepat == null ? '–' : `${b.persenTepat}%`}</td>
                    <td className="px-3 py-2.5 tabular-nums">
                      {b.persenTerverifikasi == null ? '–' : `${b.persenTerverifikasi}%`}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums">{angka(b.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="flex items-start gap-2 border-t border-line bg-amber-50 px-4 py-2.5 text-xs text-amber-900">
          <Info size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
          Data ilustrasi untuk wilayah di luar Bandung Raya. Klik nama wilayah untuk membuka ringkasannya.
        </p>
      </Panel>
    </div>
  )
}
