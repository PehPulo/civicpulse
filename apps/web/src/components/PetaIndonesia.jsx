// Latar hero: peta Indonesia (SVG dari /geo/provinsi.json) dengan pin laporan yang berdenyut.
// Ringan (satu path SVG, animasi SMIL/CSS) sehingga tampil juga di HP. Dekoratif saja (aria-hidden).
import { useEffect, useState } from 'react'

// Kotak batas Indonesia (bujur/lintang) → viewBox SVG, proyeksi equirectangular sederhana.
const BARAT = 94.8
const TIMUR = 141.2
const UTARA = 6.2
const SELATAN = -11.2
const SKALA = 10
const LEBAR = (TIMUR - BARAT) * SKALA
const TINGGI = (UTARA - SELATAN) * SKALA
const titik = ([bujur, lintang]) => [((bujur - BARAT) * SKALA).toFixed(1), ((UTARA - lintang) * SKALA).toFixed(1)]

const KOTA = [
  [98.67, 3.59],
  [100.35, -0.95],
  [104.75, -2.98],
  [106.82, -6.2],
  [107.61, -6.91],
  [110.42, -6.99],
  [112.75, -7.25],
  [115.21, -8.65],
  [109.33, 0.03],
  [114.59, -3.32],
  [117.15, 0.5],
  [119.42, -5.15],
  [124.84, 1.49],
  [128.18, -3.7],
  [123.6, -10.17],
  [140.72, -2.53],
  [134.06, -0.86],
]

function keJalur(geo) {
  let d = ''
  for (const f of geo.features) {
    const g = f.geometry
    const poligon = g.type === 'Polygon' ? [g.coordinates] : g.coordinates
    for (const p of poligon)
      for (const cincin of p) {
        cincin.forEach((c, i) => {
          const [x, y] = titik(c)
          d += `${i ? 'L' : 'M'}${x} ${y}`
        })
        d += 'Z'
      }
  }
  return d
}

export default function PetaIndonesia({ className = '' }) {
  const [jalur, setJalur] = useState('')

  useEffect(() => {
    let batal = false
    fetch('/geo/provinsi.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((geo) => !batal && geo && setJalur(keJalur(geo)))
      .catch(() => {})
    return () => {
      batal = true
    }
  }, [])

  return (
    <svg
      viewBox={`0 0 ${LEBAR} ${TINGGI}`}
      className={className}
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <pattern id="titik-peta" width="4" height="4" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="0.9" fill="#c7e9d5" />
        </pattern>
        <linearGradient id="isi-peta" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3fb06e" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ffd026" stopOpacity="0.25" />
        </linearGradient>
      </defs>
      {jalur && (
        <g className="animate-muncul">
          <path d={jalur} fill="url(#isi-peta)" />
          <path d={jalur} fill="url(#titik-peta)" opacity="0.55" />
          <path d={jalur} fill="none" stroke="#c7e9d5" strokeOpacity="0.9" strokeWidth="0.7" strokeLinejoin="round" />
          {KOTA.map((k, i) => {
            const [x, y] = titik(k)
            const tunda = `${(i * 0.37) % 2.4}s`
            return (
              <g key={i} transform={`translate(${x} ${y})`}>
                <circle r="3" fill="none" stroke="#ffd026" strokeWidth="1">
                  <animate attributeName="r" values="3;16" dur="2.4s" begin={tunda} repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.9;0" dur="2.4s" begin={tunda} repeatCount="indefinite" />
                </circle>
                <circle r="3.2" fill={i % 4 === 3 ? '#ffffff' : '#ffd026'} stroke="#0a3d24" strokeWidth="1" />
              </g>
            )
          })}
        </g>
      )}
    </svg>
  )
}
