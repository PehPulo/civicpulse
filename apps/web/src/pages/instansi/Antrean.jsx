// PEMILIK: Yance (sisi instansi) · desain ulang: Ezra · KONTRAK: docs/FRONTEND.md § /instansi/antrean
// Antrean kerja petugas: cari, saring (status, jenis, kecamatan, prioritas, target waktu, penanda AI), urutkan,
// pilih beberapa lalu "Mulai proses" sekaligus, dan ekspor CSV. Filter tersimpan di URL agar bisa dibagikan.
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  Download,
  ImageIcon,
  ListOrdered,
  LoaderCircle,
  RotateCcw,
  Search,
  Sparkles,
  ThumbsUp,
  Wrench,
} from 'lucide-react'
import {
  KATEGORI,
  LABEL_STATUS,
  PERAN,
  STATUS,
  STATUS_TERBUKA,
  bisaTransisi,
  kategoriAiBeda,
  kategoriById,
  slaLaporan,
  urutkanAntrean,
} from '@civicpulse/core'
import { api } from '../../services/api.js'
import { useApi } from '../../hooks/useApi.js'
import { WILAYAH, wilayahById } from '../../lib/peta.js'
import { LencanaPrioritas } from '../../components/Prioritas.jsx'
import { ChipSla, JudulHalaman, LencanaAi, LencanaStatus, PesanGalat } from '../../components/instansi/ui.jsx'

const PILIHAN_STATUS = [
  { id: 'terbuka', label: 'Perlu tindakan', cocok: (s) => STATUS_TERBUKA.includes(s) },
  { id: 'semua', label: 'Semua status', cocok: () => true },
  ...Object.values(STATUS).map((s) => ({ id: s, label: LABEL_STATUS[s], cocok: (x) => x === s })),
]
const PILIHAN_SLA = [
  { id: '', label: 'Semua' },
  { id: 'lewat', label: 'Lewat target' },
  { id: 'mendekati', label: 'Mendekati batas' },
]
const PILIHAN_URUT = [
  { id: 'prioritas', label: 'Prioritas tertinggi' },
  { id: 'terlama', label: 'Paling lama menunggu' },
  { id: 'terbaru', label: 'Terbaru' },
  { id: 'dukungan', label: 'Dukungan terbanyak' },
]
const BAWAAN = { status: 'terbuka', urut: 'prioritas' }

const kelasPilih =
  'min-h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100'

function unduhCsv(baris) {
  const kolom = [
    'kode',
    'judul',
    'kategori',
    'kecamatan',
    'status',
    'prioritas',
    'skor',
    'umur_hari',
    'target_hari',
    'lewat_target',
    'dukungan',
    'dibuat',
  ]
  const kutip = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const isi = baris.map((l) => {
    const s = slaLaporan(l)
    return [
      l.kode,
      l.judul,
      kategoriById(l.kategoriId)?.label,
      wilayahById(l.wilayahId)?.kecamatan,
      LABEL_STATUS[l.status],
      l.prioritas.level,
      l.prioritas.skor,
      s.umurHari,
      s.targetHari,
      s.lewat ? 'ya' : 'tidak',
      l.jumlahDukungan,
      l.dibuat,
    ]
      .map(kutip)
      .join(',')
  })
  const blob = new Blob([`\uFEFF${kolom.join(',')}\n${isi.join('\n')}`], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `antrean-civicpulse-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}

export default function Antrean() {
  const [params, setParams] = useSearchParams()
  const f = {
    q: params.get('q') ?? '',
    status: params.get('status') ?? BAWAAN.status,
    kategori: params.get('kategori') ?? '',
    wilayah: params.get('wilayah') ?? '',
    level: params.get('level') ?? '',
    sla: params.get('sla') ?? '',
    ai: params.get('ai') === '1',
    urut: params.get('urut') ?? BAWAAN.urut,
  }
  const atur = (kunci, nilai) => {
    const p = new URLSearchParams(params)
    if (!nilai || nilai === BAWAAN[kunci]) p.delete(kunci)
    else p.set(kunci, nilai)
    setParams(p, { replace: true })
  }
  const [ulang, setUlang] = useState(0)
  const [pilih, setPilih] = useState(() => new Set())
  const [massal, setMassal] = useState({ proses: false, pesan: '' })

  const { data, loading, error } = useApi(() => api.daftarLaporan({}), [ulang])
  const semua = data ?? []

  const laporan = useMemo(() => {
    const cocokStatus = (PILIHAN_STATUS.find((p) => p.id === f.status) ?? PILIHAN_STATUS[0]).cocok
    const q = f.q.trim().toLowerCase()
    const hasil = semua.filter((l) => {
      if (!cocokStatus(l.status)) return false
      if (f.kategori && l.kategoriId !== f.kategori) return false
      if (f.wilayah && l.wilayahId !== f.wilayah) return false
      if (f.level && l.prioritas.level !== f.level) return false
      if (f.ai && !kategoriAiBeda(l)) return false
      if (f.sla) {
        const s = slaLaporan(l)
        if (s.selesai || (f.sla === 'lewat' ? !s.lewat : !s.mendekati)) return false
      }
      if (q && !`${l.kode} ${l.judul} ${wilayahById(l.wilayahId)?.kecamatan ?? ''}`.toLowerCase().includes(q))
        return false
      return true
    })
    return urutkanAntrean(hasil, f.urut)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [semua, params])

  const adaFilter = [...params.keys()].length > 0
  const bisaProses = (l) => bisaTransisi(l.status, STATUS.DIPROSES, PERAN.INSTANSI)
  const terpilih = laporan.filter((l) => pilih.has(l.kode) && bisaProses(l))
  const semuaTerpilih =
    laporan.filter(bisaProses).length > 0 && laporan.filter(bisaProses).every((l) => pilih.has(l.kode))

  const togel = (kode) =>
    setPilih((s) => {
      const n = new Set(s)
      n.has(kode) ? n.delete(kode) : n.add(kode)
      return n
    })
  const togelSemua = () => setPilih(semuaTerpilih ? new Set() : new Set(laporan.filter(bisaProses).map((l) => l.kode)))

  const prosesMassal = async () => {
    if (!terpilih.length) return
    if (!window.confirm(`Ubah ${terpilih.length} laporan ke "Diproses instansi"?`)) return
    setMassal({ proses: true, pesan: '' })
    let ok = 0
    const gagal = []
    for (const l of terpilih) {
      try {
        await api.ubahStatus(l.kode, { ke: STATUS.DIPROSES, catatan: 'Dijadwalkan penanganan (aksi massal).' })
        ok += 1
      } catch (e) {
        gagal.push(`${l.kode}: ${e.message}`)
      }
    }
    setPilih(new Set())
    setMassal({
      proses: false,
      pesan: `${ok} laporan mulai diproses.${gagal.length ? ` Gagal: ${gagal.join('; ')}` : ''}`,
    })
  }

  return (
    <div className="space-y-4">
      <JudulHalaman
        judul="Antrean laporan"
        ikon={ListOrdered}
        sub="Diurutkan dari skor prioritas yang bisa dijelaskan. Target waktu dihitung dari level prioritas."
        kanan={
          <button
            type="button"
            onClick={() => unduhCsv(laporan)}
            disabled={!laporan.length}
            className="btn-ghost min-h-10 py-2 text-sm"
          >
            <Download size={16} aria-hidden="true" /> Ekspor CSV
          </button>
        }
      />

      <div className="rounded-2xl border border-line bg-white p-3 sm:p-4">
        <label className="relative block">
          <span className="sr-only">Cari kode, judul, atau kecamatan</span>
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
            aria-hidden="true"
          />
          <input
            type="search"
            value={f.q}
            onChange={(e) => atur('q', e.target.value)}
            placeholder="Cari kode (CP-2026-…), judul, atau kecamatan"
            className={`${kelasPilih} pl-9`}
          />
        </label>
        <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
          {[
            ['status', 'Status', PILIHAN_STATUS.map((p) => [p.id, p.label])],
            ['kategori', 'Jenis', [['', 'Semua jenis'], ...KATEGORI.map((k) => [k.id, k.label])]],
            ['wilayah', 'Kecamatan', [['', 'Semua kecamatan'], ...WILAYAH.map((w) => [w.id, w.kecamatan])]],
            [
              'level',
              'Prioritas',
              [
                ['', 'Semua level'],
                ['Tinggi', 'Tinggi'],
                ['Sedang', 'Sedang'],
                ['Rendah', 'Rendah'],
              ],
            ],
            ['sla', 'Target waktu', PILIHAN_SLA.map((p) => [p.id, p.label])],
            ['urut', 'Urutkan', PILIHAN_URUT.map((p) => [p.id, p.label])],
          ].map(([kunci, label, opsi]) => (
            <label key={kunci} className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
              {label}
              <select
                value={f[kunci]}
                onChange={(e) => atur(kunci, e.target.value)}
                className={`mt-1 normal-case tracking-normal ${kelasPilih}`}
              >
                {opsi.map(([v, t]) => (
                  <option key={v} value={v}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => atur('ai', f.ai ? '' : '1')}
            aria-pressed={f.ai}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold ring-1 ${f.ai ? 'bg-violet-600 text-white ring-violet-600' : 'bg-white text-violet-800 ring-violet-200'}`}
          >
            <Sparkles size={13} aria-hidden="true" /> Kategori beda dengan saran AI
          </button>
          {adaFilter && (
            <button
              type="button"
              onClick={() => setParams({}, { replace: true })}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-ink-soft ring-1 ring-line"
            >
              <RotateCcw size={13} aria-hidden="true" /> Reset filter
            </button>
          )}
        </div>
      </div>

      <PesanGalat galat={error} ulang={() => setUlang((n) => n + 1)} />
      {massal.pesan && (
        <p role="status" className="rounded-xl border border-brand-100 bg-brand-50 p-3 text-sm text-brand-900">
          {massal.pesan}
        </p>
      )}

      {/* Bilah aksi massal */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-soft" aria-live="polite">
          {loading ? 'Memuat…' : `${laporan.length} laporan`}
          {terpilih.length > 0 && <span className="font-semibold text-ink"> · {terpilih.length} dipilih</span>}
        </p>
        {terpilih.length > 0 && (
          <button
            type="button"
            onClick={prosesMassal}
            disabled={massal.proses}
            className="btn-primary min-h-10 py-2 text-sm"
          >
            {massal.proses ? (
              <LoaderCircle size={16} className="motion-safe:animate-spin" aria-hidden="true" />
            ) : (
              <Wrench size={16} aria-hidden="true" />
            )}
            Mulai proses ({terpilih.length})
          </button>
        )}
      </div>

      {!loading && laporan.length === 0 && (
        <div className="rounded-2xl border border-line bg-white p-10 text-center">
          <p className="font-semibold text-ink">Tidak ada laporan yang cocok.</p>
          <p className="mt-1 text-sm text-ink-soft">
            {adaFilter ? 'Longgarkan filter atau reset.' : 'Belum ada laporan masuk.'}
          </p>
        </div>
      )}

      {laporan.length > 0 && (
        <>
          {/* Tabel desktop */}
          <div className="hidden overflow-hidden rounded-2xl border border-line bg-white md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-paper text-[11px] font-bold uppercase tracking-wide text-ink-faint">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={semuaTerpilih}
                      onChange={togelSemua}
                      aria-label="Pilih semua yang bisa diproses"
                      className="h-4 w-4 accent-brand-600"
                    />
                  </th>
                  <th className="px-2 py-3">Laporan</th>
                  <th className="px-2 py-3">Prioritas</th>
                  <th className="px-2 py-3">Status</th>
                  <th className="px-2 py-3">Target</th>
                  <th className="px-2 py-3 text-right">Dukungan</th>
                  <th className="w-10 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {laporan.map((l) => (
                  <tr key={l.kode} className={`group hover:bg-paper/60 ${pilih.has(l.kode) ? 'bg-brand-50/60' : ''}`}>
                    <td className="px-4 py-3 align-top">
                      {bisaProses(l) && (
                        <input
                          type="checkbox"
                          checked={pilih.has(l.kode)}
                          onChange={() => togel(l.kode)}
                          aria-label={`Pilih ${l.kode}`}
                          className="mt-1 h-4 w-4 accent-brand-600"
                        />
                      )}
                    </td>
                    <td className="max-w-[360px] px-2 py-3">
                      <Link
                        to={`/instansi/laporan/${l.kode}`}
                        className="block font-semibold text-ink group-hover:text-brand-700"
                      >
                        {l.judul}
                      </Link>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-ink-faint">
                        <span className="tabular-nums">{l.kode}</span>·<span>{kategoriById(l.kategoriId)?.label}</span>·
                        <span>Kec. {wilayahById(l.wilayahId)?.kecamatan}</span>
                        {l.fotoUrl && <ImageIcon size={12} aria-label="ada foto" />}
                        {kategoriAiBeda(l) && (
                          <LencanaAi judul={`AI menyarankan ${kategoriById(l.ai.kategoriSaran)?.label}`}>
                            cek kategori
                          </LencanaAi>
                        )}
                      </p>
                    </td>
                    <td className="px-2 py-3">
                      <LencanaPrioritas level={l.prioritas.level} skor={l.prioritas.skor} />
                    </td>
                    <td className="px-2 py-3">
                      <LencanaStatus status={l.status} label={LABEL_STATUS[l.status]} />
                    </td>
                    <td className="px-2 py-3">
                      <ChipSla sla={slaLaporan(l)} />
                    </td>
                    <td className="px-2 py-3 text-right tabular-nums text-ink-soft">
                      <span className="inline-flex items-center gap-1">
                        <ThumbsUp size={13} aria-hidden="true" /> {l.jumlahDukungan}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/instansi/laporan/${l.kode}`}
                        aria-label={`Buka ${l.kode}`}
                        className="text-ink-faint hover:text-brand-700"
                      >
                        <ArrowRight size={16} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Kartu HP */}
          <ul className="space-y-2.5 md:hidden">
            {laporan.map((l) => (
              <li
                key={l.kode}
                className={`rounded-2xl border bg-white p-4 ${pilih.has(l.kode) ? 'border-brand-500' : 'border-line'}`}
              >
                <div className="flex items-start gap-3">
                  {bisaProses(l) && (
                    <input
                      type="checkbox"
                      checked={pilih.has(l.kode)}
                      onChange={() => togel(l.kode)}
                      aria-label={`Pilih ${l.kode}`}
                      className="mt-1 h-5 w-5 shrink-0 accent-brand-600"
                    />
                  )}
                  <Link to={`/instansi/laporan/${l.kode}`} className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <LencanaPrioritas level={l.prioritas.level} skor={l.prioritas.skor} />
                      <ChipSla sla={slaLaporan(l)} />
                    </div>
                    <p className="mt-2 font-semibold text-ink">{l.judul}</p>
                    <p className="mt-1 text-xs text-ink-faint">
                      {l.kode} · Kec. {wilayahById(l.wilayahId)?.kecamatan} · {l.jumlahDukungan} dukungan
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <LencanaStatus status={l.status} label={LABEL_STATUS[l.status]} />
                      {kategoriAiBeda(l) && <LencanaAi>cek kategori</LencanaAi>}
                    </div>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
