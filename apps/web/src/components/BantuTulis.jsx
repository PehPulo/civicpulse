// PEMILIK: Ezra (AI)
// "Rapikan dengan AI" di form Lapor: LLM merapikan ejaan & susunan judul/deskripsi warga TANPA menambah fakta.
// Hasilnya hanya saran; warga memilih "Pakai" atau mengabaikannya, lalu tetap bisa menyunting.
import { useState } from 'react'
import { Check, LoaderCircle, Wand2, X } from 'lucide-react'
import { LLM_TERSEDIA, PESAN_ALASAN_AI, tulisAi } from '../ai/index.js'
import { LencanaLlm } from './KartuAi.jsx'

export default function BantuTulis({ judul, deskripsi, kategoriId, onPakai }) {
  const [hasil, setHasil] = useState(null)
  const [proses, setProses] = useState(false)
  if (!LLM_TERSEDIA) return null

  const cukup = deskripsi.trim().length >= 10
  const minta = async () => {
    setProses(true)
    setHasil(await tulisAi('bantu-tulis', { judul, deskripsi, kategoriId }))
    setProses(false)
  }
  const saran = hasil?.sumber === 'ai' ? hasil.saran : null

  return (
    <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-ink-soft">Tulisan masih berantakan? AI bisa merapikan ejaan dan susunannya.</p>
        <button
          type="button"
          onClick={minta}
          disabled={!cukup || proses}
          className="btn-ghost min-h-10 bg-white py-1.5 text-sm"
          title={cukup ? undefined : 'Tulis deskripsi minimal 10 huruf dulu'}
        >
          {proses ? (
            <LoaderCircle size={15} className="motion-safe:animate-spin" aria-hidden="true" />
          ) : (
            <Wand2 size={15} aria-hidden="true" />
          )}
          {proses ? 'Merapikan…' : 'Rapikan dengan AI'}
        </button>
      </div>
      <div aria-live="polite">
        {saran && (
          <div className="mt-3 rounded-lg bg-white p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Usulan AI</p>
            <p className="mt-1 font-semibold text-ink">{saran.judul}</p>
            <p className="mt-1 text-sm leading-relaxed text-ink">{saran.deskripsi}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="btn-primary min-h-10 py-1.5 text-sm"
                onClick={() => {
                  onPakai(saran.judul, saran.deskripsi)
                  setHasil(null)
                }}
              >
                <Check size={15} aria-hidden="true" /> Pakai
              </button>
              <button type="button" className="btn-ghost min-h-10 py-1.5 text-sm" onClick={() => setHasil(null)}>
                <X size={15} aria-hidden="true" /> Abaikan
              </button>
              <LencanaLlm model={hasil.model} />
            </div>
            <p className="mt-2 text-xs text-ink-faint">
              Periksa lagi: AI tidak boleh menambah fakta yang tidak kamu tulis.
            </p>
          </div>
        )}
        {hasil && !saran && (
          <p className="mt-2 text-sm text-ink-soft">
            {hasil.pesan ?? PESAN_ALASAN_AI[hasil.alasan] ?? 'AI tidak tersedia.'}
          </p>
        )}
      </div>
    </div>
  )
}
