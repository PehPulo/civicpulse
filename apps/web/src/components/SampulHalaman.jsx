// PEMILIK: Ezra (sisi warga)
// Sampul halaman bernuansa Nusantara: foto realistis (acak dari kumpulan per halaman, lib/pesona.js), gradasi hijau
// agar teks putih tetap terbaca, motif batik kawung tipis, dan kredit foto (wajib oleh lisensi CC BY / CC BY-SA).
import { useState } from 'react'
import { MapPin } from 'lucide-react'
import { FOTO_NUSANTARA, pilihFoto } from '../lib/pesona.js'

// Motif kawung: empat kelopak lonjong mengelilingi titik, diulang sebagai ubin 56px.
const KAWUNG = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56"><g fill="none" stroke="#fff" stroke-width="1.2"><ellipse cx="28" cy="14" rx="7" ry="12"/><ellipse cx="28" cy="42" rx="7" ry="12"/><ellipse cx="14" cy="28" rx="12" ry="7"/><ellipse cx="42" cy="28" rx="12" ry="7"/></g><circle cx="28" cy="28" r="2" fill="#fff"/><circle cx="0" cy="0" r="2" fill="#fff"/><circle cx="56" cy="0" r="2" fill="#fff"/><circle cx="0" cy="56" r="2" fill="#fff"/><circle cx="56" cy="56" r="2" fill="#fff"/></svg>',
)}")`

export function MotifKawung({ className = 'opacity-[0.07]' }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{ backgroundImage: KAWUNG, backgroundSize: '56px 56px' }}
      aria-hidden="true"
    />
  )
}

export function KreditFoto({ id, className = '' }) {
  const f = FOTO_NUSANTARA[id]
  if (!f) return null
  return (
    <a
      href={f.sumber}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center gap-1 text-[11px] text-white/75 underline-offset-2 hover:text-white hover:underline ${className}`}
    >
      <MapPin size={11} aria-hidden="true" />
      {f.nama}, {f.lokasi} · Foto: {f.kredit} · {f.lisensi}
    </a>
  )
}

/** Foto latar + gradasi + kawung, mengisi induk yang `relative`. */
export function LatarFoto({ id, arah = 'kiri', prioritas = false }) {
  const gradasi =
    arah === 'bawah'
      ? 'bg-gradient-to-t from-brand-900 via-brand-900/75 to-brand-900/30'
      : 'bg-gradient-to-r from-brand-900/95 via-brand-900/75 to-brand-900/25'
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <img
        src={`/pesona/${id}.webp`}
        alt=""
        className="h-full w-full scale-105 object-cover motion-safe:animate-sampul"
        fetchpriority={prioritas ? 'high' : 'auto'}
        decoding="async"
      />
      <div className={`absolute inset-0 ${gradasi}`} />
      <MotifKawung />
      {/* Garis merah-putih (Sang Saka) di bawah sampul */}
      <div className="absolute inset-x-0 bottom-0">
        <div className="h-[3px] bg-[#ce1126]" />
        <div className="h-[3px] bg-white" />
      </div>
    </div>
  )
}

/**
 * Sampul lebar penuh di atas halaman.
 * @param {{halaman: string, eyebrow?: string, judul: string, sub?: import('react').ReactNode,
 *   kanan?: import('react').ReactNode, children?: import('react').ReactNode, sempit?: boolean}} p
 */
export default function SampulHalaman({ halaman, eyebrow, judul, sub, kanan, children, sempit = false }) {
  const [id] = useState(() => pilihFoto(halaman))
  return (
    <header className="relative isolate overflow-hidden bg-brand-900 text-white">
      <LatarFoto id={id} prioritas />
      <div className={`container-page relative pb-8 pt-12 sm:pb-10 sm:pt-16 ${sempit ? 'max-w-3xl' : ''}`}>
        <div className="flex animate-muncul flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            {eyebrow && (
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-aksen-300 ring-1 ring-white/15 backdrop-blur-sm">
                {eyebrow}
              </p>
            )}
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight drop-shadow-sm sm:text-5xl">{judul}</h1>
            {sub && <div className="mt-3 text-white/85 sm:text-lg">{sub}</div>}
          </div>
          {kanan && <div className="flex flex-wrap items-center gap-3">{kanan}</div>}
        </div>
        {children}
        <KreditFoto id={id} className="mt-6" />
      </div>
    </header>
  )
}
