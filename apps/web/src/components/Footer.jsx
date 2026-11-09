import { Link } from 'react-router-dom'
import { Building2, Database, MapPin, ShieldCheck, Sparkles } from 'lucide-react'
import Logo from './Logo.jsx'

const KOLOM = [
  {
    judul: 'Layanan warga',
    tautan: [
      ['/lapor', 'Lapor Masalah'],
      ['/lacak', 'Lacak Laporan'],
      ['/peta', 'Peta Laporan'],
    ],
  },
  {
    judul: 'Transparansi',
    tautan: [
      ['/dasbor', 'Dasbor Akuntabilitas'],
      ['/metodologi', 'Metodologi Skor'],
      ['/instansi/masuk', 'Masuk Instansi'],
    ],
  },
]

export default function Footer() {
  return (
    <footer className="mt-20 bg-brand-900 text-brand-100">
      <div className="h-1.5 bg-gradient-to-r from-aksen-400 via-brand-400 to-brand-600" aria-hidden="true" />
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr]">
        <div>
          <Logo terang />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-brand-100/80">
            Laporan warga yang punya konteks, dilengkapi AI, diprioritaskan secara transparan, dan dinyatakan selesai
            setelah diverifikasi warga sekitar.
          </p>
          <ul className="mt-5 flex flex-wrap gap-2 text-xs">
            {[
              [Sparkles, 'Dilengkapi AI'],
              [ShieldCheck, 'Tanpa akun'],
              [MapPin, 'Berbasis lokasi'],
              [Building2, '3 tingkat instansi'],
            ].map(([Ikon, t]) => (
              <li key={t} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
                <Ikon size={13} className="text-aksen-400" aria-hidden="true" /> {t}
              </li>
            ))}
          </ul>
        </div>
        {KOLOM.map((k) => (
          <div key={k.judul}>
            <p className="font-display text-sm font-bold text-white">{k.judul}</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {k.tautan.map(([ke, label]) => (
                <li key={ke}>
                  <Link to={ke} className="transition-colors hover:text-aksen-300">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <p className="flex items-center gap-2 font-display text-sm font-bold text-white">
            <Database size={15} className="text-aksen-400" aria-hidden="true" /> Sumber data
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-brand-100/80">
            <li>IRBI & DIBI — BNPB</li>
            <li>Kemiskinan kab/kota — BPS</li>
            <li>Batas wilayah — geoBoundaries (BPS 2020, OSM)</li>
            <li>Peta — © OpenStreetMap</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-brand-100/60 sm:flex-row sm:justify-between">
          <p>Prototipe untuk Web In Action — MIA 2026. Bukan situs resmi pemerintah.</p>
          <p>Data di luar Bandung Raya bersifat ilustrasi.</p>
        </div>
      </div>
    </footer>
  )
}
