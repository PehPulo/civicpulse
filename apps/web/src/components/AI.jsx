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

/** Indikator saat model sedang diunduh/menganalisis. */
export function MemprosesAI({ model = 'vision', teks }) {
  const progres = useProgresAI()[model]
  const unduh = progres != null && progres < 100
  return <KotakAI>{unduh ? `Menyiapkan model AI di perangkatmu (sekali saja)… ${progres}%` : teks}</KotakAI>
}

export { persen as persenYakin }
