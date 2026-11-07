// PEMILIK: Ezra · Grafik batang berkelompok: laporan masuk vs terverifikasi per minggu (8 minggu).
// Aturan dataviz: satu sumbu, warna kategorikal tetap (slot 1 biru, slot 3 aqua · lolos validator CVD),
// legenda selalu tampil, tooltip saat hover/fokus, dan tampilan tabel (aqua < 3:1 ⇒ wajib ada tabel/label).
import { useState } from 'react'

const SERI = [
  { kunci: 'masuk', label: 'Laporan masuk', warna: '#2a78d6' },
  { kunci: 'terverifikasi', label: 'Terverifikasi warga', warna: '#1baf7a' },
]

const L = 960
const T = 280
const M = { atas: 12, kanan: 8, bawah: 28, kiri: 28 }
const lebarPlot = L - M.kiri - M.kanan
const tinggiPlot = T - M.atas - M.bawah

const labelMinggu = (iso) => new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })

// Batas atas sumbu yang "bulat" agar garis bantu mudah dibaca.
function batasAtas(maks) {
  if (maks <= 4) return 4
  const langkah = maks <= 10 ? 2 : maks <= 25 ? 5 : 10
  return Math.ceil(maks / langkah) * langkah
}

/** @param {{ data: {mingguBerakhir: string, masuk: number, terverifikasi: number}[] }} props */
export default function GrafikMingguan({ data }) {
  const [aktif, setAktif] = useState(null)
  const [tabel, setTabel] = useState(false)
  const yMaks = batasAtas(Math.max(1, ...data.flatMap((d) => SERI.map((s) => d[s.kunci]))))
  const garis = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(yMaks * f))
  const lebarKelompok = lebarPlot / data.length
  const lebarBatang = Math.min(18, (lebarKelompok - 10) / 2)
  const y = (v) => M.atas + tinggiPlot - (v / yMaks) * tinggiPlot

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ul className="flex flex-wrap gap-4 text-sm text-ink-soft" aria-label="Legenda">
          {SERI.map((s) => (
            <li key={s.kunci} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.warna }} aria-hidden="true" />
              {s.label}
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => setTabel((t) => !t)} className="text-sm font-semibold text-brand-700">
          {tabel ? 'Tampilkan grafik' : 'Tampilkan tabel'}
        </button>
      </div>

      {tabel ? (
        <table className="mt-4 w-full text-sm">
          <caption className="sr-only">Laporan masuk dan terverifikasi per minggu</caption>
          <thead>
            <tr className="border-b border-line text-left text-ink-soft">
              <th className="py-2 font-semibold">Minggu berakhir</th>
              {SERI.map((s) => (
                <th key={s.kunci} className="py-2 text-right font-semibold">
                  {s.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {data.map((d) => (
              <tr key={d.mingguBerakhir} className="border-b border-line/60">
                <td className="py-2">{labelMinggu(d.mingguBerakhir)}</td>
                {SERI.map((s) => (
                  <td key={s.kunci} className="py-2 text-right">
                    {d[s.kunci]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="relative mt-4">
          <svg
            viewBox={`0 0 ${L} ${T}`}
            className="w-full"
            role="img"
            aria-label="Grafik laporan masuk dan terverifikasi per minggu, 8 minggu terakhir"
          >
            {garis.map((g) => (
              <g key={g}>
                <line x1={M.kiri} x2={L - M.kanan} y1={y(g)} y2={y(g)} stroke="#e6e3dc" strokeWidth={1} />
                <text x={M.kiri - 6} y={y(g)} textAnchor="end" dominantBaseline="middle" fontSize={11} fill="#8494a5">
                  {g}
                </text>
              </g>
            ))}
            {data.map((d, i) => {
              const x0 = M.kiri + i * lebarKelompok
              const tengah = x0 + lebarKelompok / 2
              return (
                <g key={d.mingguBerakhir}>
                  {aktif === i && (
                    <rect
                      x={x0 + 2}
                      y={M.atas}
                      width={lebarKelompok - 4}
                      height={tinggiPlot}
                      fill="#0f1f2e"
                      opacity={0.04}
                      rx={6}
                    />
                  )}
                  {SERI.map((s, j) => {
                    const v = d[s.kunci]
                    const tinggi = (v / yMaks) * tinggiPlot
                    const x = tengah - lebarBatang - 1 + j * (lebarBatang + 2)
                    // Ujung atas membulat 4px, dasar rata di garis nol.
                    const r = Math.min(4, tinggi, lebarBatang / 2)
                    const yAtas = y(v)
                    const dasar = M.atas + tinggiPlot
                    return v > 0 ? (
                      <path
                        key={s.kunci}
                        d={`M${x},${dasar} V${yAtas + r} Q${x},${yAtas} ${x + r},${yAtas} H${x + lebarBatang - r} Q${x + lebarBatang},${yAtas} ${x + lebarBatang},${yAtas + r} V${dasar} Z`}
                        fill={s.warna}
                      />
                    ) : null
                  })}
                  <text x={tengah} y={T - 8} textAnchor="middle" fontSize={11} fill="#8494a5">
                    {labelMinggu(d.mingguBerakhir)}
                  </text>
                  {/* Area sentuh lebih besar dari batang */}
                  <rect
                    x={x0}
                    y={M.atas}
                    width={lebarKelompok}
                    height={tinggiPlot + M.bawah}
                    fill="transparent"
                    tabIndex={0}
                    aria-label={`Minggu berakhir ${labelMinggu(d.mingguBerakhir)}: ${d.masuk} masuk, ${d.terverifikasi} terverifikasi`}
                    onMouseEnter={() => setAktif(i)}
                    onMouseLeave={() => setAktif(null)}
                    onFocus={() => setAktif(i)}
                    onBlur={() => setAktif(null)}
                    className="cursor-default outline-none"
                  />
                </g>
              )
            })}
          </svg>
          {aktif != null && (
            <div
              className="pointer-events-none absolute top-0 z-10 rounded-lg border border-line bg-white px-3 py-2 text-xs shadow-md"
              style={{
                left: `${((M.kiri + (aktif + 0.5) * lebarKelompok) / L) * 100}%`,
                transform: `translateX(${aktif > data.length / 2 ? '-105%' : '5%'})`,
              }}
              role="status"
            >
              <p className="font-semibold text-ink">Minggu s.d. {labelMinggu(data[aktif].mingguBerakhir)}</p>
              {SERI.map((s) => (
                <p key={s.kunci} className="mt-1 flex items-center gap-2 text-ink-soft">
                  <span className="h-2 w-2 rounded-sm" style={{ background: s.warna }} aria-hidden="true" />
                  {s.label}: <span className="font-semibold tabular-nums text-ink">{data[aktif][s.kunci]}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
