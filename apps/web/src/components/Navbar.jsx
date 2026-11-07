import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Logo from './Logo.jsx'

const MENU = [
  { to: '/peta', label: 'Peta Laporan' },
  { to: '/dasbor', label: 'Dasbor Akuntabilitas' },
  { to: '/metodologi', label: 'Metodologi' },
  { to: '/data', label: 'Data Terbuka' },
  { to: '/lacak', label: 'Lacak' },
]

export default function Navbar() {
  const [buka, setBuka] = useState(false)

  const kelasLink = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      isActive ? 'text-brand-700' : 'text-ink-soft hover:text-ink'
    }`

  return (
    <header className="sticky top-0 z-[1000] border-b border-line bg-paper/90 backdrop-blur">
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
          <Link to="/lapor" className="btn-primary ml-3 py-2.5">
            Lapor Sekarang
          </Link>
        </nav>

        <button
          type="button"
          className="rounded-lg p-2 text-ink lg:hidden"
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
            <Link to="/lapor" className="btn-primary mt-2" onClick={() => setBuka(false)}>
              Lapor Sekarang
            </Link>
          </div>
        </nav>
      )}
    </header>
  )
}
