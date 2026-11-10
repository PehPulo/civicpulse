// PEMILIK: Ezra (AI)
// Kartu teks LLM yang dipakai bersama halaman warga & panel instansi. Teks AI selalu diberi lencana, faktanya
// bisa dibuka (transparan), dan bila AI mati/gagal kartu tetap berguna: fakta yang dihitung sistem ditampilkan.
import { useCallback, useEffect, useRef, useState } from 'react'
import { LoaderCircle, Sparkles } from 'lucide-react'
import { LLM_TERSEDIA, PESAN_ALASAN_AI, tulisAi } from '../ai/index.js'

export function LencanaLlm({ model, cache }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-2 text-xs text-ink-faint">
      <span
        title="Ditulis LLM dari fakta yang dihitung sistem; angka sudah dicek pengaman"
        className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-bold text-violet-800"
      >
        <Sparkles size={12} aria-hidden="true" /> Ditulis AI
      </span>
      {model && <span>{model}</span>}
      {cache != null && <span>{cache ? 'dari cache · 0 token' : 'baru disusun'}</span>}
    </span>
  )
}

function DaftarFakta({ fakta, terbuka }) {
  if (!fakta) return null
  return (
    <details className="mt-3 rounded-xl bg-paper p-3" open={terbuka}>
      <summary className="cursor-pointer text-xs font-semibold text-ink-soft">
        Fakta yang dipakai AI (dihitung sistem)
      </summary>
      <ul className="mt-2 space-y-1 text-sm text-ink">
        {fakta
          .split('\n')
          .map((b) => b.replace(/^-\s*/, ''))
          .filter(Boolean)
          .map((b) => (
            <li key={b} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden="true" /> {b}
            </li>
          ))}
      </ul>
    </details>
  )
}

/**
 * otomatis: langsung diminta saat tampil (pakai hanya untuk tugas yang cache-nya bersama, mis. beranda/tips).
 * polos: tanpa bingkai kartu (untuk disisipkan di Panel instansi).
 */
export default function KartuAi({
  tugas,
  body = {},
  judul,
  sub,
  otomatis = false,
  labelTombol = 'Jelaskan dengan AI',
  kosong,
  className = '',
  polos = false,
  tampilFakta = true,
}) {
  const [hasil, setHasil] = useState(null)
  const [proses, setProses] = useState(false)
  const [catatan, setCatatan] = useState('')
  const kunci = JSON.stringify(body)
  const kunciTerakhir = useRef(null)

  // segar = true ⇒ "Susun ulang": minta teks baru (lewati cache server), bukan jawaban yang sama dari cache.
  const minta = useCallback(
    async (segar = false) => {
      setProses(true)
      setCatatan('')
      const sebelum = segar ? hasilRef.current?.teks : null
      const h = await tulisAi(tugas, JSON.parse(kunci), { segar })
      setHasil(h)
      setProses(false)
      if (segar)
        setCatatan(
          h?.sumber !== 'ai'
            ? ''
            : h.teks === sebelum
              ? 'AI menyusun kalimat yang sama dari fakta yang sama.'
              : 'Disusun ulang barusan.',
        )
    },
    [tugas, kunci],
  )
  const hasilRef = useRef(null)
  hasilRef.current = hasil

  useEffect(() => {
    if (kunciTerakhir.current !== null && kunciTerakhir.current !== kunci) setHasil(null)
    kunciTerakhir.current = kunci
    if (otomatis && LLM_TERSEDIA) minta(false)
  }, [otomatis, minta, kunci])

  if (!LLM_TERSEDIA) return null
  const teks = hasil?.sumber === 'ai' ? hasil.teks : null
  const Judul = polos ? 'h3' : 'h2'

  return (
    <section className={`${polos ? '' : 'card p-5'} ${className}`} aria-busy={proses} aria-label={judul}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Judul className="flex items-center gap-2 font-bold text-ink">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
              <Sparkles size={15} aria-hidden="true" />
            </span>
            {judul}
          </Judul>
          {sub && <p className="mt-1 text-sm text-ink-soft">{sub}</p>}
        </div>
        {!(otomatis && !hasil) && (
          <button
            type="button"
            onClick={() => minta(Boolean(teks))}
            disabled={proses}
            className="btn-ghost min-h-9 py-1.5 text-xs"
          >
            {proses ? (
              <LoaderCircle size={14} className="motion-safe:animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles size={14} aria-hidden="true" />
            )}
            {proses ? 'Menyusun…' : teks ? 'Susun ulang' : labelTombol}
          </button>
        )}
      </div>

      <div aria-live="polite">
        {proses && !teks && (
          <div className="mt-4 space-y-2" aria-hidden="true">
            <div className="h-3 w-full animate-pulse rounded bg-line" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-line" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-line" />
          </div>
        )}
        {teks && (
          <>
            <p
              className={`mt-3 whitespace-pre-line text-[15px] leading-relaxed text-ink transition-opacity ${
                proses ? 'animate-pulse opacity-40' : ''
              }`}
            >
              {teks}
            </p>
            <p className="mt-2 flex flex-wrap items-center gap-2">
              <LencanaLlm model={hasil.model} cache={hasil.cache} />
              {catatan && <span className="text-xs font-semibold text-brand-700">{catatan}</span>}
            </p>
          </>
        )}
        {!proses && !teks && hasil?.alasan && (
          <p className="mt-3 text-sm text-ink-soft">
            {hasil.pesan ?? PESAN_ALASAN_AI[hasil.alasan] ?? 'AI tidak tersedia.'}
            {hasil.fakta && tampilFakta ? ' Fakta berikut dihitung langsung dari data.' : ''}
          </p>
        )}
        {!proses && !hasil && !otomatis && (
          <p className="mt-3 text-sm text-ink-soft">{kosong ?? `Tekan “${labelTombol}” untuk teks dari AI.`}</p>
        )}
      </div>
      {tampilFakta && <DaftarFakta fakta={hasil?.fakta} terbuka={!teks} />}
    </section>
  )
}
