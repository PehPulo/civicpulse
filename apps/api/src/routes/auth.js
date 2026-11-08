// POST /auth/instansi   body: { pin, tingkat?: 'kabkota'|'provinsi'|'pusat', provinsiId?, kabkotaId? }
//   ⇒ JWT 8 jam berisi tingkat & yurisdiksi. Tanpa tingkat ⇒ admin kab/kota Kota Bandung (kompatibel lama).
// POST /auth/profil     (Bearer instansi) ubah nama/unit/jabatan ⇒ token baru; tingkat, wilayah & masa berlaku TETAP.
// Keamanan: PIN per tingkat dibandingkan waktu-konstan, percobaan dibatasi per IP (anti tebak PIN), body maks 1 KB.
// Catatan demo: satu PIN per tingkat untuk semua wilayah; produksi memakai akun per instansi (docs/USERS.md).
import { createHash, timingSafeEqual } from 'node:crypto'
import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { sign } from 'hono/jwt'
import { GalatDomain, KODE_GALAT, TINGKAT, validasiAkses, validasiProfilPetugas } from '@civicpulse/core'
import { config } from '../config.js'
import { buatBatasLaju } from '../ai/penjaga.js'
import { ipKlien } from '../lib/ip.js'
import { NASIONAL } from '../lib/wilayah.js'
import { wajibInstansi } from '../middleware/identitas.js'

const sidik = (s) => createHash('sha256').update(String(s)).digest()
const PIN = () => ({
  [TINGKAT.KABKOTA]: config.instansiPin,
  [TINGKAT.PROVINSI]: config.pinProvinsi,
  [TINGKAT.PUSAT]: config.pinPusat,
})
const pinCocok = (pin, tingkat) =>
  typeof pin === 'string' && Boolean(PIN()[tingkat]) && timingSafeEqual(sidik(pin), sidik(PIN()[tingkat]))

const namaWilayah = (akses) =>
  akses.tingkat === TINGKAT.PUSAT
    ? 'Indonesia'
    : akses.tingkat === TINGKAT.PROVINSI
      ? NASIONAL.provinsi.find((p) => p.id === akses.provinsiId)?.nama
      : NASIONAL.kabkota.find((k) => k.id === akses.kabkotaId)?.nama

const petugasBawaan = (akses) =>
  ({
    [TINGKAT.KABKOTA]: `Petugas Demo · Dinas PU ${namaWilayah(akses)}`,
    [TINGKAT.PROVINSI]: `Koordinator Demo · Provinsi ${namaWilayah(akses)}`,
    [TINGKAT.PUSAT]: 'Admin Demo · Pemantau Nasional',
  })[akses.tingkat]

const batas1Kb = bodyLimit({
  maxSize: 1024,
  onError: () => {
    throw new GalatDomain(KODE_GALAT.VALIDASI, 'Permintaan terlalu besar.')
  },
})

export function buatRuteAuth({ batas = config.batasLoginPer15Menit } = {}) {
  const boleh = buatBatasLaju({ maks: batas, jendelaMs: 15 * 60_000 })
  const bolehProfil = buatBatasLaju({ maks: 10, jendelaMs: 60_000 })

  const terbitkan = async (akses, petugas, jabatan, exp) => {
    const payload = { peran: 'instansi', ...akses, wilayahNama: namaWilayah(akses), petugas, jabatan, exp }
    const token = await sign(payload, config.jwtSecret, 'HS256')
    return { token, petugas, jabatan, ...akses, wilayahNama: payload.wilayahNama }
  }

  return new Hono()
    .post('/instansi', batas1Kb, async (c) => {
      if (!boleh(ipKlien(c)))
        throw new GalatDomain(KODE_GALAT.BATAS_HARIAN, 'Terlalu banyak percobaan PIN. Coba lagi 15 menit lagi.')
      const body = await c.req.json().catch(() => ({}))
      const tingkat = body?.tingkat ?? TINGKAT.KABKOTA
      // PIN dicek dulu (sebelum validasi wilayah) agar respons tidak membocorkan wilayah mana yang sah.
      if (!pinCocok(body?.pin, tingkat)) throw new GalatDomain(KODE_GALAT.TIDAK_BERWENANG, 'PIN instansi salah.')
      const akses = validasiAkses(
        {
          tingkat,
          provinsiId: body?.provinsiId,
          kabkotaId: tingkat === TINGKAT.KABKOTA ? (body?.kabkotaId ?? 'kota-bandung') : body?.kabkotaId,
        },
        NASIONAL,
      )
      const exp = Math.floor(Date.now() / 1000) + 8 * 60 * 60
      return c.json({ data: await terbitkan(akses, petugasBawaan(akses), '', exp) })
    })
    .post('/profil', wajibInstansi, batas1Kb, async (c) => {
      if (!bolehProfil(ipKlien(c)))
        throw new GalatDomain(KODE_GALAT.BATAS_HARIAN, 'Terlalu sering mengubah profil. Coba lagi sebentar.')
      const profil = validasiProfilPetugas(await c.req.json().catch(() => ({})))
      const lama = c.get('instansi')
      return c.json({ data: await terbitkan(c.get('akses'), profil.petugas, profil.jabatan, lama.exp) })
    })
}

export const auth = buatRuteAuth()
