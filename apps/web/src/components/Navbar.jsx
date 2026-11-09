import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Building2, Camera, ShieldCheck, X } from 'lucide-react'
import Logo from './Logo.jsx'
import { api } from '../services/api.js'

const MENU = [
  { to: '/peta', label: 'Peta Laporan' },
  { to: '/dasbor', label: 'Dasbor Akuntabilitas' },
  { to: '/metodologi', label: 'Metodologi' },
  { to: '/lacak', label: 'Lacak' },
]

export default function Navbar() {
  const [buka, setBuka] = useState(false)
  const laci = useRef(null)
  // React 18 belum mengenal atribut `inert` ⇒ dipasang langsung ke DOM.
  useEffect(() => {
    laci.current?.toggleAttribute('inert', !buka)
  }, [buka])
  const { pathname } = useLocation()
  const halamanInstansi = pathname.startsWith('/instansi')
  const halamanForm = pathname === '/lapor'
  // Sudah login ⇒ langsung ke panel; belum ⇒ halaman masuk (username + password). Dibaca ulang tiap pindah halaman.
  const sudahMasuk = Boolean(api.sesiInstansi()?.token)
  const instansi = sudahMasuk
    ? { to: '/instansi', label: 'Panel Instansi' }
    : { to: '/instansi/masuk', label: 'Masuk Instansi' }

  // Gaya portal pemerintahan: tautan aktif bergaris bawah hijau; bilah berbayang setelah digulir.
  const [tergulir, setTergulir] = useState(false)
  useEffect(() => {
    const cek = () => setTergulir(window.scrollY > 8)
    cek()
    window.addEventListener('scroll', cek, { passive: true })
    return () => window.removeEventListener('scroll', cek)
  }, [])
  useEffect(() => setBuka(false), [pathname])
  // Laci terbuka: kunci gulir halaman & tutup dengan Escape.
  useEffect(() => {
    if (!buka) return
    const tutup = (e) => e.key === 'Escape' && setBuka(false)
    const lama = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', tutup)
    return () => {
      document.body.style.overflow = lama
      window.removeEventListener('keydown', tutup)
    }
  }, [buka])

  const kelasLink = ({ isActive }) =>
    `relative inline-flex min-h-11 items-center px-3 py-2 text-sm font-bold transition-colors after:absolute after:inset-x-3 after:bottom-1 after:h-[3px] after:rounded-full after:transition-transform ${
      isActive
        ? 'text-brand-700 after:scale-x-100 after:bg-brand-500'
        : 'text-ink-soft after:scale-x-0 after:bg-brand-300 hover:text-brand-700 hover:after:scale-x-100'
    }`
  const kelasLinkHp = ({ isActive }) =>
    `inline-flex min-h-11 items-center rounded-xl px-3 py-2 text-sm font-bold ${
      isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-soft hover:bg-paper'
    }`

  return (
    <>
      <div className="hidden bg-brand-900 text-[12px] text-brand-100 md:block">
        <div className="container-page flex h-8 items-center justify-between">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-aksen-400" aria-hidden="true" /> Layanan laporan warga · prioritas
            transparan · diverifikasi warga
          </span>
          <span className="flex items-center gap-4">
            <Link to="/metodologi" className="hover:text-white">
              Rumus skor
            </Link>
            <Link to="/lacak" className="hover:text-white">
              Lacak laporan
            </Link>
          </span>
        </div>
      </div>
      <header
        className={`sticky top-0 z-[1000] border-b bg-white/95 backdrop-blur transition-shadow ${
          tergulir ? 'border-line shadow-[0_8px_24px_-18px_rgba(10,61,36,0.45)]' : 'border-transparent'
        }`}
      >
        <div className="container-page flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2" onClick={() => setBuka(false)}>
            <Logo />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Menu utama">
            {MENU.map((m) => (
              <NavLink key={m.to} to={m.to} className={kelasLink}>
                {m.label}
              </NavLink>
            ))}
            <Link to={instansi.to} className="btn-ghost ml-3 min-h-11 gap-2 py-2.5 text-sm">
              <Building2 size={16} aria-hidden="true" />
              {instansi.label}
            </Link>
            <Link to="/lapor" className="btn-primary ml-2 min-h-11 py-2.5">
              <Camera size={16} aria-hidden="true" /> Lapor Sekarang
            </Link>
          </nav>

          <button
            type="button"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-ink hover:bg-paper lg:hidden"
            aria-label={buka ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={buka}
            aria-controls="laci-menu"
            onClick={() => setBuka((v) => !v)}
          >
            <IkonHamburger buka={buka} />
          </button>
        </div>
      </header>

      {/* Laci menu HP: masuk dari kiri. Selalu dirender agar transisinya halus; inert saat tertutup. */}
      <div ref={laci} className={`fixed inset-0 z-[1200] lg:hidden ${buka ? '' : 'pointer-events-none'}`}>
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          onClick={() => setBuka(false)}
          className={`absolute inset-0 bg-brand-900/50 backdrop-blur-[2px] transition-opacity duration-300 ${
            buka ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <nav
          id="laci-menu"
          aria-label="Menu utama seluler"
          className={`absolute inset-y-0 left-0 flex w-[84%] max-w-xs flex-col bg-white shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
            buka ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-16 items-center justify-between border-b border-line px-4">
            <Link to="/" onClick={() => setBuka(false)}>
              <Logo />
            </Link>
            <button
              type="button"
              onClick={() => setBuka(false)}
              aria-label="Tutup menu"
              className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-ink hover:bg-paper"
            >
              <X size={22} className={`transition-transform duration-300 ${buka ? 'rotate-0' : '-rotate-90'}`} />
            </button>
          </div>
          <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
            {MENU.map((m, i) => (
              <NavLink
                key={m.to}
                to={m.to}
                className={(a) =>
                  `${kelasLinkHp(a)} transition-[transform,opacity] duration-300 ${buka ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'}`
                }
                style={{ transitionDelay: buka ? `${80 + i * 45}ms` : '0ms' }}
                onClick={() => setBuka(false)}
              >
                {m.label}
              </NavLink>
            ))}
          </div>
          <div className="flex flex-col gap-2 border-t border-line p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Link to="/lapor" className="btn-primary min-h-12" onClick={() => setBuka(false)}>
              <Camera size={18} aria-hidden="true" /> Lapor Sekarang
            </Link>
            <Link to={instansi.to} className="btn-ghost min-h-12 gap-2" onClick={() => setBuka(false)}>
              <Building2 size={18} aria-hidden="true" />
              {instansi.label}
            </Link>
          </div>
        </nav>
      </div>
      {!halamanInstansi && !halamanForm && (
        <nav
          className="fixed inset-x-0 bottom-0 z-[1100] grid grid-cols-2 gap-2 border-t border-line bg-white/95 px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-20px_rgba(15,31,46,0.45)] sm:hidden"
          aria-label="Aksi cepat warga"
        >
          <Link to="/lapor" className="btn-primary min-h-11 text-sm">
            Lapor masalah
          </Link>
          <Link to="/lacak" className="btn-ghost min-h-11 text-sm">
            Lacak laporan
          </Link>
        </nav>
      )}
    </>
  )
}

/** Tiga garis yang beranimasi menjadi X saat menu terbuka. */
function IkonHamburger({ buka }) {
  const garis =
    'absolute left-0 block h-[2.5px] w-[22px] rounded-full bg-current transition-all duration-300 ease-out motion-reduce:transition-none'
  return (
    <span className="relative block h-[18px] w-[22px]" aria-hidden="true">
      <span className={`${garis} ${buka ? 'top-[8px] rotate-45' : 'top-0'}`} />
      <span className={`${garis} top-[8px] ${buka ? 'scale-x-0 opacity-0' : 'opacity-100'}`} />
      <span className={`${garis} ${buka ? 'top-[8px] -rotate-45' : 'top-[16px]'}`} />
    </span>
  )
}
