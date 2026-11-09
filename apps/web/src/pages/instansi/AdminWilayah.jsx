// PEMILIK: Ezra · KONTRAK: docs/API.md § GET /auth/admin
// Daftar admin bawahan: provinsi melihat siapa yang memegang data tiap kab/kota di provinsinya; pusat melihat
// admin tiap provinsi (dan bisa menelusuri admin kab/kota satu provinsi). Profil diisi pemilik akun di halaman
// Profil; beban data (laporan terbuka, lewat target, skor kinerja) dihitung server.
import { useMemo, useState } from 'react'
import { ArrowLeft, Clock, KeyRound, Search, ShieldAlert, UserRound, UsersRound } from 'lucide-react'
import { TINGKAT } from '@civicpulse/core'
import { api } from '../../services/api.js'
import { useApi } from '../../hooks/useApi.js'
import { useCakupan } from '../../components/instansi/cakupan.js'
import { provinsiById } from '../../lib/peta.js'
import {
  HanyaUntuk,
  JudulHalaman,
  KartuAngka,
  Kerangka,
  Panel,
  PesanGalat,
  angka,
  tampilWaktu,
} from '../../components/instansi/ui.jsx'

const warnaSkor = (s) =>
  s == null ? 'text-ink-faint' : s >= 75 ? 'text-rendah' : s >= 50 ? 'text-sedang' : 'text-tinggi'

function KartuAdmin({ a, telusur }) {
  return (
    <li className="flex flex-col rounded-2xl border border-line/70 bg-white p-4 shadow-[0_2px_10px_-4px_rgba(15,31,46,0.12)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-brand-700">{a.wilayahNama}</p>
          <p className="mt-1 truncate font-bold text-ink">{a.nama}</p>
          <p className="truncate text-sm text-ink-soft">
            {a.unit}
            {a.jabatan ? ` · ${a.jabatan}` : ''}
          </p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
          <UserRound size={18} aria-hidden="true" />
        </span>
      </div>
      <p className="mt-2 font-mono text-xs text-ink-faint">{a.username}</p>

      <dl className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-paper p-2 text-center">
        <div>
          <dt className="text-[11px] text-ink-faint">Terbuka</dt>
          <dd className="font-bold tabular-nums">{angka(a.beban.terbuka)}</dd>
        </div>
        <div>
          <dt className="text-[11px] text-ink-faint">Lewat target</dt>
          <dd className={`font-bold tabular-nums ${a.beban.lewatSla ? 'text-tinggi' : ''}`}>
            {angka(a.beban.lewatSla)}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] text-ink-faint">Skor</dt>
          <dd className={`font-bold tabular-nums ${warnaSkor(a.beban.skor)}`}>{a.beban.skor ?? '–'}</dd>
        </div>
      </dl>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-soft">
        <span className="inline-flex items-center gap-1">
          <Clock size={12} aria-hidden="true" />
          {a.terakhirMasuk ? `Masuk ${tampilWaktu(a.terakhirMasuk)}` : 'Belum pernah masuk'}
        </span>
        <span
          className={`inline-flex items-center gap-1 ${a.sandiDiganti ? 'text-rendah' : 'text-sedang'}`}
          title={a.sandiDiganti ? 'Password sudah diganti pemilik akun' : 'Masih memakai password awal'}
        >
          {a.sandiDiganti ? <KeyRound size={12} aria-hidden="true" /> : <ShieldAlert size={12} aria-hidden="true" />}
          {a.sandiDiganti ? 'Password diganti' : 'Password awal'}
        </span>
      </div>

      {telusur && (
        <button type="button" onClick={() => telusur(a.provinsiId)} className="btn-ghost mt-3 min-h-10 text-sm">
          <UsersRound size={15} aria-hidden="true" /> Lihat admin kab/kota
        </button>
      )}
    </li>
  )
}

export default function AdminWilayah() {
  const k = useCakupan()
  const pusat = k.tingkat === TINGKAT.PUSAT
  const [telusurId, setTelusurId] = useState(null)
  const [cari, setCari] = useState('')
  const { data, loading, error } = useApi(
    () => (k.mengawasi ? api.daftarAdmin({ provinsiId: telusurId ?? undefined }) : Promise.resolve([])),
    [telusurId, k.mengawasi],
  )

  const tampil = useMemo(() => {
    const q = cari.trim().toLowerCase()
    return [...(data ?? [])]
      .filter((a) => !q || [a.wilayahNama, a.nama, a.unit, a.username].some((x) => x?.toLowerCase().includes(q)))
      .sort((a, b) => b.beban.lewatSla - a.beban.lewatSla || a.wilayahNama.localeCompare(b.wilayahNama, 'id'))
  }, [data, cari])

  const daftar = data ?? []
  const pernahMasuk = daftar.filter((a) => a.terakhirMasuk).length
  const sandiAwal = daftar.filter((a) => !a.sandiDiganti).length
  const lewat = daftar.reduce((s, a) => s + a.beban.lewatSla, 0)
  const satuan = pusat && !telusurId ? 'provinsi' : 'kab/kota'

  return (
    <HanyaUntuk boleh={k.mengawasi} pesan="Daftar admin wilayah hanya untuk admin provinsi dan pusat.">
      <JudulHalaman
        ikon={UsersRound}
        judul={
          telusurId
            ? `Admin kab/kota · ${provinsiById(telusurId)?.nama ?? telusurId}`
            : pusat
              ? 'Admin provinsi'
              : `Admin kab/kota · ${k.namaYurisdiksi.replace(/^Provinsi /, '')}`
        }
        sub={`Siapa yang memegang data tiap ${satuan}: profil, aktivitas masuk, dan beban laporannya. Profil diisi pemilik akun sendiri.`}
        kanan={
          telusurId && (
            <button type="button" onClick={() => setTelusurId(null)} className="btn-ghost min-h-10 text-sm">
              <ArrowLeft size={16} aria-hidden="true" /> Kembali ke admin provinsi
            </button>
          )
        }
      />
      <PesanGalat galat={error} />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KartuAngka label={`Akun ${satuan}`} nilai={angka(daftar.length)} ikon={UsersRound} memuat={loading} />
        <KartuAngka
          label="Pernah masuk"
          nilai={angka(pernahMasuk)}
          ket={`dari ${angka(daftar.length)} akun`}
          ikon={Clock}
          memuat={loading}
        />
        <KartuAngka
          label="Masih password awal"
          nilai={angka(sandiAwal)}
          nada={sandiAwal ? 'waspada' : 'baik'}
          ikon={ShieldAlert}
          memuat={loading}
        />
        <KartuAngka
          label="Laporan lewat target"
          nilai={angka(lewat)}
          nada={lewat ? 'bahaya' : 'baik'}
          ikon={KeyRound}
          memuat={loading}
        />
      </div>

      <Panel
        judul={`Daftar admin ${satuan}`}
        ikon={UsersRound}
        kanan={
          <label className="relative block w-full max-w-[240px]">
            <span className="sr-only">Cari admin</span>
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
              aria-hidden="true"
            />
            <input
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              placeholder="Cari wilayah / nama"
              className="min-h-9 w-full rounded-lg border border-line bg-white pl-8 pr-3 text-sm outline-none focus:border-brand-500"
            />
          </label>
        }
      >
        {loading ? (
          <Kerangka baris={4} />
        ) : tampil.length === 0 ? (
          <p className="text-sm text-ink-soft">Tidak ada admin yang cocok.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {tampil.map((a) => (
              <KartuAdmin key={a.username} a={a} telusur={pusat && !telusurId ? setTelusurId : null} />
            ))}
          </ul>
        )}
        <p className="mt-4 text-xs text-ink-faint">
          Diurutkan dari laporan lewat target terbanyak. Data di luar Bandung Raya adalah data ilustrasi.
        </p>
      </Panel>
    </HanyaUntuk>
  )
}
