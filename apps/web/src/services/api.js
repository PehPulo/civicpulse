// ┌──────────────────────────────────────────────────────────────────────────┐
// │  SATU-SATUNYA pintu data untuk UI (docs/FRONTEND.md § Aturan).             │
// │  Halaman & komponen DILARANG mengakses localStorage/fetch secara langsung. │
// └──────────────────────────────────────────────────────────────────────────┘
// Semua data SELALU lewat backend (apps/api) — tidak ada mode lokal. Alamat: services/server.js.
import { buatAdapterHttp } from './adapters/http.js'
import { URL_API } from './server.js'
import { deviceId, sesiInstansi, simpanSesiInstansi } from './identitas.js'
import { kompresFoto } from '../lib/foto.js'

const adapter = buatAdapterHttp(URL_API)

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
  /** Masuk dengan akun wilayah, mis. admin.kota-bandung. */
  async loginInstansi(username, password) {
    const sesi = await adapter.loginInstansi(username, password)
    simpanSesiInstansi(sesi)
    return berubah(sesi)
  },
  logoutInstansi: () => berubah(simpanSesiInstansi(null)),
  /** CCTV publik resmi di sekitar laporan (khusus petugas, dalam yurisdiksi; GET /cctv/laporan/:kode). */
  cctvLaporan: (kode) => adapter.cctvLaporan(kode, ctxInstansi()),
  /** Catatan supervisi admin provinsi/pusat (status tidak berubah). */
  supervisi: async (kode, catatan) => berubah(await adapter.supervisi(kode, catatan, ctxInstansi())),
  /** @param {{nama, unit, jabatan?}} profil  Server menerbitkan token baru berisi nama petugas yang baru. */
  async ubahProfil(profil) {
    const sesi = await adapter.ubahProfil(profil, ctxInstansi())
    simpanSesiInstansi(sesi)
    return berubah(sesi)
  },
  /** Ganti password akun sendiri. */
  ubahSandi: (lama, baru) => adapter.ubahSandi({ lama, baru }, ctxInstansi()),
  /** Admin bawahan (provinsi ⇒ kab/kota, pusat ⇒ provinsi; pusat bisa telusur {provinsiId}) + beban datanya. */
  daftarAdmin: (opsi) => adapter.daftarAdmin(opsi, ctxInstansi()),
  /** @param {{ke, catatan?, tanggapan?, bukti?: File}} perubahan  bukti = foto hasil kerja (dikompres, lalu diunggah). */
  async ubahStatus(kode, { bukti, ...perubahan }) {
    const buktiUrl = bukti ? await kompresFoto(bukti) : perubahan.buktiUrl
    return berubah(await adapter.ubahStatus(kode, { ...perubahan, buktiUrl }, ctxInstansi()))
  },
}
