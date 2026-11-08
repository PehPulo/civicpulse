// PEMILIK: Yance (sisi instansi) · KONTRAK: docs/FRONTEND.md § /instansi
// Rute sudah terdaftar di App.jsx; cukup ganti isi file ini.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, ClipboardCheck, Inbox, RotateCcw, ThumbsUp, Wrench } from 'lucide-react'
import { KATEGORI, LABEL_STATUS, STATUS, STATUS_TERBUKA, kategoriById } from '@civicpulse/core'
import { api } from '../../services/api.js'
import { useApi } from '../../hooks/useApi.js'
import { DATA_ILUSTRASI, WILAYAH, wilayahById } from '../../lib/peta.js'
import { LencanaPrioritas } from '../../components/Prioritas.jsx'

const PILIHAN_STATUS = [
  { id: 'terbuka', label: 'Terbuka (perlu tindakan)', cocok: (s) => STATUS_TERBUKA.includes(s) },
  { id: '', label: 'Semua status', cocok: () => true },
  ...Object.values(STATUS).map((s) => ({ id: s, label: LABEL_STATUS[s], cocok: (x) => x === s })),
]

const IKON_STATUS = {
  [STATUS.DITERIMA]: Inbox,
  [STATUS.DIPROSES]: Wrench,
  [STATUS.KLAIM_SELESAI]: ClipboardCheck,
  [STATUS.TERVERIFIKASI]: CheckCircle2,
  [STATUS.DIBUKA_ULANG]: RotateCcw,
}

const WARNA_STATUS = {
  [STATUS.KLAIM_SELESAI]: 'text-sedang',
  [STATUS.TERVERIFIKASI]: 'text-rendah',
  [STATUS.DIBUKA_ULANG]: 'text-tinggi',
}

const HARI = 86400000
const umurHari = (dibuat) => Math.max(0, Math.floor((Date.now() - Date.parse(dibuat)) / HARI))
const tampilUmur = (dibuat) => {
  const n = umurHari(dibuat)
  return n === 0 ? 'hari ini' : `${n} hari`
}

const kelasPilih =
  'min-h-[44px] w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none focus:border-brand-500'

export default function Antrean() {
  const [statusId, setStatusId] = useState('terbuka')
  const [kategoriId, setKategoriId] = useState('')
  const [wilayahId, setWilayahId] = useState('')
  const [ulang, setUlang] = useState(0)

  const { data, loading, error } = useApi(
    () => api.daftarLaporan({ kategoriId: kategoriId || undefined, wilayahId: wilayahId || undefined }),
    [kategoriId, wilayahId, ulang],
  )

  const semua = data ?? []
  const cocokStatus = (PILIHAN_STATUS.find((p) => p.id === statusId) ?? PILIHAN_STATUS[0]).cocok
  const laporan = semua
    .filter((l) => cocokStatus(l.status))
    .sort((a, b) => b.prioritas.skor - a.prioritas.skor || Date.parse(a.dibuat) - Date.parse(b.dibuat))
  const adaFilter = statusId !== 'terbuka' || kategoriId || wilayahId

  const reset = () => {
    setStatusId('terbuka')
    setKategoriId('')
    setWilayahId('')
  }

  return (
    <section aria-label="Antrean laporan instansi">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Antrean Laporan</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-soft sm:text-base">
            Laporan warga yang menunggu tindakan, diurutkan dari skor prioritas tertinggi.
          </p>
        </div>
        {DATA_ILUSTRASI && <span className="tag-ilustrasi">Data ilustrasi</span>}
      </div>

      <ul className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5" aria-label="Jumlah laporan per status">
        {Object.values(STATUS).map((s) => {
          const Ikon = IKON_STATUS[s]
          return (
            <li key={s} className="card flex items-center gap-2 px-3 py-2.5">
              <Ikon size={16} className={`shrink-0 ${WARNA_STATUS[s] ?? 'text-ink-faint'}`} aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-xs font-semibold text-ink-soft">{LABEL_STATUS[s]}</span>
              <span className="tabular-nums text-sm font-extrabold text-ink">
                {loading ? '–' : semua.filter((l) => l.status === s).length}
              </span>
            </li>
          )
        })}
      </ul>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]">
        <label className="text-xs font-semibold text-ink-soft">
          Status
          <select value={statusId} onChange={(e) => setStatusId(e.target.value)} className={`mt-1 ${kelasPilih}`}>
            {PILIHAN_STATUS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-ink-soft">
          Jenis masalah
          <select value={kategoriId} onChange={(e) => setKategoriId(e.target.value)} className={`mt-1 ${kelasPilih}`}>
            <option value="">Semua jenis</option>
            {KATEGORI.map((k) => (
              <option key={k.id} value={k.id}>
                {k.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-ink-soft">
          Kecamatan
          <select value={wilayahId} onChange={(e) => setWilayahId(e.target.value)} className={`mt-1 ${kelasPilih}`}>
            <option value="">Semua kecamatan</option>
            {WILAYAH.map((w) => (
              <option key={w.id} value={w.id}>
                {w.kecamatan}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={reset} disabled={!adaFilter} className="btn-ghost self-end py-2">
          <RotateCcw size={16} aria-hidden="true" /> Reset
        </button>
      </div>

      {error && (
        <div role="alert" className="card mt-4 border-tinggi bg-orange-50 p-4 text-sm text-tinggi">
          <p>{error.message}</p>
          <button type="button" onClick={() => setUlang((n) => n + 1)} className="btn-ghost mt-3 py-2">
            Coba lagi
          </button>
        </div>
      )}

      {loading && (
        <ul className="mt-4 space-y-3" aria-label="Memuat antrean laporan">
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className="card animate-pulse p-4 motion-reduce:animate-none">
              <div className="h-3 w-24 rounded bg-line" />
              <div className="mt-3 h-4 w-2/3 rounded bg-line" />
              <div className="mt-3 h-3 w-1/2 rounded bg-line" />
            </li>
          ))}
        </ul>
      )}

      {!loading && !error && (
        <>
          <p className="mt-4 text-sm text-ink-soft" aria-live="polite">
            {laporan.length} laporan · diurutkan dari prioritas tertinggi
          </p>
          {laporan.length === 0 ? (
            <div className="card mt-3 p-8 text-center">
              <p className="font-semibold text-ink">Tidak ada laporan yang cocok dengan filter ini.</p>
              <p className="mt-2 text-sm text-ink-soft">
                {adaFilter ? 'Coba longgarkan filter atau reset ke tampilan bawaan.' : 'Belum ada laporan masuk.'}
              </p>
              {adaFilter && (
                <button type="button" onClick={reset} className="btn-ghost mt-4">
                  Reset filter
                </button>
              )}
            </div>
          ) : (
            <ul className="mt-3 space-y-3">
              {laporan.map((l) => {
                const Ikon = IKON_STATUS[l.status]
                return (
                  <li key={l.kode}>
                    <Link
                      to={`/instansi/laporan/${l.kode}`}
                      className="card block p-4 transition-colors hover:border-brand-500 sm:p-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold tabular-nums text-ink-faint">{l.kode}</span>
                        <LencanaPrioritas level={l.prioritas.level} skor={l.prioritas.skor} />
                      </div>
                      <p className="mt-2 font-semibold text-ink">{l.judul}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-soft">
                        <span>Kec. {wilayahById(l.wilayahId)?.kecamatan ?? l.wilayahId}</span>
                        <span>{kategoriById(l.kategoriId)?.label ?? l.kategoriId}</span>
                        <span>Menunggu {tampilUmur(l.dibuat)}</span>
                        <span
                          className={`inline-flex items-center gap-1 font-semibold ${WARNA_STATUS[l.status] ?? 'text-ink-soft'}`}
                        >
                          <Ikon size={14} aria-hidden="true" /> {LABEL_STATUS[l.status]}
                        </span>
                        <span className="inline-flex items-center gap-1 tabular-nums">
                          <ThumbsUp size={14} aria-hidden="true" /> {l.jumlahDukungan} dukungan
                        </span>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
