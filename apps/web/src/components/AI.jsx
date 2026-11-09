import { Sparkles } from 'lucide-react'

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
 * Indikator saat server AI sedang menganalisis foto.
 * @param {{ teks: string, bolehLanjut?: string }} props
 *        bolehLanjut: kalimat yang menegaskan pengguna tidak perlu menunggu (mis. "Kamu boleh lanjut mengisi form.").
 */
export function MemprosesAI({ teks, bolehLanjut }) {
  return (
    <KotakAI>
      {teks}
      {bolehLanjut && <span className="mt-1 block text-xs opacity-80">{bolehLanjut}</span>}
    </KotakAI>
  )
}

export { persen as persenYakin }
