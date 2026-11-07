// PEMILIK: Ezra (sisi warga) · KONTRAK: docs/FRONTEND.md § 404
import { Link, useLocation } from 'react-router-dom'
import { Compass } from 'lucide-react'

export default function TidakDitemukan() {
  const { pathname } = useLocation()
  return (
    <section className="container-page flex flex-col items-center py-24 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <Compass size={26} />
      </span>
      <p className="mt-6 text-sm font-bold tabular-nums text-brand-600">404</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Halaman tidak ditemukan</h1>
      <p className="mt-3 max-w-md break-words text-ink-soft">
        Alamat <span className="font-mono text-sm text-ink">{pathname}</span> tidak ada. Mungkin salah ketik, atau
        tautannya sudah berubah.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/" className="btn-primary">
          Ke Beranda
        </Link>
        <Link to="/lapor" className="btn-ghost">
          Lapor masalah
        </Link>
        <Link to="/lacak" className="btn-ghost">
          Lacak laporan
        </Link>
      </div>
    </section>
  )
}
