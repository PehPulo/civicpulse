// PEMILIK: Ezra (sisi warga)
// Bagian "Pesona Nusantara" di beranda: video pantai Bali dari udara + galeri ikon Nusantara.
// Semua aset dari Wikimedia Commons berlisensi CC BY / CC BY-SA ⇒ nama pembuat & lisensi WAJIB tampil (lihat KREDIT).
// Video tidak diputar otomatis bila pengguna memilih kurangi gerak atau hemat data; poster tetap tampil.
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, MapPin, Pause, Play } from 'lucide-react'
import { Link } from 'react-router-dom'

const GALERI = [
  {
    id: 'gedung-sate',
    nama: 'Gedung Sate',
    lokasi: 'Bandung, Jawa Barat',
    kredit: 'Gunawan Kartapranata',
    lisensi: 'CC BY-SA 3.0',
    sumber: 'https://commons.wikimedia.org/wiki/File:Gedung_Sate_Bandung.jpg',
  },
  {
    id: 'borobudur',
    nama: 'Candi Borobudur',
    lokasi: 'Magelang, Jawa Tengah',
    kredit: 'Justine Hong',
    lisensi: 'CC BY 2.0',
    sumber: 'https://commons.wikimedia.org/wiki/File:Borobudur_Sunrise_2012-01-05.jpg',
  },
  {
    id: 'raja-ampat',
    nama: 'Piaynemo, Raja Ampat',
    lokasi: 'Papua Barat Daya',
    kredit: 'Irma Ade',
    lisensi: 'CC BY-SA 4.0',
    sumber: 'https://commons.wikimedia.org/wiki/File:Piaynemo_Island,_Raja_Ampat,_West_Papua,_Indonesia.jpg',
  },
  {
    id: 'bromo',
    nama: 'Gunung Bromo',
    lokasi: 'Jawa Timur',
    kredit: 'Thomas Fuhrmann',
    lisensi: 'CC BY-SA 4.0',
    sumber: 'https://commons.wikimedia.org/wiki/File:Gunung_Bromo_sunrise_-_Indonesia.jpg',
  },
  {
    id: 'toraja',
    nama: 'Tongkonan Kete Kesu',
    lokasi: 'Tana Toraja, Sulawesi Selatan',
    kredit: 'Arian Zwegers',
    lisensi: 'CC BY 2.0',
    sumber: 'https://commons.wikimedia.org/wiki/File:Tana_Toraja,_Kete_Kesu,_tongkonan_(6823189476).jpg',
  },
  {
    id: 'toba',
    nama: 'Danau Toba',
    lokasi: 'Sumatera Utara',
    kredit: 'Herman Kurniawan',
    lisensi: 'CC BY-SA 4.0',
    sumber: 'https://commons.wikimedia.org/wiki/File:Danau_Toba_View.jpg',
  },
  {
    id: 'tegalalang',
    nama: 'Sawah Tegalalang',
    lokasi: 'Gianyar, Bali',
    kredit: 'Anggabuana',
    lisensi: 'CC BY 4.0',
    sumber: 'https://commons.wikimedia.org/wiki/File:Tegalalang_Rice_Terrace_-_Subak_Ceking_on_Bali_15.jpg',
  },
]

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

function Kredit({ kredit, lisensi, sumber, className = '' }) {
  return (
    <a
      href={sumber}
      target="_blank"
      rel="noreferrer"
      className={`text-[11px] underline-offset-2 hover:underline ${className}`}
    >
      Foto: {kredit} · {lisensi}
    </a>
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
    <section className="pb-20 pt-4" aria-labelledby="judul-pesona">
      <div className="container-page">
        <div className="relative isolate overflow-hidden rounded-3xl bg-brand-900 text-white">
          <video
            ref={video}
            className="absolute inset-0 -z-10 h-full w-full object-cover"
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
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-brand-900/90 via-brand-900/60 to-brand-900/10" />
          <div className="flex min-h-[360px] flex-col justify-end p-6 sm:min-h-[420px] sm:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-aksen-300">Pesona Nusantara</p>
            <h2 id="judul-pesona" className="mt-3 max-w-xl text-3xl font-extrabold leading-tight sm:text-4xl">
              Indonesia indah. Menjaganya dimulai dari jalan di depan rumah.
            </h2>
            <p className="mt-3 max-w-lg text-white/85">
              Saluran yang lancar, jalan yang aman, lereng yang terpantau. Setiap laporan warga ikut merawat kampung
              halaman, dari Sabang sampai Merauke.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link to="/lapor" className="btn min-h-11 bg-aksen-400 px-5 text-brand-900 hover:bg-aksen-300">
                Rawat sekitarmu <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <button
                type="button"
                onClick={() => setPutar((p) => !p)}
                className="btn min-h-11 border border-white/30 bg-white/10 px-4 text-white backdrop-blur-sm hover:bg-white/20"
                aria-label={putar ? 'Jeda video latar' : 'Putar video latar'}
              >
                {putar ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
                {putar ? 'Jeda' : 'Putar'}
              </button>
            </div>
            <a
              href={VIDEO_KREDIT.sumber}
              target="_blank"
              rel="noreferrer"
              className="mt-5 self-start text-[11px] text-white/60 underline-offset-2 hover:underline"
            >
              Video: {VIDEO_KREDIT.judul} · {VIDEO_KREDIT.kredit} · {VIDEO_KREDIT.lisensi}
            </a>
          </div>
        </div>

        <ul className="-mx-4 mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
          {GALERI.map((g, i) => (
            <li
              key={g.id}
              className={`w-[78%] shrink-0 snap-start sm:w-auto ${i === 0 ? 'lg:col-span-2 lg:row-span-2' : ''}`}
            >
              <figure className="group relative h-full overflow-hidden rounded-2xl bg-brand-900">
                <img
                  src={`/pesona/${g.id}.webp`}
                  alt={`${g.nama}, ${g.lokasi}`}
                  loading="lazy"
                  decoding="async"
                  width="1200"
                  height="800"
                  className={`w-full object-cover transition-transform duration-700 group-hover:scale-105 ${
                    i === 0 ? 'aspect-[4/3] lg:h-full lg:aspect-auto' : 'aspect-[4/3]'
                  }`}
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-10 text-white">
                  <p className="font-bold leading-tight">{g.nama}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-white/80">
                    <MapPin size={12} aria-hidden="true" /> {g.lokasi}
                  </p>
                  <Kredit {...g} className="mt-1 block text-white/60" />
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
