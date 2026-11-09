// Masuk panel instansi dengan akun wilayah (username + password), bukan PIN.
// Satu akun = satu wilayah kerja: admin.pusat, admin.<provinsi>, admin.<kabkota>. Server memeriksa password (scrypt)
// lalu menerbitkan token berisi yurisdiksi akun. Kotak "akun demo" membantu mengisi username saat pengembangan.
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  Globe2,
  KeyRound,
  Landmark,
  LoaderCircle,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { TINGKAT, usernameWilayah } from '@civicpulse/core'
import { api } from '../../services/api.js'
import { useAksi } from '../../hooks/useApi.js'
import { KABKOTA, PROVINSI } from '../../lib/peta.js'
import { pilihFoto } from '../../lib/pesona.js'
import { KreditFoto, LatarFoto } from '../../components/SampulHalaman.jsx'
import Latar3D from '../../components/Latar3D.jsx'

const PERAN = [
  {
    tingkat: TINGKAT.KABKOTA,
    judul: 'Admin Kab/Kota',
    ikon: Building2,
    tugas: 'Menangani laporan: proses, klaim selesai, tanggapan warga.',
  },
  {
    tingkat: TINGKAT.PROVINSI,
    judul: 'Admin Provinsi',
    ikon: Landmark,
    tugas: 'Mengawasi kab/kota: peringkat, daftar admin kab/kota, catatan supervisi.',
  },
  {
    tingkat: TINGKAT.PUSAT,
    judul: 'Admin Pusat',
    ikon: Globe2,
    tugas: 'Memantau nasional: 34 provinsi, daftar admin provinsi, supervisi.',
  },
]

const urutNama = (a, b) => a.nama.localeCompare(b.nama, 'id')
const PROVINSI_URUT = [...PROVINSI].sort(urutNama)
const kelasInput =
  'mt-2 min-h-11 w-full rounded-xl border border-ink-faint bg-white px-4 py-2.5 text-base text-ink disabled:cursor-wait disabled:opacity-60'
const kelasPilih = 'mt-1 min-h-10 w-full rounded-lg border border-brand-100 bg-white px-3 text-sm text-ink'

/** Pembantu demo: pilih tingkat & wilayah ⇒ username akun wilayah itu terisi. */
function AkunDemo({ pakai }) {
  const [tingkat, setTingkat] = useState(TINGKAT.KABKOTA)
  const [provinsiId, setProvinsiId] = useState('jawa-barat')
  const [kabkotaId, setKabkotaId] = useState('kota-bandung')
  const daftarKab = KABKOTA.filter((k) => k.provinsiId === provinsiId).sort(urutNama)
  const username =
    tingkat === TINGKAT.PUSAT
      ? usernameWilayah(tingkat)
      : usernameWilayah(tingkat, tingkat === TINGKAT.PROVINSI ? provinsiId : kabkotaId, provinsiId)

  return (
    <div className="mt-6 rounded-xl border border-brand-100 bg-brand-50 p-4 text-sm text-brand-900">
      <p className="font-semibold">Akun demo</p>
      <p className="mt-1 leading-relaxed">
        Setiap wilayah punya akun sendiri. Password awal semua akun demo: <b className="font-mono">civicpulse2026</b>
        {api.mode === 'lokal' ? ' (mode demo lokal, tersimpan di browser ini).' : ' (server pengembangan).'}
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <label className="text-xs font-semibold">
          Tingkat
          <select value={tingkat} onChange={(e) => setTingkat(e.target.value)} className={kelasPilih}>
            {PERAN.map((p) => (
              <option key={p.tingkat} value={p.tingkat}>
                {p.judul.replace('Admin ', '')}
              </option>
            ))}
          </select>
        </label>
        {tingkat !== TINGKAT.PUSAT && (
          <label className="text-xs font-semibold">
            Provinsi
            <select
              value={provinsiId}
              onChange={(e) => {
                setProvinsiId(e.target.value)
                setKabkotaId(KABKOTA.filter((k) => k.provinsiId === e.target.value).sort(urutNama)[0]?.id ?? '')
              }}
              className={kelasPilih}
            >
              {PROVINSI_URUT.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama}
                </option>
              ))}
            </select>
          </label>
        )}
        {tingkat === TINGKAT.KABKOTA && (
          <label className="text-xs font-semibold">
            Kab/kota
            <select value={kabkotaId} onChange={(e) => setKabkotaId(e.target.value)} className={kelasPilih}>
              {daftarKab.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <code className="rounded-md bg-white px-2 py-1 text-xs">{username}</code>
        <button
          type="button"
          onClick={() => pakai(username)}
          className="min-h-9 rounded-lg bg-brand-600 px-3 text-xs font-bold text-white hover:bg-brand-700"
        >
          Isi username
        </button>
      </div>
    </div>
  )
}

export default function Masuk() {
  const [foto] = useState(() => pilihFoto('masuk'))
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [lihatSandi, setLihatSandi] = useState(false)
  const [masuk, { proses, error }] = useAksi(api.loginInstansi)
  const lokasi = useLocation()
  const navigate = useNavigate()
  const tampilkanDemo = api.mode === 'lokal' || import.meta.env.DEV
  const siap = username.trim() && password

  const kirim = async (event) => {
    event.preventDefault()
    if (proses || !siap) return
    const sesi = await masuk(username.trim(), password)
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
    <section className="relative isolate overflow-hidden bg-brand-900">
      <LatarFoto id={foto} arah="bawah" prioritas />
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-60" aria-hidden="true">
        <Latar3D />
      </div>
      <div className="container-page relative mx-auto max-w-5xl py-8 sm:py-12">
        <Link
          to="/"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-white/80 hover:text-white"
        >
          <ArrowLeft size={16} aria-hidden="true" /> Kembali ke beranda
        </Link>

        <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_1.15fr]">
          <div className="flex flex-col rounded-2xl border border-white/15 bg-brand-900/45 p-6 text-white shadow-2xl backdrop-blur-md sm:p-8">
            <Building2 size={28} className="hidden text-aksen-300 lg:block" aria-hidden="true" />
            <p className="text-xs font-bold uppercase tracking-wider text-aksen-300 lg:mt-6">
              Ruang kerja petugas · Melayani Nusantara
            </p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Masuk Instansi</h1>
            <p className="mt-4 leading-relaxed text-white/80">
              Satu akun untuk satu wilayah kerja. Kab/kota menangani laporan, provinsi mengawasi admin kab/kota, pusat
              memantau admin provinsi.
            </p>
            <ol className="mt-6 space-y-3 text-sm">
              {PERAN.map((p) => (
                <li key={p.tingkat} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-aksen-400 text-brand-900">
                    <p.ikon size={14} aria-hidden="true" />
                  </span>
                  <span>
                    <span className="font-bold">{p.judul}.</span> <span className="text-white/75">{p.tugas}</span>
                  </span>
                </li>
              ))}
            </ol>
            <div className="mt-auto hidden items-start gap-3 border-t border-white/15 pt-6 lg:flex">
              <ShieldCheck size={22} className="mt-0.5 shrink-0 text-aksen-300" aria-hidden="true" />
              <p className="text-sm leading-relaxed text-white/75">
                Password disimpan sebagai hash di server dan wewenang ditegakkan di server: admin hanya bisa membuka
                laporan di wilayahnya. Data di luar Bandung Raya adalah <b>data ilustrasi</b>.
              </p>
            </div>
          </div>

          <div className="card p-6 shadow-2xl sm:p-8">
            <form onSubmit={kirim} aria-busy={proses}>
              <h2 className="text-xl font-bold">Masuk dengan akun wilayah</h2>
              <label htmlFor="username-instansi" className="mt-5 block text-sm font-semibold">
                Username
              </label>
              <div className="relative">
                <UserRound
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 mt-1 -translate-y-1/2 text-ink-faint"
                  aria-hidden="true"
                />
                <input
                  id="username-instansi"
                  name="username"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  placeholder="mis. admin.kota-bandung"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={proses}
                  aria-invalid={Boolean(error)}
                  className={`${kelasInput} pl-10`}
                />
              </div>

              <label htmlFor="sandi-instansi" className="mt-4 block text-sm font-semibold">
                Password
              </label>
              <div className="relative">
                <KeyRound
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 mt-1 -translate-y-1/2 text-ink-faint"
                  aria-hidden="true"
                />
                <input
                  id="sandi-instansi"
                  name="password"
                  type={lihatSandi ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={proses}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'galat-masuk' : undefined}
                  className={`${kelasInput} pl-10 pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setLihatSandi((v) => !v)}
                  aria-label={lihatSandi ? 'Sembunyikan password' : 'Tampilkan password'}
                  className="absolute right-1.5 top-1/2 mt-1 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-ink-soft hover:bg-paper"
                >
                  {lihatSandi ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {error && (
                <p
                  id="galat-masuk"
                  role="alert"
                  className="mt-3 rounded-lg border border-tinggi bg-orange-50 p-3 text-sm text-tinggi"
                >
                  {error.message}
                </p>
              )}

              <button type="submit" disabled={proses || !siap} className="btn-primary mt-5 min-h-11 w-full">
                <span aria-live="polite">{proses ? 'Memeriksa akun…' : 'Masuk Instansi'}</span>
                {proses ? (
                  <LoaderCircle size={18} className="motion-safe:animate-spin" aria-hidden="true" />
                ) : (
                  <ArrowRight size={18} aria-hidden="true" />
                )}
              </button>
              <p className="mt-3 text-xs text-ink-faint">
                Lupa password? Hubungi pengelola sistem CivicPulse di instansi Anda.
              </p>
            </form>

            {tampilkanDemo && <AkunDemo pakai={setUsername} />}
          </div>
        </div>
        <KreditFoto id={foto} className="mt-6" />
      </div>
    </section>
  )
}
