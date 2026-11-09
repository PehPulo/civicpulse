// PEMILIK: Ezra (sisi warga) · KONTRAK: docs/FRONTEND.md § /lacak
// Lacak laporan: cari dengan kode lacak, atau lihat laporan yang terkait perangkat ini (tanpa akun/login).
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Inbox, Search, ShieldCheck, ThumbsUp } from 'lucide-react'
import { LABEL_STATUS, POLA_KODE, STATUS, kategoriById } from '@civicpulse/core'
import { api } from '../services/api.js'
import { useApi } from '../hooks/useApi.js'
import { lokasiPendek, wilayahById } from '../lib/peta.js'
import { LencanaPrioritas } from '../components/Prioritas.jsx'
import SampulHalaman from '../components/SampulHalaman.jsx'

const TAHAP = [STATUS.DITERIMA, STATUS.DIPROSES, STATUS.KLAIM_SELESAI, STATUS.TERVERIFIKASI]
const TAB = [
  { id: 'pelapor', label: 'Laporanku', ikon: Inbox, kosong: 'Belum ada laporan dari perangkat ini.' },
  { id: 'dukung', label: 'Yang ku-+1', ikon: ThumbsUp, kosong: 'Kamu belum menekan +1 pada laporan mana pun.' },
  { id: 'verifikasi', label: 'Yang kuverifikasi', ikon: ShieldCheck, kosong: 'Kamu belum mengirim verifikasi.' },
]
const tanggal = (iso) => new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })

export default function Lacak() {
  const navigate = useNavigate()
  const [kode, setKode] = useState('')
  const [galat, setGalat] = useState('')
  const [tab, setTab] = useState('pelapor')
  const { data, loading, error } = useApi(() => api.daftarLaporan(), [])

  const cari = (e) => {
    e.preventDefault()
    const k = kode.trim().toUpperCase()
    if (!POLA_KODE.test(k)) {
      setGalat('Format kode lacak: CP-TAHUN-NOMOR, misalnya CP-2026-0417.')
      return
    }
    navigate(`/laporan/${k}`)
  }

  const milik = (id) =>
    (data ?? [])
      .filter((l) => l.saya?.[id])
      .sort((a, b) => (b.riwayat.at(-1)?.waktu ?? '').localeCompare(a.riwayat.at(-1)?.waktu ?? ''))
  const daftar = milik(tab)
  const aktif = TAB.find((t) => t.id === tab)

  return (
    <>
      <SampulHalaman
        halaman="lacak"
        sempit
        eyebrow="Kawal sampai tuntas"
        judul="Lacak laporan"
        sub="Pantau tindak lanjut laporan sampai benar-benar terbukti beres."
      />
      <section className="container-page max-w-3xl py-8 sm:py-10">
        <form onSubmit={cari} className="card mt-8 p-5 sm:p-6" noValidate>
          <label htmlFor="kode" className="font-bold">
            Punya kode lacak?
          </label>
          <div className="mt-3 flex gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-line bg-white px-3 focus-within:border-brand-500">
              <Search size={18} className="shrink-0 text-ink-faint" aria-hidden="true" />
              <input
                id="kode"
                value={kode}
                onChange={(e) => {
                  setKode(e.target.value)
                  setGalat('')
                }}
                placeholder="CP-2026-0417"
                autoCapitalize="characters"
                autoComplete="off"
                aria-invalid={Boolean(galat)}
                aria-describedby={galat ? 'galat-kode' : undefined}
                className="min-w-0 flex-1 bg-transparent py-3 text-sm uppercase outline-none placeholder:normal-case placeholder:text-ink-faint"
              />
            </div>
            <button type="submit" className="btn-primary">
              Lacak
            </button>
          </div>
          {galat && (
            <p id="galat-kode" role="alert" className="mt-2 text-sm text-tinggi">
              {galat}
            </p>
          )}
        </form>

        <div className="mt-10">
          <h2 className="text-xl font-bold">Dari perangkat ini</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Tersimpan otomatis tanpa akun. Ganti HP atau browser? Pakai kode lacak di atas.
          </p>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Kelompok laporan">
            {TAB.map((t) => {
              const jumlah = milik(t.id).length
              const dipilih = tab === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={dipilih}
                  onClick={() => setTab(t.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                    dipilih
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-line bg-white text-ink-soft hover:text-ink'
                  }`}
                >
                  <t.ikon size={15} /> {t.label}
                  {data && (
                    <span className={`tabular-nums ${dipilih ? 'text-white/80' : 'text-ink-faint'}`}>{jumlah}</span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="mt-4" role="tabpanel" aria-label={aktif.label}>
            {loading && <p className="text-sm text-ink-faint">Memuat…</p>}
            {error && (
              <p role="alert" className="text-sm text-tinggi">
                {error.message}
              </p>
            )}
            {data && !daftar.length && (
              <div className="rounded-2xl border border-dashed border-line p-8 text-center">
                <p className="text-ink-soft">{aktif.kosong}</p>
                {tab === 'pelapor' && (
                  <Link to="/lapor" className="btn-primary mt-4">
                    Buat laporan <ArrowRight size={16} />
                  </Link>
                )}
              </div>
            )}
            <ul className="space-y-3">
              {daftar.map((l) => (
                <li key={l.kode}>
                  <KartuLacak laporan={l} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  )
}

function KartuLacak({ laporan: l }) {
  const ulang = l.status === STATUS.DIBUKA_ULANG
  const posisi = ulang ? 1 : TAHAP.indexOf(l.status)
  const w = wilayahById(l.wilayahId)
  return (
    <Link to={`/laporan/${l.kode}`} className="card block p-5 transition-colors hover:border-ink-faint">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold tabular-nums text-ink-faint">
            {l.kode} · {kategoriById(l.kategoriId)?.label}
          </p>
          <p className="mt-1 font-bold">{l.judul}</p>
          <p className="text-sm text-ink-soft">
            {lokasiPendek(w)} · diperbarui {tanggal(l.riwayat.at(-1)?.waktu ?? l.dibuat)}
          </p>
        </div>
        <LencanaPrioritas level={l.prioritas.level} skor={l.prioritas.skor} />
      </div>
      <ol className="mt-4 grid grid-cols-4 gap-1.5" aria-label={`Status: ${LABEL_STATUS[l.status]}`}>
        {TAHAP.map((s, i) => (
          <li key={s}>
            <div
              className={`h-1.5 rounded-full ${i <= posisi ? (ulang && i === posisi ? 'bg-tinggi' : 'bg-brand-600') : 'bg-line'}`}
            />
            <p
              className={`mt-1.5 hidden text-[11px] sm:block ${i === posisi ? 'font-semibold text-ink' : 'text-ink-faint'}`}
            >
              {LABEL_STATUS[s]}
            </p>
          </li>
        ))}
      </ol>
      <p className={`mt-2 text-sm font-semibold sm:hidden ${ulang ? 'text-tinggi' : 'text-ink'}`}>
        {LABEL_STATUS[l.status]}
      </p>
      {ulang && (
        <p className="mt-1 hidden text-sm font-semibold text-tinggi sm:block">Dibuka ulang: belum terbukti beres</p>
      )}
    </Link>
  )
}
