// Masuk panel instansi: pilih tingkat admin (Kab/Kota · Provinsi · Pusat) + wilayah, lalu PIN.
// Server memvalidasi PIN per tingkat dan wilayahnya (validasiAkses), lalu menerbitkan token berisi yurisdiksi.
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Building2, Globe2, Landmark, LoaderCircle, ShieldCheck } from 'lucide-react'
import { TINGKAT } from '@civicpulse/core'
import { api } from '../../services/api.js'
import { useAksi } from '../../hooks/useApi.js'
import { KABKOTA, PROVINSI } from '../../lib/peta.js'

const PILIHAN = [
  {
    tingkat: TINGKAT.KABKOTA,
    judul: 'Admin Kab/Kota',
    ikon: Building2,
    tugas: 'Menangani laporan: proses, klaim selesai, tanggapan warga.',
    pin: '2026',
  },
  {
    tingkat: TINGKAT.PROVINSI,
    judul: 'Admin Provinsi',
    ikon: Landmark,
    tugas: 'Mengawasi kab/kota: peringkat, peta 3D provinsi, catatan supervisi.',
    pin: '3232',
  },
  {
    tingkat: TINGKAT.PUSAT,
    judul: 'Admin Pusat',
    ikon: Globe2,
    tugas: 'Memantau nasional: 34 provinsi, peta 3D Indonesia, supervisi.',
    pin: '1945',
  },
]

const urutNama = (a, b) => a.nama.localeCompare(b.nama, 'id')
const PROVINSI_URUT = [...PROVINSI].sort(urutNama)
const kelasInput =
  'mt-2 min-h-11 w-full rounded-xl border border-ink-faint bg-white px-4 py-2.5 text-base text-ink disabled:cursor-wait disabled:opacity-60'

export default function Masuk() {
  const [tingkat, setTingkat] = useState(TINGKAT.KABKOTA)
  const [provinsiId, setProvinsiId] = useState('jawa-barat')
  const [kabkotaId, setKabkotaId] = useState('kota-bandung')
  const [pin, setPin] = useState('')
  const [masuk, { proses, error }] = useAksi(api.loginInstansi)
  const lokasi = useLocation()
  const navigate = useNavigate()
  const daftarKab = KABKOTA.filter((k) => k.provinsiId === provinsiId).sort(urutNama)
  const tampilkanPinDemo = api.mode === 'lokal' || import.meta.env.DEV

  const gantiProvinsi = (id) => {
    setProvinsiId(id)
    setKabkotaId(KABKOTA.filter((k) => k.provinsiId === id).sort(urutNama)[0]?.id ?? '')
  }

  const kirim = async (event) => {
    event.preventDefault()
    if (proses || !pin.trim()) return
    const opsi =
      tingkat === TINGKAT.PUSAT
        ? { tingkat }
        : tingkat === TINGKAT.PROVINSI
          ? { tingkat, provinsiId }
          : { tingkat, provinsiId, kabkotaId }
    const sesi = await masuk(pin.trim(), opsi)
    if (sesi) {
      try {
        sessionStorage.removeItem('civicpulse:cakupan')
      } catch {
        // abaikan
      }
      navigate(lokasi.state?.dari ?? '/instansi', { replace: true })
    }
  }

  return (
    <section className="container-page py-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <Link
          to="/"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ink-soft hover:text-ink"
        >
          <ArrowLeft size={16} aria-hidden="true" /> Kembali ke beranda
        </Link>

        <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_1.15fr]">
          <div className="flex flex-col rounded-2xl border border-brand-100 bg-brand-50 p-6 sm:p-8">
            <Building2 size={28} className="hidden text-brand-600 lg:block" aria-hidden="true" />
            <p className="eyebrow lg:mt-6">Ruang kerja petugas</p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Masuk Instansi</h1>
            <p className="mt-4 leading-relaxed text-ink-soft">
              Tiga tingkat admin, satu alur: kab/kota menangani laporan, provinsi mengawasi kab/kota, pusat memantau
              seluruh Indonesia.
            </p>
            <ol className="mt-6 space-y-3 text-sm">
              {PILIHAN.map((p, i) => (
                <li key={p.tingkat} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <span>
                    <span className="font-bold">{p.judul}.</span> <span className="text-ink-soft">{p.tugas}</span>
                  </span>
                </li>
              ))}
            </ol>
            <div className="mt-auto hidden items-start gap-3 border-t border-brand-100 pt-6 lg:flex">
              <ShieldCheck size={22} className="mt-0.5 shrink-0 text-brand-600" aria-hidden="true" />
              <p className="text-sm leading-relaxed text-ink-soft">
                Wewenang ditegakkan di server: admin hanya bisa membuka dan menindak laporan di wilayahnya. Data di luar
                Bandung Raya adalah <b>data ilustrasi</b> untuk demo nasional.
              </p>
            </div>
          </div>

          <div className="card p-6 sm:p-8">
            <form onSubmit={kirim} aria-busy={proses}>
              <fieldset>
                <legend className="text-xl font-bold">1. Pilih tingkat admin</legend>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {PILIHAN.map(({ tingkat: t, judul, ikon: Ikon }) => (
                    <label
                      key={t}
                      className={`flex cursor-pointer flex-col items-start gap-2 rounded-xl border p-3 text-sm transition-colors ${
                        tingkat === t
                          ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-600/20'
                          : 'border-line hover:border-brand-500'
                      }`}
                    >
                      <input
                        type="radio"
                        name="tingkat"
                        value={t}
                        checked={tingkat === t}
                        onChange={() => setTingkat(t)}
                        className="sr-only"
                      />
                      <Ikon size={20} className="text-brand-600" aria-hidden="true" />
                      <span className="font-bold">{judul}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {tingkat !== TINGKAT.PUSAT && (
                <fieldset className="mt-6">
                  <legend className="text-xl font-bold">2. Wilayah kerja</legend>
                  <label htmlFor="pilih-provinsi" className="mt-4 block text-sm font-semibold">
                    Provinsi
                  </label>
                  <select
                    id="pilih-provinsi"
                    value={provinsiId}
                    onChange={(e) => gantiProvinsi(e.target.value)}
                    disabled={proses}
                    className={kelasInput}
                  >
                    {PROVINSI_URUT.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nama}
                      </option>
                    ))}
                  </select>
                  {tingkat === TINGKAT.KABKOTA && (
                    <>
                      <label htmlFor="pilih-kabkota" className="mt-4 block text-sm font-semibold">
                        Kabupaten / kota
                      </label>
                      <select
                        id="pilih-kabkota"
                        value={kabkotaId}
                        onChange={(e) => setKabkotaId(e.target.value)}
                        disabled={proses}
                        className={kelasInput}
                      >
                        {daftarKab.map((k) => (
                          <option key={k.id} value={k.id}>
                            {k.nama}
                          </option>
                        ))}
                      </select>
                    </>
                  )}
                </fieldset>
              )}

              <div className="mt-6">
                <label htmlFor="pin-instansi" className="text-xl font-bold">
                  {tingkat === TINGKAT.PUSAT ? '2' : '3'}. PIN instansi
                </label>
                <p id="petunjuk-pin" className="mt-1 text-sm text-ink-soft">
                  Gunakan PIN yang diberikan pengelola untuk tingkat ini.
                </p>
                <input
                  id="pin-instansi"
                  name="pin"
                  type="password"
                  inputMode="numeric"
                  autoComplete="current-password"
                  required
                  value={pin}
                  onChange={(event) => setPin(event.target.value)}
                  disabled={proses}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'petunjuk-pin galat-pin' : 'petunjuk-pin'}
                  className={kelasInput}
                />
              </div>

              {error && (
                <p
                  id="galat-pin"
                  role="alert"
                  className="mt-3 rounded-lg border border-tinggi bg-orange-50 p-3 text-sm text-tinggi"
                >
                  {error.message}
                </p>
              )}

              <button type="submit" disabled={proses || !pin.trim()} className="btn-primary mt-5 min-h-11 w-full">
                <span aria-live="polite">{proses ? 'Memeriksa PIN…' : 'Masuk Instansi'}</span>
                {proses ? (
                  <LoaderCircle size={18} className="motion-safe:animate-spin" aria-hidden="true" />
                ) : (
                  <ArrowRight size={18} aria-hidden="true" />
                )}
              </button>
            </form>

            {tampilkanPinDemo && (
              <div className="mt-6 rounded-xl border border-brand-100 bg-brand-50 p-4 text-sm text-brand-900">
                <p className="font-semibold">PIN demo</p>
                <ul className="mt-1 grid gap-1 sm:grid-cols-3">
                  {PILIHAN.map((p) => (
                    <li key={p.tingkat}>
                      {p.judul.replace('Admin ', '')}: <b className="tabular-nums">{p.pin}</b>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 leading-relaxed">
                  {api.mode === 'lokal'
                    ? 'Mode demo lokal. Data tersimpan di browser ini, bukan dikirim ke instansi.'
                    : 'PIN bawaan server pengembangan. Produksi wajib mengatur PIN sendiri.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
