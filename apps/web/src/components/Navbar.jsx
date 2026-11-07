import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Logo from './Logo.jsx'

const MENU = [
  { to: '/peta', label: 'Peta Laporan' },
  { to: '/dasbor', label: 'Dasbor Akuntabilitas' },
  { to: '/metodologi', label: 'Metodologi' },
  { to: '/lacak', label: 'Lacak' },
]

export default function Navbar() {
  const [buka, setBuka] = useState(false)
  const { pathname } = useLocation()
  const halamanInstansi = pathname.startsWith('/instansi')
  const halamanForm = pathname === '/lapor'

  const kelasLink = ({ isActive }) =>
    `inline-flex min-h-11 items-center rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
      isActive ? 'bg-brand-50 text-brand-800' : 'text-ink-soft hover:bg-white hover:text-ink'
    }`

  return (
    <>
      <header className="sticky top-0 z-[1000] border-b border-line bg-paper/95 backdrop-blur">
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
            <Link to="/lapor" className="btn-primary ml-3 min-h-11 py-2.5">
              Lapor Sekarang
            </Link>
          </nav>

          <button
            type="button"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-ink hover:bg-white lg:hidden"
            aria-label={buka ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={buka}
            onClick={() => setBuka((v) => !v)}
          >
            {buka ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {buka && (
          <nav className="border-t border-line bg-paper lg:hidden" aria-label="Menu utama seluler">
            <div className="container-page flex flex-col gap-1 py-3">
              {MENU.map((m) => (
                <NavLink key={m.to} to={m.to} className={kelasLink} onClick={() => setBuka(false)}>
                  {m.label}
                </NavLink>
              ))}
              <Link to="/lapor" className="btn-primary mt-2 min-h-12" onClick={() => setBuka(false)}>
                Lapor Sekarang
              </Link>
            </div>
          </nav>
        )}
      </header>
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
