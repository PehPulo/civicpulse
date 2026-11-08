// POST /auth/instansi
// docs/API.md & docs/USERS.md: Verifikasi PIN instansi, terbitkan JWT 8 jam.
// Keamanan: PIN dibandingkan waktu-konstan, percobaan dibatasi per IP (anti tebak PIN), body maks 1 KB.
// POST /auth/profil (Bearer instansi): ubah nama/unit/jabatan ⇒ token baru (sisa masa berlaku token lama dipertahankan).
import { createHash, timingSafeEqual } from 'node:crypto'
import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { sign } from 'hono/jwt'
import { GalatDomain, KODE_GALAT, validasiProfilPetugas } from '@civicpulse/core'
import { config } from '../config.js'
import { buatBatasLaju } from '../ai/penjaga.js'
import { ipKlien } from '../lib/ip.js'
import { wajibInstansi } from '../middleware/identitas.js'

const sidik = (s) => createHash('sha256').update(String(s)).digest()
const pinCocok = (pin) => typeof pin === 'string' && timingSafeEqual(sidik(pin), sidik(config.instansiPin))

export function buatRuteAuth({ batas = config.batasLoginPer15Menit } = {}) {
  const boleh = buatBatasLaju({ maks: batas, jendelaMs: 15 * 60_000 })

  const bolehProfil = buatBatasLaju({ maks: 10, jendelaMs: 60_000 })
  const batas1Kb = bodyLimit({
    maxSize: 1024,
    onError: () => {
      throw new GalatDomain(KODE_GALAT.VALIDASI, 'Permintaan terlalu besar.')
    },
  })

  return new Hono()
    .post('/profil', wajibInstansi, batas1Kb, async (c) => {
      if (!bolehProfil(ipKlien(c)))
        throw new GalatDomain(KODE_GALAT.BATAS_HARIAN, 'Terlalu sering mengubah profil. Coba lagi sebentar.')
      const profil = validasiProfilPetugas(await c.req.json().catch(() => ({})))
      const lama = c.get('instansi')
      const payload = { peran: 'instansi', petugas: profil.petugas, jabatan: profil.jabatan, exp: lama.exp }
      const token = await sign(payload, config.jwtSecret, 'HS256')
      return c.json({ data: { token, petugas: profil.petugas, jabatan: profil.jabatan } })
    })
    .post(
      '/instansi',
      bodyLimit({
        maxSize: 1024,
        onError: () => {
          throw new GalatDomain(KODE_GALAT.VALIDASI, 'Permintaan terlalu besar.')
        },
      }),
      async (c) => {
        if (!boleh(ipKlien(c)))
          throw new GalatDomain(KODE_GALAT.BATAS_HARIAN, 'Terlalu banyak percobaan PIN. Coba lagi 15 menit lagi.')

        const body = await c.req.json().catch(() => ({}))
        if (!pinCocok(body?.pin)) throw new GalatDomain(KODE_GALAT.TIDAK_BERWENANG, 'PIN instansi salah.')

        const payload = {
          peran: 'instansi',
          petugas: 'Petugas Demo · Dinas PUTR',
          exp: Math.floor(Date.now() / 1000) + 8 * 60 * 60, // 8 jam
        }
        const token = await sign(payload, config.jwtSecret, 'HS256')
        return c.json({ data: { token, petugas: payload.petugas } })
      },
    )
}

export const auth = buatRuteAuth()
