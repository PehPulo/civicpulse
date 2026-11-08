// Alur supervisi berjenjang. Provinsi/pusat: daftar laporan yang perlu arahan (terbuka & lewat target, belum diberi
// arahan) + riwayat arahan yang dikirim. Kab/kota: kotak masuk "Arahan atasan" untuk laporan di wilayahnya.
// Arahan dikirim dari halaman detail laporan (POST /laporan/:kode/supervisi); status tetap milik admin kab/kota.
import { Link } from 'react-router-dom'
import { ArrowRight, ClipboardCheck, Inbox, MessagesSquare, Send, TimerOff } from 'lucide-react'
import { LABEL_STATUS, LABEL_TINGKAT, STATUS_TERBUKA, slaLaporan, urutkanAntrean } from '@civicpulse/core'
import { api } from '../../services/api.js'
import { useApi } from '../../hooks/useApi.js'
import { lokasiPendek, wilayahById } from '../../lib/peta.js'
import { useCakupan } from '../../components/instansi/cakupan.js'
import {
  ChipSla,
  JudulHalaman,
  KartuAngka,
  Kerangka,
  LencanaStatus,
  Panel,
  PesanGalat,
  tampilWaktu,
} from '../../components/instansi/ui.jsx'

const terakhir = (l) => l.supervisi?.at(-1)

function BarisArahan({ l, tampilkanCatatan = true }) {
  const s = terakhir(l)
  return (
    <li>
      <Link to={`/instansi/laporan/${l.kode}`} className="flex gap-3 px-4 py-3 hover:bg-paper sm:px-5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{l.judul}</p>
          <p className="text-xs text-ink-faint">
            {l.kode} · {lokasiPendek(wilayahById(l.wilayahId))}
          </p>
          {tampilkanCatatan && s && (
            <p className="mt-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-950">
              <b>{LABEL_TINGKAT[s.tingkat]}</b> · {tampilWaktu(s.waktu)}: {s.catatan}
              {l.supervisi.length > 1 && <span className="text-amber-800"> (+{l.supervisi.length - 1} lainnya)</span>}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <LencanaStatus status={l.status} label={LABEL_STATUS[l.status]} />
          <ChipSla sla={slaLaporan(l)} />
        </div>
      </Link>
    </li>
  )
}

export default function Supervisi() {
  const k = useCakupan()
  const { data, loading, error } = useApi(() => api.daftarLaporan({}), [])
  const semua = k.saring(data)
  const berarahan = semua
    .filter((l) => l.supervisi?.length)
    .sort((a, b) => Date.parse(terakhir(b).waktu) - Date.parse(terakhir(a).waktu))
  const totalArahan = berarahan.reduce((s, l) => s + l.supervisi.length, 0)

  if (k.menangani) {
    const terbuka = berarahan.filter((l) => STATUS_TERBUKA.includes(l.status))
    const selesai = berarahan.filter((l) => !STATUS_TERBUKA.includes(l.status))
    return (
      <div>
        <JudulHalaman
          judul="Arahan atasan"
          ikon={MessagesSquare}
          sub={`Catatan supervisi dari admin provinsi & pusat untuk laporan di ${k.namaCakupan}. Tindak lanjuti dari halaman laporan.`}
        />
        <PesanGalat galat={error} />
        <div className="mb-5 grid grid-cols-3 gap-3">
          <KartuAngka
            label="Perlu ditindaklanjuti"
            ikon={Inbox}
            nilai={terbuka.length}
            nada={terbuka.length ? 'waspada' : 'baik'}
            memuat={loading}
          />
          <KartuAngka label="Total arahan" ikon={MessagesSquare} nilai={totalArahan} memuat={loading} />
          <KartuAngka
            label="Sudah tertangani"
            ikon={ClipboardCheck}
            nilai={selesai.length}
            nada="baik"
            memuat={loading}
          />
        </div>
        <Panel judul={`Arahan untuk laporan terbuka (${terbuka.length})`} ikon={MessagesSquare} padat>
          {loading ? (
            <div className="p-5">
              <Kerangka />
            </div>
          ) : terbuka.length === 0 ? (
            <p className="p-5 text-sm text-ink-soft">Tidak ada arahan yang menunggu. Kerja bagus.</p>
          ) : (
            <ul className="divide-y divide-line">
              {terbuka.map((l) => (
                <BarisArahan key={l.kode} l={l} />
              ))}
            </ul>
          )}
        </Panel>
      </div>
    )
  }

  // Provinsi / pusat
  const perluArahan = urutkanAntrean(
    semua.filter((l) => STATUS_TERBUKA.includes(l.status) && slaLaporan(l).lewat && !l.supervisi?.length),
    'prioritas',
  )
  return (
    <div>
      <JudulHalaman
        judul={`Catatan supervisi · ${k.namaCakupan}`}
        ikon={ClipboardCheck}
        sub="Laporan lewat target yang belum diberi arahan, dan riwayat arahan yang sudah dikirim ke admin kab/kota."
      />
      <PesanGalat galat={error} />
      <div className="mb-5 grid grid-cols-3 gap-3">
        <KartuAngka
          label="Perlu arahan"
          ikon={TimerOff}
          nilai={perluArahan.length}
          nada={perluArahan.length ? 'bahaya' : 'baik'}
          ket="lewat target, belum diarahkan"
          memuat={loading}
        />
        <KartuAngka label="Arahan terkirim" ikon={Send} nilai={totalArahan} memuat={loading} />
        <KartuAngka
          label="Laporan diarahkan"
          ikon={MessagesSquare}
          nilai={berarahan.length}
          ket={`${berarahan.filter((l) => !STATUS_TERBUKA.includes(l.status)).length} sudah tertangani`}
          memuat={loading}
        />
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel
          judul={`Perlu arahan (${perluArahan.length})`}
          ikon={TimerOff}
          padat
          kanan={
            <Link to="/instansi/antrean?sla=lewat" className="text-xs font-semibold text-brand-700">
              Semua lewat target
            </Link>
          }
        >
          {loading ? (
            <div className="p-5">
              <Kerangka />
            </div>
          ) : perluArahan.length === 0 ? (
            <p className="p-5 text-sm text-ink-soft">Semua laporan lewat target sudah diberi arahan.</p>
          ) : (
            <ul className="divide-y divide-line">
              {perluArahan.slice(0, 12).map((l) => (
                <BarisArahan key={l.kode} l={l} tampilkanCatatan={false} />
              ))}
            </ul>
          )}
        </Panel>
        <Panel judul={`Riwayat arahan (${berarahan.length})`} ikon={MessagesSquare} padat>
          {loading ? (
            <div className="p-5">
              <Kerangka />
            </div>
          ) : berarahan.length === 0 ? (
            <p className="p-5 text-sm text-ink-soft">
              Belum ada arahan. Buka laporan dari daftar di samping, lalu kirim arahan.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {berarahan.slice(0, 20).map((l) => (
                <BarisArahan key={l.kode} l={l} />
              ))}
            </ul>
          )}
          <p className="flex items-center gap-1 border-t border-line px-5 py-2.5 text-xs text-ink-faint">
            <ArrowRight size={12} aria-hidden="true" /> Arahan tampil di meja kerja admin kab/kota terkait.
          </p>
        </Panel>
      </div>
    </div>
  )
}
