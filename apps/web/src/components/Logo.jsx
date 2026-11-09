// Logo CivicPulse (desain tim, lihat "CivicPulse Logo Identity Showcase.png"): pin lokasi + garis detak + kilau AI
// kuning dengan empat simpul. Celah di pin sekitar kilau dibuat dengan mask, jadi tampil benar di latar apa pun.
// terang = untuk latar gelap (pin putih, garis putih); tagline = "Lapor Warga · Dilengkapi AI" di bawah nama.
import { useId } from 'react'

export function SimbolLogo({ terang = false, className = 'h-9 w-auto' }) {
  const id = useId().replace(/:/g, '')
  const pin = terang ? '#ffffff' : '#069550'
  const garis = terang ? '#ffffff' : '#0a3d24'
  return (
    <svg viewBox="0 0 100 116" className={className} aria-hidden="true">
      <defs>
        <mask id={`celah-${id}`}>
          <rect width="100" height="116" fill="#fff" />
          <circle cx="77" cy="22" r="19" fill="#000" />
        </mask>
      </defs>
      <g mask={`url(#celah-${id})`}>
        <path d="M50 8C25 8 8 26 8 49c0 24 22 45 42 62 20-17 42-38 42-62C92 26 75 8 50 8Z" fill={pin} />
        <circle cx="50" cy="49" r="27" fill={terang ? 'transparent' : '#ffffff'} />
        {terang && <circle cx="50" cy="49" r="27" fill="#0a3d24" opacity="0.55" />}
      </g>
      <path
        d="M20 52h17l7-19 8 34 7-22 5 7h16"
        fill="none"
        stroke={garis}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <g fill="#ffd026">
        <path d="M77 7c1.6 9 5.6 13 14 15-8.4 2-12.4 6-14 15-1.6-9-5.6-13-14-15 8.4-2 12.4-6 14-15Z" />
        <circle cx="77" cy="6.5" r="5" />
        <circle cx="92" cy="22" r="5" />
        <circle cx="77" cy="37.5" r="5" />
        <circle cx="62" cy="22" r="5" />
      </g>
    </svg>
  )
}

export default function Logo({ terang = false, tagline = false }) {
  return (
    <span className="flex items-center gap-2">
      <SimbolLogo terang={terang} className="h-9 w-auto shrink-0" />
      <span className="flex flex-col leading-none">
        <span
          className={`font-display text-xl font-extrabold tracking-tight ${terang ? 'text-white' : 'text-brand-900'}`}
        >
          Civic<span className={terang ? 'text-brand-200' : 'text-brand-600'}>Pulse</span>
        </span>
        {tagline && (
          <span
            className={`mt-1 hidden text-[9.5px] font-semibold tracking-[0.12em] sm:block ${
              terang ? 'text-white/75' : 'text-brand-800/80'
            }`}
          >
            Lapor Warga · Dilengkapi AI
          </span>
        )}
      </span>
    </span>
  )
}
