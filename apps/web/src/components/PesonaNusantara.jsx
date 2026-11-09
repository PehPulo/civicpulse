// PEMILIK: Ezra (sisi warga)
// Bagian "Pesona Nusantara" di beranda: ajakan "Indonesia indah" + video pantai Bali dari udara dalam bingkai,
// lalu kisi "Destinasi Nusantara" (6 foto ikonik). Semua aset dari Wikimedia Commons berlisensi CC BY / CC BY-SA
// ⇒ nama pembuat & lisensi WAJIB tampil. Video tidak diputar otomatis bila pengguna memilih kurangi gerak atau
// hemat data; poster tetap tampil.
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Compass, Leaf, MapPin, Pause, Play } from 'lucide-react'
import { Link } from 'react-router-dom'
import { FOTO_NUSANTARA } from '../lib/pesona.js'

// Destinasi: nama populer + julukan; foto & kredit dari FOTO_NUSANTARA.
const DESTINASI = [
  { id: 'tanah-lot', nama: 'Bali', julukan: 'Pulau Dewata' },
  { id: 'padar', nama: 'Labuan Bajo', julukan: 'Gerbang Komodo' },
  { id: 'prambanan', nama: 'Yogyakarta', julukan: 'Kota Budaya' },
  { id: 'raja-ampat', nama: 'Raja Ampat', julukan: 'Surga di Timur' },
  { id: 'toba', nama: 'Danau Toba', julukan: 'Pesona Sumatra' },
  { id: 'toraja', nama: 'Tana Toraja', julukan: 'Warisan Sulawesi' },
].map((d) => ({ ...FOTO_NUSANTARA[d.id], namaTempat: FOTO_NUSANTARA[d.id].nama, ...d }))

const VIDEO_KREDIT = {
  judul: 'Pantai Lovina, Bali',
  kredit: 'GG DuaBelas',
  lisensi: 'CC BY 3.0',
  sumber: 'https://commons.wikimedia.org/wiki/File:Aerial_views_of_Lovina_Beach,_Bali,_Indonesia.webm',
}

function bolehPutar() {
  if (typeof window === 'undefined') return false
  return !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches && !navigator.connection?.saveData
}

/** Sudut bingkai ala jendela bidik kamera. */
function SudutBingkai({ warna = 'border-white/80' }) {
  const dasar = `pointer-events-none absolute h-6 w-6 ${warna}`
  return (
    <>
      <span className={`${dasar} left-3 top-3 rounded-tl-lg border-l-2 border-t-2`} aria-hidden="true" />
      <span className={`${dasar} right-3 top-3 rounded-tr-lg border-r-2 border-t-2`} aria-hidden="true" />
      <span className={`${dasar} bottom-3 left-3 rounded-bl-lg border-b-2 border-l-2`} aria-hidden="true" />
      <span className={`${dasar} bottom-3 right-3 rounded-br-lg border-b-2 border-r-2`} aria-hidden="true" />
    </>
  )
}

function Pil({ ikon: Ikon, children }) {
  return (
    <p className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
      <Ikon size={13} aria-hidden="true" /> {children}
    </p>
  )
}

export default function PesonaNusantara() {
  const video = useRef(null)
  const [putar, setPutar] = useState(bolehPutar)

  // Putar hanya saat terlihat (hemat baterai & data), berhenti saat digulir lewat.
  useEffect(() => {
    const v = video.current
    if (!v) return
    if (!putar) {
      v.pause()
      return
    }
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), {
      threshold: 0.25,
    })
    io.observe(v)
    return () => io.disconnect()
  }, [putar])

  return (
    <section className="relative overflow-hidden pb-20 pt-6" aria-labelledby="judul-pesona">
      {/* daun & cahaya dekoratif */}
      <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-brand-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-24 h-80 w-80 rounded-full bg-aksen-300/25 blur-3xl" />

      <div className="container-page relative">
        {/* ── Indonesia indah ── */}
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.15fr] lg:gap-12">
          <div>
            <Pil ikon={Leaf}>Indonesia Lebih Baik</Pil>
            <h2
              id="judul-pesona"
              className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-brand-900 sm:text-[2.6rem]"
            >
              Indonesia indah. Menjaganya dimulai dari jalan di depan rumah.
            </h2>
            <p className="mt-4 max-w-lg text-ink-soft sm:text-lg">
              Bersama CivicPulse, wujudkan lingkungan yang lebih aman, tertib, dan nyaman untuk semua. Saluran yang
              lancar, jalan yang aman, lereng yang terpantau, dari Sabang sampai Merauke.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-5">
              <Link
                to="/lapor"
                className="btn min-h-12 rounded-full bg-gradient-to-r from-aksen-400 to-[#f5e33a] px-6 text-brand-900 shadow-[0_14px_30px_-12px_rgba(217,169,0,0.8)] hover:brightness-105"
              >
                Lapor Masalah Sekarang <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link
                to="/metodologi"
                className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-brand-800 underline underline-offset-4 hover:text-brand-600"
              >
                Pelajari Lebih Lanjut
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-white">
                  <Play size={12} className="translate-x-px" aria-hidden="true" />
                </span>
              </Link>
            </div>
          </div>

          <figure className="relative">
            <div className="relative isolate overflow-hidden rounded-[2rem] bg-brand-900 shadow-[0_40px_80px_-40px_rgba(10,61,36,0.7)] ring-4 ring-white">
              <video
                ref={video}
                className="aspect-[16/10] w-full object-cover"
                poster="/pesona/nusantara-poster.webp"
                muted
                loop
                playsInline
                preload="none"
                aria-hidden="true"
              >
                <source src="/pesona/nusantara.webm" type="video/webm" />
                <source src="/pesona/nusantara.mp4" type="video/mp4" />
              </video>
              <SudutBingkai />
              <button
                type="button"
                onClick={() => setPutar((p) => !p)}
                className="absolute bottom-4 right-4 inline-flex min-h-10 items-center gap-1.5 rounded-full bg-black/40 px-3 text-xs font-bold text-white backdrop-blur-sm hover:bg-black/55"
                aria-label={putar ? 'Jeda video' : 'Putar video'}
              >
                {putar ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
                {putar ? 'Jeda' : 'Putar'}
              </button>
            </div>
            <figcaption className="mt-2 text-right">
              <a
                href={VIDEO_KREDIT.sumber}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-ink-faint underline-offset-2 hover:underline"
              >
                Video: {VIDEO_KREDIT.judul} · {VIDEO_KREDIT.kredit} · {VIDEO_KREDIT.lisensi}
              </a>
            </figcaption>
          </figure>
        </div>

        {/* ── Destinasi Nusantara ── */}
        <div className="mt-20">
          <Pil ikon={Compass}>Jelajahi Indonesia</Pil>
          <h3 className="mt-4 text-2xl font-extrabold tracking-tight text-brand-900 sm:text-3xl">
            Destinasi Nusantara dalam Satu Platform
          </h3>
          <p className="mt-2 max-w-2xl text-ink-soft">
            Dari Sabang sampai Merauke, temukan keindahan Indonesia sekaligus laporkan hal yang perlu diperbaiki di
            sekitarmu.
          </p>

          <ul className="-mx-4 mt-7 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
            {DESTINASI.map((d) => (
              <li key={d.id} className="w-[78%] shrink-0 snap-start sm:w-auto">
                <figure className="kartu-angkat group relative overflow-hidden rounded-3xl bg-brand-900 shadow-[0_24px_50px_-30px_rgba(10,61,36,0.8)] ring-4 ring-white">
                  <img
                    src={`/pesona/${d.id}.webp`}
                    alt={`${d.namaTempat}, ${d.lokasi}`}
                    loading="lazy"
                    decoding="async"
                    width="1200"
                    height="800"
                    className="aspect-[16/10] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                  <SudutBingkai warna="border-white/70" />
                  <figcaption className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <p className="font-display text-xl font-extrabold leading-tight">{d.nama}</p>
                    <p className="text-sm text-white/85">{d.julukan}</p>
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-white/65">
                      <MapPin size={11} aria-hidden="true" />
                      {d.namaTempat} ·{' '}
                      <a
                        href={d.sumber}
                        target="_blank"
                        rel="noreferrer"
                        className="underline-offset-2 hover:underline"
                      >
                        Foto: {d.kredit} · {d.lisensi}
                      </a>
                    </p>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
