// PEMILIK: Ezra (AI)
// Chat tanya-jawab mengambang di pojok kanan bawah (pop-up). Warga: bantuan CivicPulse (tugas "metodologi").
// Petugas: asisten tanya-data (tugas "tanya-data", hemat token). Jawaban HANYA dari fakta yang disusun server.
import { useEffect, useRef, useState } from 'react'
import { LoaderCircle, MessageCircleQuestion, Send, Sparkles, X } from 'lucide-react'
import { LLM_TERSEDIA, PESAN_ALASAN_AI, tulisAi } from '../ai/index.js'

export default function ChatMengambang({
  tugas,
  body = {},
  judul,
  sapaan,
  contoh = [],
  placeholder = 'Tulis pertanyaan…',
  maks = 160,
  className = 'bottom-5',
}) {
  const [buka, setBuka] = useState(false)
  const [tanya, setTanya] = useState('')
  const pendek = tanya.trim().length > 0 && tanya.trim().length < 5
  const [pesan, setPesan] = useState([])
  const [proses, setProses] = useState(false)
  const masukan = useRef(null)
  const daftar = useRef(null)

  useEffect(() => {
    if (!buka) return
    masukan.current?.focus()
    const tutup = (e) => e.key === 'Escape' && setBuka(false)
    window.addEventListener('keydown', tutup)
    return () => window.removeEventListener('keydown', tutup)
  }, [buka])

  useEffect(() => {
    daftar.current?.scrollTo({ top: daftar.current.scrollHeight, behavior: 'smooth' })
  }, [pesan, proses])

  if (!LLM_TERSEDIA) return null

  const kirim = async (q = tanya) => {
    const p = q.trim()
    if (p.length < 5 || proses) return
    setTanya('')
    setPesan((m) => [...m, { dari: 'saya', teks: p }])
    setProses(true)
    const h = await tulisAi(tugas, { ...body, pertanyaan: p })
    const ok = h.sumber === 'ai' && h.teks
    setPesan((m) =>
      [
        ...m,
        {
          dari: 'ai',
          teks: ok ? h.teks : (h.pesan ?? PESAN_ALASAN_AI[h.alasan] ?? 'AI tidak tersedia.'),
          gagal: !ok,
          cache: h.cache,
        },
      ].slice(-12),
    )
    setProses(false)
  }

  return (
    <div className={`fixed right-4 z-[1150] flex flex-col items-end gap-3 print:hidden sm:right-6 ${className}`}>
      <section
        id={`chat-${tugas}`}
        role="dialog"
        aria-label={judul}
        aria-hidden={!buka}
        className={`flex max-h-[min(560px,calc(100vh-8rem))] w-[min(380px,calc(100vw-2rem))] origin-bottom-right flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-[0_24px_60px_-20px_rgba(10,61,36,0.55)] transition-all duration-200 ease-out motion-reduce:transition-none ${
          buka
            ? 'translate-y-0 scale-100 opacity-100'
            : 'pointer-events-none invisible translate-y-3 scale-95 opacity-0'
        }`}
      >
        <header className="flex items-center justify-between gap-3 bg-brand-700 px-4 py-3 text-white">
          <p className="flex items-center gap-2 font-bold">
            <Sparkles size={16} className="text-aksen-300" aria-hidden="true" /> {judul}
          </p>
          <button
            type="button"
            onClick={() => setBuka(false)}
            aria-label="Tutup chat"
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/15"
          >
            <X size={18} />
          </button>
        </header>

        <div ref={daftar} className="flex-1 space-y-3 overflow-y-auto bg-paper p-4" aria-live="polite">
          <p className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white p-3 text-sm leading-relaxed text-ink shadow-sm">
            {sapaan}
          </p>
          {pesan.length === 0 && contoh.length > 0 && (
            <div className="flex flex-col items-start gap-2">
              {contoh.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => kirim(c)}
                  className="rounded-full border border-brand-100 bg-white px-3 py-1.5 text-left text-xs font-semibold text-brand-700 hover:border-brand-500"
                >
                  {c}
                </button>
              ))}
            </div>
          )}
          {pesan.map((m, i) =>
            m.dari === 'saya' ? (
              <p
                key={i}
                className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-brand-600 p-3 text-sm leading-relaxed text-white"
              >
                {m.teks}
              </p>
            ) : (
              <div key={i} className="max-w-[85%]">
                <p
                  className={`rounded-2xl rounded-tl-sm p-3 text-sm leading-relaxed shadow-sm ${
                    m.gagal ? 'bg-white text-ink-soft' : 'bg-white text-ink'
                  }`}
                >
                  {m.teks}
                </p>
                {!m.gagal && (
                  <p className="mt-1 pl-1 text-[11px] text-ink-faint">
                    Ditulis AI dari data sistem{m.cache ? ' · dari cache' : ''}
                  </p>
                )}
              </div>
            ),
          )}
          {proses && (
            <p className="inline-flex items-center gap-2 rounded-2xl rounded-tl-sm bg-white p-3 text-sm text-ink-soft shadow-sm">
              <LoaderCircle size={14} className="motion-safe:animate-spin" aria-hidden="true" /> Menyusun jawaban…
            </p>
          )}
        </div>

        {pendek && (
          <p id={`petunjuk-${tugas}`} className="border-t border-line bg-white px-3 pt-2 text-[11px] text-ink-faint">
            Tulis minimal 5 huruf supaya pertanyaannya jelas.
          </p>
        )}
        <form
          className={`flex gap-2 bg-white p-3 ${pendek ? '' : 'border-t border-line'}`}
          onSubmit={(e) => {
            e.preventDefault()
            kirim()
          }}
        >
          <label htmlFor={`masukan-${tugas}`} className="sr-only">
            Pertanyaan
          </label>
          <input
            ref={masukan}
            id={`masukan-${tugas}`}
            value={tanya}
            onChange={(e) => setTanya(e.target.value.slice(0, maks))}
            placeholder={placeholder}
            tabIndex={buka ? 0 : -1}
            aria-describedby={pendek ? `petunjuk-${tugas}` : undefined}
            className="min-h-11 min-w-0 flex-1 rounded-xl border border-line bg-paper px-3 text-base text-ink outline-none transition-colors focus:border-brand-500 focus:bg-white focus-visible:ring-2 focus-visible:ring-brand-500/20 focus-visible:ring-offset-0 sm:text-sm"
          />
          <button
            type="submit"
            disabled={proses || pendek || !tanya.trim()}
            tabIndex={buka ? 0 : -1}
            aria-label="Kirim pertanyaan"
            className="btn-primary min-h-11 min-w-11 px-3 disabled:opacity-40"
          >
            <Send size={16} aria-hidden="true" />
          </button>
        </form>
      </section>

      <button
        type="button"
        onClick={() => setBuka((b) => !b)}
        aria-expanded={buka}
        aria-controls={`chat-${tugas}`}
        aria-label={buka ? 'Tutup chat' : judul}
        className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-[0_12px_30px_-8px_rgba(10,61,36,0.6)] transition-transform hover:scale-105 active:scale-95"
      >
        {!buka && pesan.length === 0 && (
          <span className="absolute inset-0 rounded-full bg-brand-500 motion-safe:animate-ping [animation-duration:2.5s] [animation-iteration-count:3]" />
        )}
        <span className={`relative transition-transform duration-200 ${buka ? 'rotate-90' : ''}`}>
          {buka ? <X size={24} /> : <MessageCircleQuestion size={26} />}
        </span>
      </button>
    </div>
  )
}
