// ┌──────────────────────────────────────────────────────────────────────────┐
// │  SATU-SATUNYA pintu data untuk UI (docs/FRONTEND.md § Aturan).             │
// │  Halaman & komponen DILARANG mengakses localStorage/fetch secara langsung. │
// └──────────────────────────────────────────────────────────────────────────┘
// Mode dipilih lewat env: VITE_API_URL kosong ⇒ adapter lokal, terisi ⇒ adapter HTTP.
import { adapterLokal } from './adapters/local.js'
import { buatAdapterHttp } from './adapters/http.js'
import { deviceId, sesiInstansi, simpanSesiInstansi } from './identitas.js'
import { kompresFoto } from '../lib/foto.js'

const URL_API = import.meta.env.VITE_API_URL?.trim()
const adapter = URL_API ? buatAdapterHttp(URL_API.replace(/\/$/, '')) : adapterLokal

// Event sederhana agar hook useApi memuat ulang data setelah ada perubahan.
const bus = new EventTarget()
export const onBerubah = (fn) => {
  bus.addEventListener('berubah', fn)
  return () => bus.removeEventListener('berubah', fn)
}
const berubah = (hasil) => {
  bus.dispatchEvent(new Event('berubah'))
  return hasil
}

const ctxWarga = () => ({ deviceId: deviceId() })
const ctxInstansi = () => ({ deviceId: deviceId(), token: sesiInstansi()?.token })

export const api = {
  mode: adapter.mode,
  deviceId,

  health: () => adapter.health(),
  daftarWilayah: () => adapter.daftarWilayah(),
  daftarLaporan: (filter) => adapter.daftarLaporan(filter, ctxWarga()),
  getLaporan: (kode) => adapter.getLaporan(kode, ctxWarga()),
  statistik: () => adapter.statistik(),

  /** @param {{kategoriId, lat, lng, judul?, deskripsi, foto?: File, ai?}} input */
  async buatLaporan({ foto, ...input }) {
    const fotoUrl = foto ? await kompresFoto(foto) : null
    return berubah(await adapter.buatLaporan({ ...input, fotoUrl }, ctxWarga()))
  },

  dukung: async (kode) => berubah(await adapter.dukung(kode, ctxWarga())),

  /** @param {{beres: boolean, foto?: File, lat, lng, waktuFoto, ai?}} data */
  async kirimVerifikasi(kode, { foto, ...data }) {
    const fotoUrl = foto ? await kompresFoto(foto) : null
    return berubah(await adapter.kirimVerifikasi(kode, { ...data, fotoUrl }, ctxWarga()))
  },

  // ── Instansi ──
  sesiInstansi,
  /** @param {{tingkat?: 'kabkota'|'provinsi'|'pusat', provinsiId?, kabkotaId?}} opsi */
  async loginInstansi(pin, opsi) {
    const sesi = await adapter.loginInstansi(pin, opsi)
    simpanSesiInstansi(sesi)
    return berubah(sesi)
  },
  logoutInstansi: () => berubah(simpanSesiInstansi(null)),
  /** Catatan supervisi admin provinsi/pusat (status tidak berubah). */
  supervisi: async (kode, catatan) => berubah(await adapter.supervisi(kode, catatan, ctxInstansi())),
  /** @param {{nama, unit, jabatan?}} profil  Server menerbitkan token baru berisi nama petugas yang baru. */
  async ubahProfil(profil) {
    const sesi = await adapter.ubahProfil(profil, ctxInstansi())
    simpanSesiInstansi(sesi)
    return berubah(sesi)
  },
  /** @param {{ke, catatan?, tanggapan?, bukti?: File}} perubahan  bukti = foto hasil kerja (dikompres, lalu diunggah). */
  async ubahStatus(kode, { bukti, ...perubahan }) {
    const buktiUrl = bukti ? await kompresFoto(bukti) : perubahan.buktiUrl
    return berubah(await adapter.ubahStatus(kode, { ...perubahan, buktiUrl }, ctxInstansi()))
  },

  reset: async () => berubah(await adapter.reset()),
}
