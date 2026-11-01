import { Link } from 'react-router-dom'
import { Hammer } from 'lucide-react'

export default function SegeraHadir({ judul }) {
  return (
    <section className="container-page flex flex-col items-center py-24 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <Hammer size={26} />
      </span>
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight">{judul}</h1>
      <p className="mt-3 max-w-md text-ink-soft">
        Halaman ini sedang dikembangkan dan akan tersedia pada versi final. Sementara itu, coba alur pelaporan berkonteks.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/lapor" className="btn-primary">Coba Lapor</Link>
        <Link to="/" className="btn-ghost">Kembali ke Beranda</Link>
      </div>
    </section>
  )
}
