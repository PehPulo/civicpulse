import { Sparkles } from 'lucide-react'
import { useProgresAI } from '../hooks/useProgresAI.js'

const persen = (x) => `${Math.round(x * 100)}%`

/** Kotak saran AI yang konsisten di seluruh aplikasi. Selalu bisa diabaikan pengguna. */
export function KotakAI({ children, nada = 'netral' }) {
  const warna =
    nada === 'peringatan'
      ? 'border-amber-200 bg-amber-50 text-amber-900'
      : 'border-brand-100 bg-brand-50 text-brand-900'
  return (
    <div className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${warna}`} role="status">
      <Sparkles size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div className="flex-1">{children}</div>
    </div>
  )
}

/**
 * Indikator saat model pengenal foto sedang diunduh/menganalisis.
 * @param {{ teks: string, bolehLanjut?: string }} props
 *        bolehLanjut: kalimat yang menegaskan pengguna tidak perlu menunggu (mis. "Kamu boleh lanjut mengisi form.").
 */
export function MemprosesAI({ teks, bolehLanjut }) {
  const p = useProgresAI().vision
  if (!p || p.selesai) return <KotakAI>{teks}</KotakAI>
  return (
    <KotakAI>
      <p>
        Mengunduh model pengenal foto ke perangkatmu
        {p.mbTotal > 0 && (
          <span className="tabular-nums">
            {' '}
            · {p.mbTerunduh} / {p.mbTotal} MB
          </span>
        )}
      </p>
      <div
        className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white"
        role="progressbar"
        aria-valuenow={p.persen}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Unduhan model pengenal foto"
      >
        <div className="h-full rounded-full bg-brand-600 transition-[width]" style={{ width: `${p.persen}%` }} />
      </div>
      <p className="mt-1 text-xs opacity-80">
        Cukup sekali, berikutnya langsung siap. Gratis, fotomu tidak dikirim ke layanan AI.
        {bolehLanjut && ` ${bolehLanjut}`}
      </p>
    </KotakAI>
  )
}

export { persen as persenYakin }
