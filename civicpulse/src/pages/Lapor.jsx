import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, useMapEvents } from 'react-leaflet'
import { ArrowLeft, ArrowRight, Camera, Check, Crosshair, MapPin, RotateCcw, Waves, Construction, Mountain, CircleHelp, Droplets } from 'lucide-react'
import { KATEGORI, kategoriById } from '../data/kategori.js'
import { PUSAT_PETA, wilayahTerdekat } from '../data/wilayah.js'
import { hitungPrioritas, buatKodeLacak } from '../lib/priority.js'
import { simpanLaporan } from '../data/laporan.js'
import { LencanaPrioritas, RincianFaktor, warnaLevel } from '../components/Prioritas.jsx'

const IKON_KATEGORI = { drainase: Droplets, banjir: Waves, jalan: Construction, longsor: Mountain, lainnya: CircleHelp }
const LANGKAH = ['Kategori', 'Foto & lokasi', 'Deskripsi']
const MAKS_DESKRIPSI = 280

function PemilihTitik({ onPilih }) {
  useMapEvents({ click: (e) => onPilih([e.latlng.lat, e.latlng.lng]) })
  return null
}

// Contoh isian untuk demo: /lapor?contoh=hasil langsung menampilkan hasil skor.
const CONTOH_ISIAN = {
  kategori: 'drainase',
  titik: [-6.9871, 107.6252],
  judul: 'Saluran air tersumbat di depan pasar',
  deskripsi: 'Saluran tertutup sampah dan lumpur, saat hujan air meluap ke jalan dan masuk ke rumah warga.',
}

export default function Lapor() {
  const [params] = useSearchParams()
  const [langkah, setLangkah] = useState(0)
  const [kategori, setKategori] = useState(null)
  const [foto, setFoto] = useState(null)
  const [titik, setTitik] = useState(null)
  const [judul, setJudul] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [pesanGps, setPesanGps] = useState('')
  const [hasil, setHasil] = useState(null)

  const wilayah = titik ? wilayahTerdekat(titik[0], titik[1]) : null

  useEffect(() => {
    if (params.get('contoh') === 'hasil') kirim(CONTOH_ISIAN)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pakaiGps = () => {
    if (!navigator.geolocation) {
      setPesanGps('Perangkat tidak mendukung GPS. Ketuk peta untuk memilih lokasi.')
      return
    }
    setPesanGps('Mencari lokasi…')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setTitik([pos.coords.latitude, pos.coords.longitude])
        setPesanGps('')
      },
      () => setPesanGps('Lokasi tidak bisa diakses. Ketuk peta untuk memilih lokasi.'),
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }

  const pilihFoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (foto) URL.revokeObjectURL(foto)
    setFoto(URL.createObjectURL(file))
  }

  function kirim(isian) {
    const w = wilayahTerdekat(isian.titik[0], isian.titik[1])
    const prioritas = hitungPrioritas(w, isian.kategori)
    const tanggal = new Date().toISOString().slice(0, 10)
    const laporan = {
      kode: buatKodeLacak(),
      kategori: isian.kategori,
      wilayahId: w.id,
      judul: isian.judul || kategoriById(isian.kategori).label,
      deskripsi: isian.deskripsi,
      dibuat: tanggal,
      status: [{ kunci: 'diterima', tanggal, catatan: 'Laporan masuk dan diperkaya data wilayah.' }],
      tanggapan: null,
      verifikasi: { ya: 0, tidak: 0, target: 3 },
    }
    simpanLaporan(laporan)
    setHasil({ laporan, wilayah: w, prioritas })
    window.scrollTo(0, 0)
  }

  const ulang = () => {
    setLangkah(0); setKategori(null); setFoto(null); setTitik(null)
    setJudul(''); setDeskripsi(''); setHasil(null)
  }

  const bisaLanjut = [kategori !== null, titik !== null, deskripsi.trim().length >= 10][langkah]

  if (hasil) return <Hasil {...hasil} onUlang={ulang} />

  return (
    <section className="container-page max-w-3xl py-10 sm:py-14">
      <Link to="/" className="inline-flex items-center gap-1 text-sm font-medium text-ink-soft hover:text-ink">
        <ArrowLeft size={16} /> Beranda
      </Link>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">Lapor masalah di sekitarmu</h1>
      <p className="mt-2 text-ink-soft">Laporanmu akan otomatis dilengkapi data risiko wilayah dan diberi skor prioritas.</p>

      {/* Indikator langkah */}
      <ol className="mt-8 grid grid-cols-3 gap-2" aria-label="Langkah pelaporan">
        {LANGKAH.map((l, i) => (
          <li key={l}>
            <div className={`h-1.5 rounded-full ${i <= langkah ? 'bg-brand-600' : 'bg-line'}`} />
            <p className={`mt-2 text-xs font-semibold sm:text-sm ${i === langkah ? 'text-ink' : 'text-ink-faint'}`}>
              {i + 1}. {l}
            </p>
          </li>
        ))}
      </ol>

      <div className="card mt-6 p-5 sm:p-8">
        {langkah === 0 && (
          <fieldset>
            <legend className="text-lg font-bold">Apa yang ingin kamu laporkan?</legend>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {KATEGORI.map((k) => {
                const Ikon = IKON_KATEGORI[k.id]
                const aktif = kategori === k.id
                return (
                  <button
                    key={k.id}
                    type="button"
                    aria-pressed={aktif}
                    onClick={() => setKategori(k.id)}
                    className={`flex flex-col items-start gap-3 rounded-xl border-2 p-4 text-left transition-colors ${
                      aktif ? 'border-brand-600 bg-brand-50' : 'border-line hover:border-ink-faint'
                    }`}
                  >
                    <Ikon size={22} className={aktif ? 'text-brand-600' : 'text-ink-soft'} />
                    <span className="text-sm font-semibold">{k.label}</span>
                  </button>
                )
              })}
            </div>
          </fieldset>
        )}

        {langkah === 1 && (
          <div className="space-y-6">
            <div>
              <p className="text-lg font-bold">Foto kondisi</p>
              <label className="mt-3 flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed border-line p-4 hover:border-ink-faint">
                {foto ? (
                  <img src={foto} alt="Pratinjau foto laporan" className="h-20 w-20 rounded-lg object-cover" />
                ) : (
                  <span className="flex h-20 w-20 items-center justify-center rounded-lg bg-paper text-ink-faint">
                    <Camera size={26} />
                  </span>
                )}
                <span className="text-sm">
                  <span className="font-semibold text-brand-700">{foto ? 'Ganti foto' : 'Unggah foto'}</span>
                  <span className="block text-ink-faint">JPG/PNG, maks. 2 MB. Data pribadi di foto akan dihapus.</span>
                </span>
                <input type="file" accept="image/png,image/jpeg" onChange={pilihFoto} className="sr-only" />
              </label>
            </div>

            <div>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <p className="text-lg font-bold">Lokasi</p>
                <button type="button" onClick={pakaiGps} className="btn-ghost py-2">
                  <Crosshair size={16} /> Pakai lokasi saya
                </button>
              </div>
              <p className="mt-1 text-sm text-ink-soft">Ketuk peta untuk menandai titik masalah.</p>
              {pesanGps && <p className="mt-2 text-sm text-sedang">{pesanGps}</p>}
              <div className="mt-3 h-72 overflow-hidden rounded-xl border border-line">
                <MapContainer center={titik ?? PUSAT_PETA} zoom={11} className="h-full w-full" scrollWheelZoom={false}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <PemilihTitik onPilih={setTitik} />
                  {titik && <CircleMarker center={titik} radius={10} pathOptions={{ color: '#0f6b5c', fillColor: '#14806f', fillOpacity: 0.9, weight: 3 }} />}
                </MapContainer>
              </div>
              {wilayah && (
                <p className="mt-3 flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-900">
                  <MapPin size={16} className="text-brand-600" />
                  Terdeteksi: <strong>Kec. {wilayah.kecamatan}, {wilayah.kabupaten}</strong>
                </p>
              )}
            </div>
          </div>
        )}

        {langkah === 2 && (
          <div className="space-y-5">
            <div>
              <label htmlFor="judul" className="text-lg font-bold">Judul singkat <span className="text-sm font-normal text-ink-faint">(opsional)</span></label>
              <input
                id="judul"
                value={judul}
                onChange={(e) => setJudul(e.target.value.slice(0, 80))}
                placeholder={`mis. ${kategoriById(kategori).label} di depan pasar`}
                className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label htmlFor="deskripsi" className="text-lg font-bold">Ceritakan kondisinya</label>
              <textarea
                id="deskripsi"
                rows={5}
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value.slice(0, MAKS_DESKRIPSI))}
                placeholder="Apa yang terjadi, sejak kapan, dan apa dampaknya bagi warga?"
                className="mt-2 w-full resize-none rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand-500"
              />
              <div className="mt-1 flex justify-between text-xs text-ink-faint">
                <span>Jangan menyebut nama orang atau nomor identitas.</span>
                <span className="tabular-nums">{deskripsi.length}/{MAKS_DESKRIPSI}</span>
              </div>
            </div>
            <div className="rounded-xl bg-paper p-4 text-sm text-ink-soft">
              <p className="font-semibold text-ink">Ringkasan</p>
              <p className="mt-1">{kategoriById(kategori).label} · Kec. {wilayah.kecamatan}, {wilayah.kabupaten} · {foto ? 'dengan foto' : 'tanpa foto'}</p>
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-6">
          <button
            type="button"
            onClick={() => setLangkah((l) => l - 1)}
            className={`btn-ghost ${langkah === 0 ? 'invisible' : ''}`}
          >
            <ArrowLeft size={16} /> Kembali
          </button>
          {langkah < 2 ? (
            <button type="button" disabled={!bisaLanjut} onClick={() => setLangkah((l) => l + 1)} className="btn-primary">
              Lanjut <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              disabled={!bisaLanjut}
              onClick={() => kirim({ kategori, titik, judul: judul.trim(), deskripsi: deskripsi.trim() })}
              className="btn-primary"
            >
              Kirim laporan <Check size={16} />
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

function Hasil({ laporan, wilayah, prioritas, onUlang }) {
  const w = warnaLevel(prioritas.level)
  return (
    <section className="container-page max-w-4xl py-10 sm:py-14">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white">
          <Check size={20} />
        </span>
        <div>
          <p className="text-sm text-ink-soft">Laporan terkirim</p>
          <p className="font-bold">Kode lacak: <span className="tabular-nums text-brand-700">{laporan.kode}</span></p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-[1fr_1.2fr]">
        <div className={`rounded-2xl border p-6 ${w.latar} ${w.garis}`}>
          <p className="text-sm font-semibold text-ink-soft">Skor prioritas</p>
          <p className={`mt-2 text-7xl font-extrabold leading-none tabular-nums ${w.teks}`}>{prioritas.skor}</p>
          <div className="mt-3"><LencanaPrioritas level={prioritas.level} skor={prioritas.skor} /></div>
          <p className="mt-6 text-sm font-semibold text-ink">Kenapa?</p>
          <p className="mt-1 leading-relaxed text-ink">{prioritas.penjelasan}</p>
          <div className="mt-6 border-t border-black/5 pt-4 text-sm text-ink-soft">
            <p className="font-semibold text-ink">{laporan.judul}</p>
            <p className="mt-1 flex items-center gap-1"><MapPin size={14} /> Kec. {wilayah.kecamatan}, {wilayah.kabupaten}</p>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-bold">Konteks wilayah yang ditambahkan</p>
            <span className="tag-ilustrasi">Data ilustrasi</span>
          </div>
          <p className="mt-1 text-sm text-ink-soft">Skor = jumlah kontribusi tiap faktor (nilai × bobot).</p>
          <div className="mt-6"><RincianFaktor faktor={prioritas.faktor} /></div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to={`/laporan/${laporan.kode}`} className="btn-primary">Lacak laporan ini <ArrowRight size={16} /></Link>
        <button type="button" onClick={onUlang} className="btn-ghost"><RotateCcw size={16} /> Buat laporan lain</button>
      </div>
    </section>
  )
}
