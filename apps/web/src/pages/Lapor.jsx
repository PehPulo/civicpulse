// PEMILIK: Ezra (sisi warga) · KONTRAK: docs/FRONTEND.md, docs/AI.md
// Alur lapor 3 langkah: (1) foto & kategori, AI memilihkan kategori dari foto
//                       (2) lokasi, peta mengikuti GPS + pratinjau skor + laporan serupa di dekatmu (+1)
//                       (3) deskripsi, draf otomatis dari hasil identifikasi foto, bisa diubah
import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, useMap, useMapEvents } from 'react-leaflet'
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  Copy,
  Crosshair,
  ImagePlus,
  Lock,
  MapPin,
  RotateCcw,
  Share2,
  ShieldCheck,
  Sparkles,
  ThumbsUp,
  TriangleAlert,
  Waves,
  Construction,
  Mountain,
  CircleHelp,
  Droplets,
} from 'lucide-react'
import {
  ATURAN_LAPORAN,
  KATEGORI,
  LABEL_STATUS,
  STATUS,
  STATUS_TERBUKA,
  hitungPrioritas,
  jarakMeter,
  kategoriById,
  wilayahTerdekat,
} from '@civicpulse/core'
import { api } from '../services/api.js'
import { useAksi, useApi } from '../hooks/useApi.js'
import { DATA_ILUSTRASI, PUSAT_PETA, TILE_ATRIBUSI, TILE_URL, WILAYAH, wilayahById } from '../lib/peta.js'
import { LencanaPrioritas, RincianFaktor, warnaLevel } from '../components/Prioritas.jsx'
import { KotakAI, MemprosesAI, persenYakin } from '../components/AI.jsx'
import { detailFoto, klasifikasiFoto } from '../ai/index.js'
import { PILIHAN_CEPAT, draftDeskripsi, draftJudul, tambahKalimat } from '../ai/deskripsi.js'

const IKON_KATEGORI = { drainase: Droplets, banjir: Waves, jalan: Construction, longsor: Mountain, lainnya: CircleHelp }
const LANGKAH = ['Foto & jenis masalah', 'Lokasi & deskripsi', 'Pratinjau & kirim']
const MAKS_DESKRIPSI = ATURAN_LAPORAN.deskripsiMaks
// Lebih jauh dari ini ke centroid kecamatan terdekat ⇒ titik dianggap di luar wilayah pilot.
const BATAS_PILOT_METER = 8000
const STATUS_SERUPA = [...STATUS_TERBUKA, STATUS.KLAIM_SELESAI]

function PemilihTitik({ onPilih }) {
  useMapEvents({ click: (e) => onPilih([e.latlng.lat, e.latlng.lng]) })
  return null
}

// MapContainer hanya membaca `center` saat pertama dibuat; komponen ini menggeser peta saat titik berubah.
function IkutiTitik({ titik }) {
  const peta = useMap()
  useEffect(() => {
    if (titik) peta.flyTo(titik, Math.max(peta.getZoom(), 15), { duration: 0.6 })
  }, [titik, peta])
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
  const [fileFoto, setFileFoto] = useState(null)
  const [titik, setTitik] = useState(null)
  const [judul, setJudul] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [pesanGps, setPesanGps] = useState('')
  const [hasil, setHasil] = useState(null)
  const [mengirim, setMengirim] = useState(false)
  const [galat, setGalat] = useState('')
  const [saranAi, setSaranAi] = useState(null)
  const [aiMenganalisis, setAiMenganalisis] = useState(false)
  const [detailAi, setDetailAi] = useState(null)
  const [detailProses, setDetailProses] = useState(false)

  const wilayah = titik ? wilayahTerdekat(WILAYAH, titik[0], titik[1]) : null
  const jarakWilayah = wilayah ? jarakMeter(titik[0], titik[1], wilayah.lat, wilayah.lng) : 0
  const luarPilot = wilayah && jarakWilayah > BATAS_PILOT_METER

  const contohDikirim = useRef(false)
  useEffect(() => {
    if (params.get('contoh') !== 'hasil' || contohDikirim.current) return
    contohDikirim.current = true
    kirim(CONTOH_ISIAN)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Kategori dipilih manual oleh warga? Kalau ya, saran AI tidak menimpanya.
  const kategoriManual = useRef(false)
  const pilihKategori = (id) => {
    kategoriManual.current = true
    setKategori(id)
  }

  const pilihFoto = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (foto) URL.revokeObjectURL(foto)
    setFoto(URL.createObjectURL(file))
    setFileFoto(file)
    // Computer vision: saran kategori dari foto (berjalan di browser, tidak memblokir form).
    setSaranAi(null)
    setDetailAi(null)
    setAiMenganalisis(true)
    klasifikasiFoto(file)
      .then((s) => {
        setSaranAi(s)
        if (s && !kategoriManual.current) setKategori(s.kategoriId)
      })
      .finally(() => setAiMenganalisis(false))
  }

  // Detail kondisi di foto untuk kategori terpilih ⇒ bahan draf deskripsi. Diulang bila kategori diganti.
  useEffect(() => {
    if (!fileFoto || !kategori) return
    let aktif = true
    setDetailAi(null)
    setDetailProses(true)
    detailFoto(fileFoto, kategori)
      .then((d) => aktif && setDetailAi(d))
      .finally(() => aktif && setDetailProses(false))
    return () => {
      aktif = false
    }
  }, [fileFoto, kategori])

  // Draf judul & deskripsi otomatis. Hanya mengisi selama warga belum mengubahnya sendiri.
  const drafTerakhir = useRef({ judul: '', deskripsi: '' })
  useEffect(() => {
    if (langkah !== 1 || !kategori) return
    const bahan = { kategoriLabel: kategoriById(kategori).label, detail: detailAi?.detail, wilayah }
    const d = draftDeskripsi(bahan)
    const j = draftJudul(bahan)
    setDeskripsi((lama) => (!lama.trim() || lama === drafTerakhir.current.deskripsi ? d : lama))
    setJudul((lama) => (!lama.trim() || lama === drafTerakhir.current.judul ? j : lama))
    drafTerakhir.current = { judul: j, deskripsi: d }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [langkah, kategori, detailAi, wilayah?.id])
  const masihDraf = deskripsi === drafTerakhir.current.deskripsi

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

  async function kirim(isian) {
    setMengirim(true)
    setGalat('')
    try {
      const laporan = await api.buatLaporan({
        kategoriId: isian.kategori,
        lat: isian.titik[0],
        lng: isian.titik[1],
        judul: isian.judul,
        deskripsi: isian.deskripsi,
        foto: isian.foto,
        ai: isian.ai ?? null,
      })
      setHasil({ laporan, wilayah: wilayahById(laporan.wilayahId), prioritas: laporan.prioritas })
      window.scrollTo(0, 0)
    } catch (e) {
      setGalat(e.message)
    } finally {
      setMengirim(false)
    }
  }

  const ulang = () => {
    setLangkah(0)
    setKategori(null)
    kategoriManual.current = false
    if (foto) URL.revokeObjectURL(foto)
    setFoto(null)
    setFileFoto(null)
    setSaranAi(null)
    setDetailAi(null)
    setTitik(null)
    setJudul('')
    setDeskripsi('')
    drafTerakhir.current = { judul: '', deskripsi: '' }
    setHasil(null)
  }

  const bisaLanjut = [
    kategori !== null,
    titik !== null && deskripsi.trim().length >= ATURAN_LAPORAN.deskripsiMin,
    true,
  ][langkah]

  if (hasil) return <Hasil {...hasil} onUlang={ulang} />

  return (
    <section className="container-page max-w-3xl py-6 sm:py-10">
      <nav aria-label="Breadcrumb" className="mb-5 text-sm text-ink-soft">
        <Link to="/" className="font-medium hover:text-brand-700">
          Beranda
        </Link>
        <span className="mx-2 text-ink-faint" aria-hidden="true">
          /
        </span>
        <span aria-current="page" className="font-semibold text-ink">
          Lapor masalah
        </span>
      </nav>
      <header className="relative isolate overflow-hidden rounded-3xl bg-brand-900 px-5 py-6 text-white sm:px-8 sm:py-8">
        <div
          className="absolute -right-10 -top-16 -z-10 h-56 w-56 rounded-full border-[28px] border-white/5"
          aria-hidden="true"
        />
        <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-100">
          <Camera size={14} /> Pelaporan warga · sekitar 1 menit
        </p>
        <h1 className="mt-4 max-w-xl text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
          Ada masalah di sekitarmu?
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">
          Ceritakan kondisinya. Kami bantu memberi konteks dan prioritas supaya tindak lanjutnya bisa dipantau.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-brand-100 sm:text-sm">
          <span className="inline-flex items-center gap-2">
            <Check size={15} /> Tanpa akun
          </span>
          <span className="inline-flex items-center gap-2">
            <Lock size={14} /> AI foto berjalan di perangkat
          </span>
        </div>
      </header>
      <div className="mt-4 flex items-start gap-3 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-900">
        <span className="tag-ilustrasi mt-0.5 shrink-0">Purwarupa</span>
        <p>Data risiko wilayah berasal dari BNPB dan BPS. Laporan lain yang tampil di versi demo adalah contoh.</p>
      </div>

      {/* Indikator langkah */}
      <ol
        className="mt-7 grid grid-cols-3 gap-3 rounded-2xl border border-line bg-white p-4 sm:p-5"
        aria-label="Langkah pelaporan"
      >
        {LANGKAH.map((l, i) => (
          <li key={l} aria-current={i === langkah ? 'step' : undefined}>
            <div className={`h-2 rounded-full ${i <= langkah ? 'bg-brand-600' : 'bg-line'}`} />
            <p
              className={`mt-2 text-sm font-semibold leading-snug ${i === langkah ? 'text-brand-700' : 'text-ink-faint'}`}
            >
              <span className="tabular-nums">{i + 1}.</span> {l}
            </p>
          </li>
        ))}
      </ol>

      <div className="card mt-4 p-4 shadow-sm sm:p-8">
        {langkah === 0 && (
          <div className="space-y-7">
            <div>
              <p className="text-lg font-bold">
                Foto kondisi <span className="text-sm font-normal text-ink-faint">(disarankan)</span>
              </p>
              <p className="mt-1 text-sm text-ink-soft">
                AI akan mengenali jenis masalahnya dan membantu menulis deskripsi.
              </p>
              <label className="mt-3 flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed border-line p-4 hover:border-brand-500">
                {foto ? (
                  <img src={foto} alt="Pratinjau foto laporan" className="h-24 w-24 rounded-lg object-cover" />
                ) : (
                  <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <Camera size={30} />
                  </span>
                )}
                <span className="text-sm">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-brand-700">
                    <ImagePlus size={16} /> {foto ? 'Ganti foto' : 'Ambil atau pilih foto'}
                  </span>
                  <span className="mt-1 block text-ink-faint">
                    Foto diperkecil dan metadata perangkat dihapus. Jika laporan dikirim, foto ikut disertakan agar
                    kondisi bisa ditinjau.
                  </span>
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={pilihFoto}
                  className="sr-only"
                  aria-label="Foto kondisi"
                />
              </label>
              <div className="mt-3 space-y-2">
                {aiMenganalisis && (
                  <MemprosesAI teks="AI sedang mengenali fotomu…" bolehLanjut="Kamu boleh langsung memilih kategori." />
                )}
                {saranAi && saranAi.kategoriId === kategori && (
                  <KotakAI>
                    AI mengenali foto ini sebagai <strong>{kategoriById(kategori).label}</strong> (
                    {persenYakin(saranAi.yakin)} yakin). Sudah kami pilihkan di bawah, ganti bila keliru.
                  </KotakAI>
                )}
                {saranAi && kategori && saranAi.kategoriId !== kategori && (
                  <KotakAI nada="peringatan">
                    AI: foto ini lebih mirip <strong>{kategoriById(saranAi.kategoriId).label}</strong> (
                    {persenYakin(saranAi.yakin)} yakin).{' '}
                    <button
                      type="button"
                      className="font-semibold underline"
                      onClick={() => pilihKategori(saranAi.kategoriId)}
                    >
                      Pakai saran AI
                    </button>
                  </KotakAI>
                )}
                {fileFoto && !aiMenganalisis && !saranAi && (
                  <p className="text-sm text-ink-soft">
                    AI belum yakin dengan foto ini. Silakan pilih kategori sendiri.
                  </p>
                )}
              </div>
            </div>

            <fieldset>
              <legend className="text-lg font-bold">Apa yang ingin kamu laporkan?</legend>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {KATEGORI.map((k) => {
                  const Ikon = IKON_KATEGORI[k.id]
                  const aktif = kategori === k.id
                  const disarankan = saranAi?.kategoriId === k.id
                  return (
                    <button
                      key={k.id}
                      type="button"
                      aria-pressed={aktif}
                      onClick={() => pilihKategori(k.id)}
                      className={`relative flex min-h-[88px] flex-col items-start gap-3 rounded-xl border-2 p-4 text-left transition-colors ${
                        aktif ? 'border-brand-600 bg-brand-50' : 'border-line hover:border-ink-faint'
                      }`}
                    >
                      <Ikon size={22} className={aktif ? 'text-brand-600' : 'text-ink-soft'} />
                      <span className="text-sm font-semibold">{k.label}</span>
                      {disarankan && (
                        <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-brand-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                          <Sparkles size={11} /> AI
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </fieldset>
          </div>
        )}

        {langkah === 1 && (
          <div className="space-y-5">
            <div>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <p className="text-lg font-bold">Di mana lokasinya?</p>
                <button type="button" onClick={pakaiGps} className="btn-ghost py-2">
                  <Crosshair size={16} /> Pakai lokasi saya
                </button>
              </div>
              <p className="mt-1 text-sm text-ink-soft">Ketuk peta untuk menandai titik masalah, atau pakai GPS.</p>
              {pesanGps && (
                <p className="mt-2 text-sm text-sedang" role="status">
                  {pesanGps}
                </p>
              )}
            </div>
            <div className="h-72 overflow-hidden rounded-xl border border-line">
              <MapContainer center={titik ?? PUSAT_PETA} zoom={11} className="h-full w-full" scrollWheelZoom={false}>
                <TileLayer attribution={TILE_ATRIBUSI} url={TILE_URL} />
                <PemilihTitik onPilih={setTitik} />
                <IkutiTitik titik={titik} />
                {titik && (
                  <CircleMarker
                    center={titik}
                    radius={10}
                    pathOptions={{ color: '#0f6b5c', fillColor: '#14806f', fillOpacity: 0.9, weight: 3 }}
                  />
                )}
              </MapContainer>
            </div>

            {wilayah && (
              <p className="flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-900">
                <MapPin size={16} className="shrink-0 text-brand-600" />
                <span>
                  Terdeteksi:{' '}
                  <strong>
                    Kec. {wilayah.kecamatan}, {wilayah.kabupaten}
                  </strong>
                </span>
              </p>
            )}
            {luarPilot && (
              <p
                className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900"
                role="status"
              >
                <TriangleAlert size={16} className="mt-0.5 shrink-0" />
                <span>
                  Titik ini berada di luar wilayah uji coba (Bandung Raya). Skor memakai data kecamatan terdekat, jadi
                  bisa kurang tepat.
                </span>
              </p>
            )}

            {wilayah && <PratinjauDanSerupa kategori={kategori} titik={titik} wilayah={wilayah} />}
          </div>
        )}

        {langkah === 1 && (
          <div className="space-y-5">
            {(detailProses || aiMenganalisis) && (
              <MemprosesAI
                teks="AI sedang menyusun draf deskripsi dari fotomu…"
                bolehLanjut="Kamu boleh langsung menulis."
              />
            )}
            {masihDraf && detailAi && (
              <KotakAI>
                Draf di bawah disusun AI dari foto dan lokasimu. <strong>Periksa dan lengkapi</strong>: sejak kapan dan
                apa dampaknya bagi warga?
              </KotakAI>
            )}
            <div>
              <label htmlFor="judul" className="text-lg font-bold">
                Judul singkat <span className="text-sm font-normal text-ink-faint">(opsional)</span>
              </label>
              <input
                id="judul"
                value={judul}
                onChange={(e) => setJudul(e.target.value.slice(0, ATURAN_LAPORAN.judulMaks))}
                placeholder={`mis. ${kategoriById(kategori).label} di depan pasar`}
                className="mt-2 min-h-11 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label htmlFor="deskripsi" className="text-lg font-bold">
                Ceritakan kondisinya
              </label>
              <textarea
                id="deskripsi"
                rows={5}
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value.slice(0, MAKS_DESKRIPSI))}
                placeholder="Apa yang terjadi, sejak kapan, dan apa dampaknya bagi warga?"
                className="mt-2 min-h-36 w-full resize-none rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-brand-500"
              />
              <div className="mt-1 flex justify-between gap-3 text-xs text-ink-faint">
                <span>Jangan menyebut nama orang atau nomor identitas.</span>
                <span className="shrink-0 tabular-nums">
                  {deskripsi.length}/{MAKS_DESKRIPSI}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-semibold">Tambahkan dengan sekali ketuk</p>
              {Object.entries(PILIHAN_CEPAT).map(([grup, daftar]) => (
                <div
                  key={grup}
                  className="flex flex-wrap gap-2"
                  aria-label={grup === 'sejak' ? 'Sejak kapan' : 'Dampak'}
                >
                  {daftar.map((k) => {
                    const sudah = deskripsi.includes(k)
                    return (
                      <button
                        key={k}
                        type="button"
                        aria-pressed={sudah}
                        disabled={sudah || deskripsi.length + k.length + 1 > MAKS_DESKRIPSI}
                        onClick={() => setDeskripsi((d) => tambahKalimat(d, k))}
                        className={`min-h-11 rounded-full border px-3 py-2 text-sm font-medium transition-colors ${
                          sudah
                            ? 'border-brand-500 bg-brand-50 text-brand-700'
                            : 'border-line bg-white text-ink-soft hover:border-ink-faint disabled:opacity-50'
                        }`}
                      >
                        {sudah && <Check size={12} className="-mt-0.5 mr-1 inline" />}
                        {k.replace(/\.$/, '')}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
            <div className="rounded-xl bg-paper p-4 text-sm text-ink-soft">
              <p className="font-semibold text-ink">Ringkasan</p>
              <p className="mt-1">
                {kategoriById(kategori).label} ·{' '}
                {wilayah ? `Kec. ${wilayah.kecamatan}, ${wilayah.kabupaten}` : 'lokasi belum dipilih'} ·{' '}
                {foto ? 'dengan foto' : 'tanpa foto'}
              </p>
            </div>
            {wilayah && (
              <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-ink">Pratinjau skor prioritas</p>
                    <p className="mt-0.5 text-xs text-ink-soft">
                      Perkiraan awal; skor final dihitung saat laporan masuk.
                    </p>
                  </div>
                  {DATA_ILUSTRASI && <span className="tag-ilustrasi">Data ilustrasi</span>}
                </div>
                {(() => {
                  const pratinjau = hitungPrioritas(wilayah, kategori, 0)
                  const w = warnaLevel(pratinjau.level)
                  return (
                    <>
                      <div className="mt-4 flex items-center gap-3">
                        <span className={`text-4xl font-extrabold leading-none tabular-nums ${w.teks}`}>
                          {pratinjau.skor}
                        </span>
                        <LencanaPrioritas level={pratinjau.level} skor={pratinjau.skor} />
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-ink">{pratinjau.penjelasan}</p>
                      <details className="mt-4 border-t border-brand-100 pt-3">
                        <summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold text-brand-800">
                          Lihat rincian faktor skor
                        </summary>
                        <div className="pt-2">
                          <RincianFaktor faktor={pratinjau.faktor} />
                        </div>
                      </details>
                    </>
                  )
                })()}
              </div>
            )}
          </div>
        )}

        {langkah === 2 && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-brand-700">Langkah terakhir</p>
                <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-ink">Periksa sebelum dikirim</h2>
                <p className="mt-1 text-sm text-ink-soft">Pastikan lokasi dan ceritanya sudah tepat.</p>
              </div>
              {DATA_ILUSTRASI && <span className="tag-ilustrasi">Data ilustrasi</span>}
            </div>

            <article className="overflow-hidden rounded-2xl border border-line bg-white">
              <div className="flex items-center justify-between border-b border-line bg-paper px-4 py-3">
                <p className="text-sm font-bold text-ink">Ringkasan laporan</p>
                <button
                  type="button"
                  onClick={() => setLangkah(1)}
                  className="min-h-11 px-2 text-sm font-bold text-brand-700 hover:text-brand-900"
                >
                  Ubah
                </button>
              </div>
              <div className="flex gap-4 p-4 sm:p-5">
                {foto ? (
                  <img
                    src={foto}
                    alt="Foto kondisi yang akan dilaporkan"
                    className="h-20 w-20 shrink-0 rounded-xl object-cover sm:h-24 sm:w-24"
                  />
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 sm:h-24 sm:w-24">
                    <Camera size={26} aria-hidden="true" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                    {kategoriById(kategori).label}
                  </p>
                  <h3 className="mt-1 break-words font-bold leading-snug text-ink">
                    {judul.trim() || `Laporan ${kategoriById(kategori).label.toLowerCase()}`}
                  </h3>
                  <p className="mt-2 flex items-start gap-1.5 text-sm text-ink-soft">
                    <MapPin size={15} className="mt-0.5 shrink-0 text-brand-600" />
                    <span>
                      Kec. {wilayah.kecamatan}, {wilayah.kabupaten}
                    </span>
                  </p>
                </div>
              </div>
              <div className="border-t border-line px-4 py-4 sm:px-5">
                <p className="text-xs font-bold uppercase tracking-wide text-ink-faint">Ceritamu</p>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink">{deskripsi.trim()}</p>
              </div>
            </article>

            {(() => {
              const pratinjau = hitungPrioritas(wilayah, kategori, 0)
              const w = warnaLevel(pratinjau.level)
              return (
                <section
                  className={`rounded-2xl border p-4 sm:p-5 ${w.latar} ${w.garis}`}
                  aria-labelledby="judul-pratinjau-skor"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 id="judul-pratinjau-skor" className="font-bold text-ink">
                        Perkiraan skor prioritas
                      </h3>
                      <p className="mt-1 text-xs text-ink-soft">Skor akhir bisa berubah mengikuti dukungan warga.</p>
                    </div>
                    <span className="text-xs font-semibold text-ink-soft">dari 100</span>
                  </div>
                  <div className="mt-4 flex flex-wrap items-end gap-3">
                    <span className={`text-5xl font-extrabold leading-none tabular-nums ${w.teks}`}>
                      {pratinjau.skor}
                    </span>
                    <LencanaPrioritas level={pratinjau.level} skor={pratinjau.skor} />
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-ink">{pratinjau.penjelasan}</p>
                  <details className="mt-4 border-t border-black/10 pt-2">
                    <summary className="min-h-11 cursor-pointer py-2 text-sm font-bold text-brand-800">
                      Kenapa skornya {pratinjau.skor}?
                    </summary>
                    <div className="pt-2">
                      <RincianFaktor faktor={pratinjau.faktor} />
                    </div>
                  </details>
                </section>
              )
            })()}

            <p className="flex items-start gap-2 rounded-xl border border-line bg-paper p-4 text-sm leading-relaxed text-ink-soft">
              <ShieldCheck size={17} className="mt-0.5 shrink-0 text-brand-700" />
              Hindari menulis nama, NIK, atau nomor telepon. Foto yang kamu lampirkan menjadi bagian dari laporan.
              Simpan kode lacak setelah dikirim.
            </p>
          </div>
        )}

        {galat && (
          <p role="alert" className="mt-6 rounded-lg bg-orange-50 px-3 py-2 text-sm text-tinggi">
            {galat}
          </p>
        )}

        {/* Navigasi: menempel di bawah layar pada HP agar mudah dijangkau jempol */}
        <div className="sticky bottom-0 z-[600] -mx-4 mt-6 flex items-center justify-between gap-3 border-t border-line bg-white/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:static sm:mx-0 sm:mt-8 sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-6">
          <button
            type="button"
            onClick={() => setLangkah((l) => l - 1)}
            className={`btn-ghost ${langkah === 0 ? 'invisible' : ''}`}
          >
            <ArrowLeft size={16} /> Kembali
          </button>
          {langkah < 2 ? (
            <button
              type="button"
              disabled={!bisaLanjut}
              onClick={() => setLangkah((l) => l + 1)}
              className="btn-primary"
            >
              Lanjut <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              disabled={!bisaLanjut || mengirim}
              onClick={() =>
                kirim({
                  kategori,
                  titik,
                  judul: judul.trim(),
                  deskripsi: deskripsi.trim(),
                  foto: fileFoto,
                  ai: saranAi && {
                    kategoriSaran: saranAi.kategoriId,
                    yakin: saranAi.yakin,
                    modelVersi: saranAi.modelVersi,
                    detailSaran: detailAi?.detail.map((d) => d.id) ?? [],
                  },
                })
              }
              className="btn-primary"
            >
              {mengirim ? 'Mengirim…' : 'Kirim laporan'} <Check size={16} />
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

/**
 * Pratinjau skor + laporan serupa dalam radius ATURAN_LAPORAN.serupaRadiusMeter.
 * Jumlah pelapor serupa adalah PERKIRAAN dari data publik (pelapor + dukungan); skor final dihitung server/core saat kirim.
 */
function PratinjauDanSerupa({ kategori, titik, wilayah }) {
  const {
    data: semua,
    loading: memuatSerupa,
    error: galatSerupa,
  } = useApi(() => api.daftarLaporan({ kategoriId: kategori }), [kategori])
  const [dukung, { proses, error }] = useAksi(api.dukung)
  const batasWaktu = Date.now() - ATURAN_LAPORAN.serupaHari * 86400000
  const serupa = (semua ?? [])
    .filter((l) => STATUS_SERUPA.includes(l.status) && Date.parse(l.dibuat) >= batasWaktu)
    .map((l) => ({ ...l, jarak: jarakMeter(titik[0], titik[1], l.lat, l.lng) }))
    .filter((l) => l.jarak <= ATURAN_LAPORAN.serupaRadiusMeter)
    .sort((a, b) => a.jarak - b.jarak)
  const perkiraanSerupa = serupa
    .filter((l) => !l.saya?.pelapor)
    .reduce((n, l) => n + 1 + (l.jumlahDukungan ?? 0) - (l.saya?.dukung ? 1 : 0), 0)
  const p = hitungPrioritas(wilayah, kategori, perkiraanSerupa)
  const w = warnaLevel(p.level)

  return (
    <div className="space-y-4">
      <div className={`rounded-xl border p-4 ${w.latar} ${w.garis}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-ink">Perkiraan prioritas laporanmu</p>
          {DATA_ILUSTRASI && <span className="tag-ilustrasi">Data ilustrasi</span>}
        </div>
        <div className="mt-2 flex items-center gap-3">
          <span className={`text-4xl font-extrabold tabular-nums ${w.teks}`}>{p.skor}</span>
          <LencanaPrioritas level={p.level} skor={p.skor} />
        </div>
        <p className="mt-2 text-sm leading-relaxed text-ink">{p.penjelasan}</p>
      </div>

      {memuatSerupa && (
        <div className="rounded-xl border border-line bg-white p-4 text-sm text-ink-soft" role="status">
          Memeriksa laporan serupa di dekat lokasi ini…
        </div>
      )}
      {galatSerupa && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="alert">
          {galatSerupa.message}
        </p>
      )}
      {!memuatSerupa && !galatSerupa && serupa.length === 0 && (
        <p className="rounded-xl border border-line bg-white p-4 text-sm text-ink-soft">
          Belum ada laporan serupa yang perlu kamu dukung di sekitar titik ini.
        </p>
      )}
      {serupa.length > 0 && (
        <div className="rounded-xl border border-line p-4">
          <p className="font-semibold">
            Sudah ada {serupa.length} laporan serupa dalam {ATURAN_LAPORAN.serupaRadiusMeter} m
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            Kalau masalahnya sama, cukup tekan <strong>+1</strong>: skor laporan itu naik dan instansi tidak menerima
            laporan ganda. Kalau berbeda, lanjutkan saja laporanmu.
          </p>
          <ul className="mt-3 space-y-2">
            {serupa.slice(0, 3).map((l) => {
              const tercatat = l.saya?.pelapor || l.saya?.dukung
              return (
                <li key={l.kode} className="flex flex-wrap items-center gap-3 rounded-lg bg-paper p-3">
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/laporan/${l.kode}`}
                      target="_blank"
                      rel="noreferrer"
                      className="block truncate text-sm font-semibold hover:underline"
                    >
                      {l.judul}
                    </Link>
                    <p className="text-xs text-ink-faint">
                      {Math.round(l.jarak)} m · {LABEL_STATUS[l.status]} · {l.jumlahDukungan ?? 0} warga ikut mengalami
                    </p>
                  </div>
                  {l.status === STATUS.KLAIM_SELESAI ? (
                    <Link to={`/laporan/${l.kode}`} target="_blank" rel="noreferrer" className="btn-ghost py-2 text-xs">
                      Bantu verifikasi
                    </Link>
                  ) : tercatat ? (
                    <span className="text-xs font-semibold text-brand-700">
                      <Check size={12} className="-mt-0.5 mr-1 inline" />
                      Kamu sudah tercatat
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={proses}
                      onClick={() => dukung(l.kode)}
                      className="btn-ghost py-2 text-xs"
                    >
                      <ThumbsUp size={14} /> +1 Saya juga mengalami
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
          {error && (
            <p role="alert" className="mt-2 text-sm text-tinggi">
              {error.message}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function Hasil({ laporan, wilayah, prioritas, onUlang }) {
  const w = warnaLevel(prioritas.level)
  const [tersalin, setTersalin] = useState(false)
  const tautan = `${window.location.origin}/laporan/${laporan.kode}`
  const pesanWa = `Saya melaporkan "${laporan.judul}" lewat CivicPulse. Kode lacak: ${laporan.kode}. Pantau tindak lanjutnya di ${tautan}`

  const salin = async () => {
    try {
      await navigator.clipboard.writeText(laporan.kode)
      setTersalin(true)
      setTimeout(() => setTersalin(false), 2000)
    } catch {
      setTersalin(false)
    }
  }

  return (
    <section className="container-page max-w-4xl py-10 sm:py-14">
      <div className="rounded-2xl border border-brand-100 bg-brand-50 p-5 sm:flex sm:items-center sm:justify-between sm:gap-4 sm:p-7">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
            <Check size={22} />
          </span>
          <div>
            <p className="text-sm font-semibold text-brand-900">Laporan berhasil dikirim</p>
            <p className="mt-1 text-xs text-ink-soft">Simpan kode ini untuk melihat perkembangan laporanmu.</p>
            <p className="mt-2 text-3xl font-extrabold tracking-tight tabular-nums text-brand-700 sm:text-4xl">
              {laporan.kode}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 sm:mt-0 sm:justify-end">
          <button type="button" onClick={salin} className="btn-ghost min-h-11 bg-white py-2.5" aria-live="polite">
            {tersalin ? <Check size={16} /> : <Copy size={16} />} {tersalin ? 'Tersalin' : 'Salin kode'}
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(pesanWa)}`}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost min-h-11 bg-white py-2.5"
          >
            <Share2 size={16} /> Bagikan ke WhatsApp
          </a>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[1fr_1.2fr]">
        <div className={`rounded-2xl border p-6 ${w.latar} ${w.garis}`}>
          <p className="text-sm font-semibold text-ink-soft">Skor prioritas</p>
          <p className={`mt-2 text-7xl font-extrabold leading-none tabular-nums ${w.teks}`}>{prioritas.skor}</p>
          <div className="mt-3">
            <LencanaPrioritas level={prioritas.level} skor={prioritas.skor} />
          </div>
          <p className="mt-6 text-sm font-semibold text-ink">Kenapa?</p>
          <p className="mt-1 leading-relaxed text-ink">{prioritas.penjelasan}</p>
          <div className="mt-6 border-t border-black/5 pt-4 text-sm text-ink-soft">
            <p className="font-semibold text-ink">{laporan.judul}</p>
            <p className="mt-1 flex items-center gap-1">
              <MapPin size={14} /> Kec. {wilayah.kecamatan}, {wilayah.kabupaten}
            </p>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-bold">Konteks wilayah yang ditambahkan</p>
            {DATA_ILUSTRASI && <span className="tag-ilustrasi">Data ilustrasi</span>}
          </div>
          <p className="mt-1 text-sm text-ink-soft">Skor = jumlah kontribusi tiap faktor (nilai × bobot).</p>
          <div className="mt-6">
            <RincianFaktor faktor={prioritas.faktor} />
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to={`/laporan/${laporan.kode}`} className="btn-primary">
          Lacak laporan ini <ArrowRight size={16} />
        </Link>
        <button type="button" onClick={onUlang} className="btn-ghost">
          <RotateCcw size={16} /> Buat laporan lain
        </button>
      </div>
    </section>
  )
}
