// PEMILIK: Yance (sisi instansi) · desain ulang panel admin: Ezra · KONTRAK: docs/FRONTEND.md § Sisi instansi
// Kerangka admin: bilah atas berwarna selebar layar (logo, cari, notifikasi, profil) + sidebar putih bergrup.
// Sidebar bisa diciutkan (desktop) dan menjadi laci (HP). <Outlet /> = halaman anak. JANGAN dihapus.
// Lencana & notifikasi dihitung dari data dengan ringkasanAntrean() (@civicpulse/core), bukan angka statis.
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  BarChart3,
  ChevronDown,
  ExternalLink,
  LayoutDashboard,
  ListOrdered,
  LoaderCircle,
  LogOut,
  Map as IkonPeta,
  Menu,
  RotateCcw,
  Search,
  Sparkles,
  TimerOff,
  UserRoundPen,
  X,
} from 'lucide-react'
import { POLA_KODE, ringkasanAntrean } from '@civicpulse/core'
import { api } from '../../services/api.js'
import { useAksi, useApi } from '../../hooks/useApi.js'
import { AI_DI_SERVER } from '../../ai/index.js'
import Logo from '../Logo.jsx'

const GRUP = [
  {
    judul: 'Menu',
    item: [
      { to: '/instansi', end: true, label: 'Ringkasan', ikon: LayoutDashboard },
      { to: '/instansi/antrean', label: 'Antrean laporan', ikon: ListOrdered, lencana: true },
      { to: '/instansi/peta', label: 'Peta tugas', ikon: IkonPeta },
    ],
  },
  {
    judul: 'Analitik',
    item: [
      { to: '/instansi/kinerja', label: 'Kinerja & target', ikon: BarChart3 },
      { to: '/instansi/ai', label: 'AI & pemakaian', ikon: Sparkles },
    ],
  },
]

function inisial(nama) {
  return (
    nama
      .split(/[\s·]+/)
      .filter((k) => /^[A-Za-z]/.test(k))
      .slice(0, 2)
      .map((k) => k[0].toUpperCase())
      .join('') || 'P'
  )
}

/** Tutup popover saat klik di luar atau tekan Escape. */
function useTutupLuar(buka, setBuka) {
  const ref = useRef(null)
  useEffect(() => {
    if (!buka) return
    const klik = (e) => ref.current && !ref.current.contains(e.target) && setBuka(false)
    const esc = (e) => e.key === 'Escape' && setBuka(false)
    document.addEventListener('mousedown', klik)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', klik)
      document.removeEventListener('keydown', esc)
    }
  }, [buka, setBuka])
  return ref
}

export default function LayoutInstansi() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [ciut, setCiut] = useState(false) // desktop: sidebar hanya ikon
  const [laci, setLaci] = useState(false) // HP: sidebar sebagai laci
  const [notif, setNotif] = useState(false)
  const [profil, setProfil] = useState(false)
  const [cari, setCari] = useState('')
  const refNotif = useTutupLuar(notif, setNotif)
  const refProfil = useTutupLuar(profil, setProfil)
  const [resetDemo, { proses }] = useAksi(api.reset)

  const sesi = api.sesiInstansi()
  const petugas = sesi?.petugas ?? 'Petugas'
  const [nama, unit] = petugas.split(' · ')
  const { data } = useApi(() => api.daftarLaporan({}), [])
  const r = data ? ringkasanAntrean(data) : null
  const byKode = new Map((data ?? []).map((l) => [l.kode, l]))

  useEffect(() => setLaci(false), [pathname])

  const keluar = () => {
    api.logoutInstansi()
    navigate('/instansi/masuk', { replace: true })
  }

  const kirimCari = (e) => {
    e.preventDefault()
    const q = cari.trim()
    if (!q) return
    if (POLA_KODE.test(q.toUpperCase())) navigate(`/instansi/laporan/${q.toUpperCase()}`)
    else navigate(`/instansi/antrean?q=${encodeURIComponent(q)}&status=semua`)
    setCari('')
  }

  const reset = async () => {
    if (window.confirm('Reset data demo di browser ini ke data contoh?')) await resetDemo()
  }

  const lebar = ciut ? 'lg:w-[72px]' : 'lg:w-64'
  const geser = ciut ? 'lg:pl-[72px]' : 'lg:pl-64'

  return (
    <div className="min-h-screen bg-[#f1f4f3]">
      {/* ── Bilah atas ── */}
      <header className="fixed inset-x-0 top-0 z-[1200] flex h-16 items-center bg-brand-600 text-white shadow-[0_2px_12px_-4px_rgba(6,48,42,0.5)]">
        <div
          className={`flex h-full shrink-0 items-center justify-between gap-2 px-4 ${ciut ? 'lg:w-[72px]' : 'lg:w-64'} lg:bg-brand-700`}
        >
          <Link to="/instansi" className={ciut ? 'lg:hidden' : ''} aria-label="Ringkasan panel">
            <Logo terang />
          </Link>
          <button
            type="button"
            onClick={() => (window.innerWidth >= 1024 ? setCiut((v) => !v) : setLaci((v) => !v))}
            className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-white/10"
            aria-label="Buka/tutup menu samping"
          >
            {laci ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-2 px-3 sm:px-5">
          <form onSubmit={kirimCari} role="search" className="hidden min-w-0 max-w-md flex-1 md:block">
            <label className="relative block">
              <span className="sr-only">Cari laporan</span>
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-100"
                aria-hidden="true"
              />
              <input
                value={cari}
                onChange={(e) => setCari(e.target.value)}
                placeholder="Cari kode CP-2026-… atau kata kunci"
                className="h-10 w-full rounded-full bg-white/15 pl-9 pr-4 text-sm text-white placeholder:text-brand-100 outline-none focus:bg-white focus:text-ink focus:placeholder:text-ink-faint"
              />
            </label>
          </form>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <span className="hidden items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold xl:inline-flex">
              <span className={`h-2 w-2 rounded-full ${AI_DI_SERVER ? 'bg-green-300' : 'bg-amber-300'}`} />
              {api.mode === 'server' ? 'Server' : 'Lokal'} · AI {AI_DI_SERVER ? 'aktif' : 'mati'}
            </span>

            <div ref={refNotif} className="relative">
              <button
                type="button"
                onClick={() => setNotif((v) => !v)}
                className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
                aria-label={`Notifikasi: ${r?.lewatSla ?? 0} laporan lewat target`}
                aria-expanded={notif}
              >
                <Bell size={18} />
                {r?.lewatSla > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-tinggi px-1 text-[10px] font-bold ring-2 ring-brand-600">
                    {r.lewatSla}
                  </span>
                )}
              </button>
              {notif && (
                <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl bg-white text-ink shadow-xl ring-1 ring-line">
                  <p className="border-b border-line px-4 py-3 text-sm font-bold">
                    Lewat target waktu ({r?.lewatSla ?? 0})
                  </p>
                  <ul className="max-h-80 divide-y divide-line overflow-y-auto">
                    {(r?.daftarLewat ?? []).slice(0, 8).map((kode) => (
                      <li key={kode}>
                        <Link
                          to={`/instansi/laporan/${kode}`}
                          onClick={() => setNotif(false)}
                          className="flex gap-3 px-4 py-3 hover:bg-paper"
                        >
                          <TimerOff size={16} className="mt-0.5 shrink-0 text-tinggi" aria-hidden="true" />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold">{byKode.get(kode)?.judul}</span>
                            <span className="text-xs text-ink-faint">{kode}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                    {r && r.lewatSla === 0 && (
                      <li className="px-4 py-6 text-center text-sm text-ink-soft">Semua laporan masih dalam target.</li>
                    )}
                  </ul>
                  <Link
                    to="/instansi/antrean?sla=lewat"
                    onClick={() => setNotif(false)}
                    className="block bg-paper px-4 py-2.5 text-center text-xs font-semibold text-brand-700"
                  >
                    Lihat di antrean
                  </Link>
                </div>
              )}
            </div>

            <div ref={refProfil} className="relative">
              <button
                type="button"
                onClick={() => setProfil((v) => !v)}
                className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-white/10"
                aria-expanded={profil}
                aria-label="Menu profil"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-extrabold text-brand-700">
                  {inisial(nama)}
                </span>
                <span className="hidden text-left leading-tight sm:block">
                  <span className="block text-sm font-semibold">{nama}</span>
                  <span className="block text-[11px] text-brand-100">{unit ?? 'Instansi'}</span>
                </span>
                <ChevronDown size={14} className="hidden sm:block" aria-hidden="true" />
              </button>
              {profil && (
                <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl bg-white py-1 text-ink shadow-xl ring-1 ring-line">
                  <Link
                    to="/instansi/profil"
                    onClick={() => setProfil(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-paper"
                  >
                    <UserRoundPen size={15} aria-hidden="true" /> Edit profil
                  </Link>
                  <Link to="/" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-paper">
                    <ExternalLink size={15} aria-hidden="true" /> Lihat situs publik
                  </Link>
                  {api.mode === 'lokal' && (
                    <button
                      type="button"
                      onClick={reset}
                      disabled={proses}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-paper"
                    >
                      {proses ? (
                        <LoaderCircle size={15} className="animate-spin" />
                      ) : (
                        <RotateCcw size={15} aria-hidden="true" />
                      )}{' '}
                      Reset data demo
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={keluar}
                    className="flex w-full items-center gap-2 border-t border-line px-4 py-2.5 text-sm text-tinggi hover:bg-orange-50"
                  >
                    <LogOut size={15} aria-hidden="true" /> Keluar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Sidebar ── */}
      {laci && (
        <div className="fixed inset-0 z-[1090] bg-ink/40 lg:hidden" onClick={() => setLaci(false)} aria-hidden="true" />
      )}
      <aside
        className={`fixed bottom-0 left-0 top-16 z-[1100] w-72 overflow-y-auto border-r border-line bg-white transition-transform duration-200 lg:translate-x-0 ${lebar} ${laci ? 'translate-x-0' : '-translate-x-full'}`}
        aria-label="Menu panel instansi"
      >
        <div className="flex min-h-full flex-col">
          <nav className="flex-1 px-3 py-5">
            {GRUP.map((g) => (
              <div key={g.judul} className="mb-5">
                <p
                  className={`mb-2 px-3 text-[11px] font-extrabold uppercase tracking-[0.12em] text-brand-600 ${ciut ? 'lg:hidden' : ''}`}
                >
                  {g.judul}
                </p>
                <ul className="space-y-0.5">
                  {g.item.map(({ to, end, label, ikon: Ikon, lencana }) => (
                    <li key={to}>
                      <NavLink
                        to={to}
                        end={end}
                        title={label}
                        className={({ isActive }) =>
                          `relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm transition-colors ${ciut ? 'lg:justify-center lg:px-0' : ''} ${
                            isActive
                              ? 'bg-brand-50 font-bold text-brand-800'
                              : 'font-medium text-ink-soft hover:bg-paper hover:text-ink'
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            {isActive && (
                              <span
                                className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-brand-600"
                                aria-hidden="true"
                              />
                            )}
                            <Ikon
                              size={18}
                              className={isActive ? 'text-brand-600' : 'text-ink-faint'}
                              aria-hidden="true"
                            />
                            <span className={ciut ? 'lg:sr-only' : ''}>{label}</span>
                            {lencana && r && (
                              <span className={`ml-auto flex gap-1 ${ciut ? 'lg:hidden' : ''}`}>
                                {r.lewatSla > 0 && (
                                  <span className="rounded-full bg-tinggi px-2 py-0.5 text-[10px] font-bold text-white">
                                    {r.lewatSla}
                                  </span>
                                )}
                                <span className="rounded-full bg-paper px-2 py-0.5 text-[10px] font-bold text-ink-soft">
                                  {r.terbuka}
                                </span>
                              </span>
                            )}
                          </>
                        )}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {r && (
              <div className={`mx-1 mt-2 rounded-2xl bg-brand-50 p-4 ${ciut ? 'lg:hidden' : ''}`}>
                <p className="text-xs font-bold text-brand-900">Antrean terbuka</p>
                <p className="mt-1 text-2xl font-extrabold tabular-nums text-brand-900">{r.terbuka}</p>
                <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-white" aria-hidden="true">
                  <span
                    className="bg-tinggi"
                    style={{ width: `${(r.perLevel.Tinggi / Math.max(1, r.terbuka)) * 100}%` }}
                  />
                  <span
                    className="bg-sedang"
                    style={{ width: `${(r.perLevel.Sedang / Math.max(1, r.terbuka)) * 100}%` }}
                  />
                  <span
                    className="bg-rendah"
                    style={{ width: `${(r.perLevel.Rendah / Math.max(1, r.terbuka)) * 100}%` }}
                  />
                </div>
                <p className="mt-2 text-[11px] text-brand-800">
                  {r.perLevel.Tinggi} tinggi · {r.perLevel.Sedang} sedang · {r.perLevel.Rendah} rendah
                </p>
              </div>
            )}
          </nav>

          {/* Kartu profil: edit profil & keluar */}
          <div className={`sticky bottom-0 border-t border-line bg-white p-3 ${ciut ? 'lg:px-2' : ''}`}>
            <div
              className={`flex items-center gap-3 rounded-2xl bg-paper p-2.5 ${ciut ? 'lg:flex-col lg:bg-transparent lg:p-0' : ''}`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-extrabold text-white">
                {inisial(nama)}
              </span>
              <div className={`min-w-0 flex-1 ${ciut ? 'lg:hidden' : ''}`}>
                <p className="truncate text-sm font-bold text-ink">{nama}</p>
                <p className="truncate text-xs text-ink-faint">{sesi?.jabatan || unit || 'Instansi'}</p>
              </div>
            </div>
            <div className={`mt-2 grid gap-1.5 ${ciut ? 'lg:grid-cols-1' : 'grid-cols-2'}`}>
              <NavLink
                to="/instansi/profil"
                title="Edit profil"
                className={({ isActive }) =>
                  `flex min-h-10 items-center justify-center gap-1.5 rounded-xl text-xs font-semibold ring-1 ${isActive ? 'bg-brand-50 text-brand-800 ring-brand-100' : 'text-ink-soft ring-line hover:bg-paper'}`
                }
              >
                <UserRoundPen size={15} aria-hidden="true" />{' '}
                <span className={ciut ? 'lg:sr-only' : ''}>Edit profil</span>
              </NavLink>
              <button
                type="button"
                onClick={keluar}
                title="Keluar"
                className="flex min-h-10 items-center justify-center gap-1.5 rounded-xl text-xs font-semibold text-tinggi ring-1 ring-orange-200 hover:bg-orange-50"
              >
                <LogOut size={15} aria-hidden="true" /> <span className={ciut ? 'lg:sr-only' : ''}>Keluar</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Konten ── */}
      <div className={`pt-16 transition-[padding] duration-200 ${geser}`}>
        <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
