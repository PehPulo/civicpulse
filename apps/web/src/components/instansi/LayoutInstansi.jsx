// PEMILIK: Yance (sisi instansi) · KONTRAK: docs/FRONTEND.md § Sisi instansi
// <Outlet /> = tempat halaman anak (Antrean, TindakLanjut, Kinerja) dirender. JANGAN dihapus.
import { useState } from 'react'
import { Link, Outlet, useMatch, useNavigate } from 'react-router-dom'
import { BarChart3, Building2, CheckCircle2, ListOrdered, LoaderCircle, LogOut, RotateCcw } from 'lucide-react'
import { api } from '../../services/api.js'
import { useAksi } from '../../hooks/useApi.js'

export default function LayoutInstansi() {
  const navigate = useNavigate()
  const kinerjaAktif = Boolean(useMatch('/instansi/kinerja'))
  const [pesan, setPesan] = useState('')
  const [resetDemo, { proses, error }] = useAksi(api.reset)
  const petugas = api.sesiInstansi()?.petugas

  const keluar = () => {
    api.logoutInstansi()
    navigate('/instansi/masuk', { replace: true })
  }

  const reset = async () => {
    if (proses) return
    const setuju = window.confirm(
      'Reset data demo? Semua laporan, dukungan, dan verifikasi di browser ini akan diganti dengan data contoh. Tindakan ini tidak dapat dibatalkan.',
    )
    if (!setuju) return
    setPesan('')
    const hasil = await resetDemo()
    if (hasil) setPesan('Data demo berhasil direset. Laporan contoh sudah dimuat ulang.')
  }

  const menu = [
    { tujuan: '/instansi', label: 'Antrean', ikon: ListOrdered, aktif: !kinerjaAktif },
    { tujuan: '/instansi/kinerja', label: 'Kinerja', ikon: BarChart3, aktif: kinerjaAktif },
  ]

  return (
    <div className="container-page py-6 sm:py-8">
      <header className="card overflow-hidden" aria-label="Panel petugas instansi">
        <div className="flex flex-col gap-4 border-b border-brand-100 bg-brand-50 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <Building2 size={26} className="mt-1 shrink-0 text-brand-600" aria-hidden="true" />
            <div className="min-w-0">
              <p className="eyebrow">Panel instansi</p>
              <p className="mt-1 break-words font-semibold text-ink">{petugas}</p>
            </div>
          </div>
          <button type="button" onClick={keluar} disabled={proses} className="btn-ghost min-h-11 shrink-0">
            <LogOut size={18} aria-hidden="true" /> Keluar
          </button>
        </div>

        <div className="flex flex-col gap-4 p-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-6 sm:py-4">
          <nav aria-label="Navigasi instansi" className="grid grid-cols-2 gap-2 sm:flex">
            {menu.map(({ tujuan, label, ikon: Ikon, aktif }) => (
              <Link
                key={tujuan}
                to={tujuan}
                aria-current={aktif ? 'page' : undefined}
                className={`flex min-h-11 items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition-colors ${
                  aktif
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-line bg-white text-ink-soft hover:border-brand-500 hover:text-brand-700'
                }`}
              >
                <Ikon size={18} aria-hidden="true" /> {label}
              </Link>
            ))}
          </nav>

          {api.mode === 'lokal' && (
            <div className="flex flex-col gap-2 sm:items-end">
              <button type="button" onClick={reset} disabled={proses} className="btn-ghost min-h-11">
                {proses ? (
                  <LoaderCircle size={18} className="motion-safe:animate-spin" aria-hidden="true" />
                ) : (
                  <RotateCcw size={18} aria-hidden="true" />
                )}
                <span aria-live="polite">{proses ? 'Mereset data…' : 'Reset data demo'}</span>
              </button>
              <p className="text-center text-xs text-ink-soft sm:text-right">Khusus data demo di browser ini.</p>
            </div>
          )}
        </div>
      </header>

      {error && (
        <p role="alert" className="mt-4 rounded-xl border border-tinggi bg-orange-50 p-4 text-sm text-tinggi">
          {error.message}
        </p>
      )}
      {pesan && (
        <p
          role="status"
          className="mt-4 flex items-start gap-2 rounded-xl border border-brand-100 bg-brand-50 p-4 text-sm text-brand-900"
        >
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" aria-hidden="true" /> {pesan}
        </p>
      )}

      <div className="mt-6 min-w-0">
        <Outlet />
      </div>
    </div>
  )
}
