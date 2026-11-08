import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Building2, LoaderCircle, ShieldCheck } from 'lucide-react'
import { api } from '../../services/api.js'
import { useAksi } from '../../hooks/useApi.js'

export default function Masuk() {
  const [pin, setPin] = useState('')
  const [masuk, { proses, error }] = useAksi(api.loginInstansi)
  const lokasi = useLocation()
  const navigate = useNavigate()

  const kirim = async (event) => {
    event.preventDefault()
    if (proses || !pin.trim()) return
    const sesi = await masuk(pin.trim())
    if (sesi) navigate(lokasi.state?.dari ?? '/instansi', { replace: true })
  }

  return (
    <section className="container-page py-8 sm:py-14">
      <div className="mx-auto max-w-4xl">
        <Link
          to="/"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ink-soft hover:text-ink"
        >
          <ArrowLeft size={16} aria-hidden="true" /> Kembali ke beranda
        </Link>

        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col rounded-2xl border border-brand-100 bg-brand-50 p-6 sm:p-8">
            <Building2 size={28} className="hidden text-brand-600 lg:block" aria-hidden="true" />
            <p className="eyebrow lg:mt-6">Ruang kerja petugas</p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Masuk Instansi</h1>
            <p className="mt-4 leading-relaxed text-ink-soft">
              Kelola antrean laporan, perbarui penanganan, dan sampaikan tanggapan kepada warga.
            </p>
            <div className="mt-8 hidden items-start gap-3 border-t border-brand-100 pt-6 lg:flex">
              <ShieldCheck size={22} className="mt-0.5 shrink-0 text-brand-600" aria-hidden="true" />
              <div>
                <p className="font-semibold">Instansi menangani. Warga memastikan.</p>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  Klaim selesai dari petugas tetap menunggu verifikasi warga. Setiap tindak lanjut tercatat dalam
                  riwayat laporan.
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6 sm:p-8">
            <h2 className="text-xl font-bold">Masuk dengan PIN</h2>
            <p id="petunjuk-pin" className="mt-2 text-sm leading-relaxed text-ink-soft">
              Gunakan PIN yang diberikan pengelola instansi.
            </p>

            <form onSubmit={kirim} className="mt-6" aria-busy={proses}>
              <label htmlFor="pin-instansi" className="text-sm font-semibold">
                PIN instansi
              </label>
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
                className="mt-2 min-h-11 w-full rounded-xl border border-ink-faint bg-white px-4 py-3 text-base text-ink disabled:cursor-wait disabled:opacity-60"
              />

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

            <p className="mt-5 flex items-start gap-2 text-sm leading-relaxed text-ink-soft lg:hidden">
              <ShieldCheck size={18} className="mt-0.5 shrink-0 text-brand-600" aria-hidden="true" />
              Klaim selesai tetap menunggu verifikasi warga.
            </p>

            {api.mode === 'lokal' && (
              <div className="mt-6 rounded-xl border border-brand-100 bg-brand-50 p-4 text-sm text-brand-900">
                <p className="font-semibold">
                  PIN demo: <span className="tabular-nums">2026</span>
                </p>
                <p className="mt-1 leading-relaxed">
                  Mode demo lokal. Data tersimpan di browser ini, bukan dikirim ke instansi.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
