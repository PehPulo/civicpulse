import { Link } from 'react-router-dom'
import Logo from './Logo.jsx'

export default function Footer() {
  return (
    <footer className="mt-20 bg-brand-900 text-brand-100">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo terang />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-brand-100/80">
            Laporan warga yang punya konteks, diprioritaskan secara transparan, dan dinyatakan selesai setelah
            diverifikasi warga sekitar.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Platform</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/lapor" className="hover:text-white">Lapor Masalah</Link></li>
            <li><Link to="/peta" className="hover:text-white">Peta Laporan</Link></li>
            <li><Link to="/dasbor" className="hover:text-white">Dasbor Akuntabilitas</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Sumber data</p>
          <ul className="mt-3 space-y-2 text-sm text-brand-100/80">
            <li>IRBI & DIBI — BNPB</li>
            <li>Kemiskinan kab/kota — BPS</li>
            <li>Peta — © OpenStreetMap</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="container-page py-5 text-xs text-brand-100/60">
          Prototipe untuk Web In Action — MIA 2026. Angka wilayah pada versi ini adalah data ilustrasi.
        </p>
      </div>
    </footer>
  )
}
