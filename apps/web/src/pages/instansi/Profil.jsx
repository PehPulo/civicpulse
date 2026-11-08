// PEMILIK: Yance (sisi instansi) · halaman baru: Ezra · KONTRAK: docs/API.md § POST /auth/profil
// Edit profil petugas. Nama + unit tampil sebagai penanda tangan tanggapan publik.
// Server memvalidasi (validasiProfilPetugas di core) lalu menerbitkan token baru; masa berlaku sesi tidak diperpanjang.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, LoaderCircle, LogOut, Save, ShieldCheck, UserRound } from 'lucide-react'
import { api } from '../../services/api.js'
import { useAksi } from '../../hooks/useApi.js'
import { JudulHalaman, Panel } from '../../components/instansi/ui.jsx'

const kelasInput =
  'mt-1 min-h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100'

export default function Profil() {
  const navigate = useNavigate()
  const sesi = api.sesiInstansi() ?? {}
  const [namaAwal, unitAwal] = (sesi.petugas ?? '').split(' · ')
  const [isian, setIsian] = useState({ nama: namaAwal ?? '', unit: unitAwal ?? '', jabatan: sesi.jabatan ?? '' })
  const [simpan, { proses, error }] = useAksi(api.ubahProfil)
  const [tersimpan, setTersimpan] = useState(false)
  const ubah = (k) => (e) => {
    setTersimpan(false)
    setIsian((s) => ({ ...s, [k]: e.target.value }))
  }

  const kirim = async (e) => {
    e.preventDefault()
    if (await simpan(isian)) setTersimpan(true)
  }
  const keluar = () => {
    api.logoutInstansi()
    navigate('/instansi/masuk', { replace: true })
  }

  const pratinjau = `${isian.nama.trim() || 'Nama'} · ${isian.unit.trim() || 'Unit'}`

  return (
    <div>
      <JudulHalaman
        ikon={UserRound}
        judul="Profil petugas"
        sub="Nama dan unit Anda tampil pada tanggapan publik di halaman warga."
      />
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <Panel judul="Data profil" ikon={UserRound}>
          <form onSubmit={kirim} className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-bold uppercase tracking-wide text-ink-faint sm:col-span-2">
              Nama lengkap
              <input
                value={isian.nama}
                onChange={ubah('nama')}
                maxLength={40}
                required
                minLength={3}
                className={`${kelasInput} normal-case tracking-normal`}
                autoComplete="name"
              />
            </label>
            <label className="text-xs font-bold uppercase tracking-wide text-ink-faint">
              Unit / dinas
              <input
                value={isian.unit}
                onChange={ubah('unit')}
                maxLength={40}
                required
                minLength={2}
                className={`${kelasInput} normal-case tracking-normal`}
                autoComplete="organization"
              />
            </label>
            <label className="text-xs font-bold uppercase tracking-wide text-ink-faint">
              Jabatan <span className="normal-case">(opsional)</span>
              <input
                value={isian.jabatan}
                onChange={ubah('jabatan')}
                maxLength={40}
                className={`${kelasInput} normal-case tracking-normal`}
                autoComplete="organization-title"
              />
            </label>
            <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
              <button type="submit" disabled={proses} className="btn-primary min-h-11">
                {proses ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />} Simpan profil
              </button>
              {tersimpan && (
                <span role="status" className="flex items-center gap-1.5 text-sm font-semibold text-rendah">
                  <CheckCircle2 size={16} /> Tersimpan. Tanggapan berikutnya memakai nama ini.
                </span>
              )}
            </div>
            {error && (
              <p role="alert" className="rounded-xl bg-orange-50 p-3 text-sm text-tinggi sm:col-span-2">
                {error.message}
              </p>
            )}
          </form>
        </Panel>

        <div className="space-y-5">
          <Panel judul="Pratinjau di halaman warga" ikon={CheckCircle2}>
            <div className="rounded-xl bg-brand-50 p-4">
              <p className="text-xs font-bold text-brand-900">Tanggapan publik · {pratinjau}</p>
              <p className="mt-1 text-sm text-brand-900">
                Laporan ini sedang kami proses. Tim survei dijadwalkan ke lokasi.
              </p>
            </div>
          </Panel>
          <Panel judul="Sesi & keamanan" ikon={ShieldCheck}>
            <ul className="space-y-2 text-sm text-ink-soft">
              <li>
                Mode data: <strong className="text-ink">{api.mode === 'server' ? 'server' : 'demo lokal'}</strong>
              </li>
              <li>Sesi berakhir otomatis 8 jam setelah masuk, dan saat tab ditutup.</li>
              <li>Mengubah profil tidak memperpanjang sesi.</li>
            </ul>
            <button
              type="button"
              onClick={keluar}
              className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 text-sm font-semibold text-tinggi hover:bg-orange-100"
            >
              <LogOut size={16} /> Keluar dari panel
            </button>
          </Panel>
        </div>
      </div>
    </div>
  )
}
