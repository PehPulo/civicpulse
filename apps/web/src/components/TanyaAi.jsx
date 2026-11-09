// PEMILIK: Ezra (AI)
// Kotak tanya-jawab singkat berbasis LLM. Jawaban HANYA dari fakta yang disusun server; angka dicek pengaman.
// Hemat token: pertanyaan dibatasi panjangnya, jawaban 1–3 kalimat, pertanyaan sama ⇒ cache bersama.
import { useId, useState } from 'react'
import { LoaderCircle, MessageCircleQuestion, Send } from 'lucide-react'
import { LLM_TERSEDIA, PESAN_ALASAN_AI, tulisAi } from '../ai/index.js'
import { LencanaLlm } from './KartuAi.jsx'

export default function TanyaAi({
  tugas,
  body = {},
  judul,
  sub,
  contoh = [],
  placeholder,
  maks = 160,
  className = '',
  polos = false,
}) {
  const id = useId()
  const [tanya, setTanya] = useState('')
  const [riwayat, setRiwayat] = useState([])
  const [proses, setProses] = useState(false)
  if (!LLM_TERSEDIA) return null

  const kirim = async (q = tanya) => {
    const p = q.trim()
    if (p.length < 5 || proses) return
    setProses(true)
    setTanya('')
    const h = await tulisAi(tugas, { ...body, pertanyaan: p })
    setRiwayat((r) => [{ p, h }, ...r].slice(0, 4))
    setProses(false)
  }
  const Judul = polos ? 'h3' : 'h2'

  return (
    <section className={`${polos ? '' : 'card p-5'} ${className}`} aria-label={judul}>
      <Judul className="flex items-center gap-2 font-bold text-ink">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
          <MessageCircleQuestion size={15} aria-hidden="true" />
        </span>
        {judul}
      </Judul>
      {sub && <p className="mt-1 text-sm text-ink-soft">{sub}</p>}
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          kirim()
        }}
      >
        <label htmlFor={id} className="sr-only">
          {judul}
        </label>
        <input
          id={id}
          value={tanya}
          onChange={(e) => setTanya(e.target.value.slice(0, maks))}
          placeholder={placeholder}
          className="min-h-11 min-w-0 flex-1 rounded-xl border border-line bg-white px-3 text-base text-ink outline-none focus:border-brand-500 sm:text-sm"
        />
        <button
          type="submit"
          disabled={proses || tanya.trim().length < 5}
          className="btn-primary min-h-11 shrink-0 px-4"
        >
          {proses ? (
            <LoaderCircle size={16} className="motion-safe:animate-spin" aria-hidden="true" />
          ) : (
            <Send size={16} aria-hidden="true" />
          )}
          <span className="sr-only sm:not-sr-only">Tanya</span>
        </button>
      </form>
      {contoh.length > 0 && riwayat.length === 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {contoh.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => kirim(c)}
              disabled={proses}
              className="min-h-9 rounded-full border border-line bg-white px-3 py-1.5 text-left text-xs font-semibold text-ink-soft hover:border-brand-500 hover:text-brand-700"
            >
              {c}
            </button>
          ))}
        </div>
      )}
      <ul className="mt-3 space-y-3" aria-live="polite">
        {proses && (
          <li className="rounded-xl bg-paper p-3 text-sm text-ink-soft">
            <LoaderCircle size={14} className="mr-1 inline motion-safe:animate-spin" aria-hidden="true" />
            Menyusun jawaban…
          </li>
        )}
        {riwayat.map(({ p, h }, i) => (
          <li key={`${riwayat.length - i}`} className="rounded-xl bg-paper p-3">
            <p className="text-xs font-semibold text-ink-soft">{p}</p>
            {h.sumber === 'ai' && h.teks ? (
              <>
                <p className="mt-1 text-sm leading-relaxed text-ink">{h.teks}</p>
                <p className="mt-1.5">
                  <LencanaLlm model={h.model} cache={h.cache} />
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm text-ink-soft">
                {h.pesan ?? PESAN_ALASAN_AI[h.alasan] ?? 'AI tidak tersedia.'}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
