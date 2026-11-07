const WARNA = {
  Tinggi: { teks: 'text-tinggi', latar: 'bg-orange-50', isi: 'bg-tinggi', garis: 'border-orange-200' },
  Sedang: { teks: 'text-sedang', latar: 'bg-amber-50', isi: 'bg-sedang', garis: 'border-amber-200' },
  Rendah: { teks: 'text-rendah', latar: 'bg-green-50', isi: 'bg-rendah', garis: 'border-green-200' },
}

export const warnaLevel = (level) => WARNA[level]

export function LencanaPrioritas({ level, skor }) {
  const w = WARNA[level]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${w.latar} ${w.teks} ${w.garis}`}
    >
      <span className={`h-2 w-2 rounded-full ${w.isi}`} />
      Prioritas {level} · {skor}
    </span>
  )
}

// Rincian faktor: lebar batang = nilai faktor (0–100), angka kanan = kontribusi ke skor.
export function RincianFaktor({ faktor }) {
  return (
    <ul className="space-y-4">
      {faktor.map((f) => (
        <li key={f.kunci}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="font-semibold text-ink">{f.label}</span>
            <span className="tabular-nums text-ink-soft">+{f.kontribusi.toFixed(1)} poin</span>
          </div>
          <div className="mt-1.5 h-2 rounded-full bg-paper" role="presentation">
            <div className="h-2 rounded-full bg-brand-500" style={{ width: `${Math.max(2, f.nilai)}%` }} />
          </div>
          <div className="mt-1 flex justify-between gap-3 text-xs text-ink-faint">
            <span>{f.tampil}</span>
            <span>
              {f.sumber} · bobot {Math.round(f.bobot * 100)}%
            </span>
          </div>
        </li>
      ))}
    </ul>
  )
}
