// POST /auth/instansi   body: { username, password } ⇒ JWT 8 jam berisi username, tingkat & yurisdiksi akun.
//   Akun per wilayah: admin.pusat · admin.<provinsi> (mis. admin.jawa-barat) · admin.<kabkota> (mis. admin.kota-bandung).
// POST /auth/profil     (Bearer instansi) ubah nama/unit/jabatan ⇒ disimpan di akun + token baru (masa berlaku TETAP).
// POST /auth/sandi      (Bearer instansi) body: { lama, baru } ⇒ ganti password akun sendiri.
// GET  /auth/admin      (Bearer provinsi/pusat) daftar admin bawahan + beban data wilayahnya.
//   Pusat ⇒ admin provinsi (atau admin kab/kota satu provinsi dengan ?provinsiId=). Provinsi ⇒ admin kab/kota-nya.
// Keamanan: password scrypt + perbandingan waktu-konstan (repositories/akun.js), percobaan login dibatasi per IP,
// pesan galat yang sama untuk username/password salah, body maks 1 KB.
import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { sign } from 'hono/jwt'
import {
  GalatDomain,
  KODE_GALAT,
  TINGKAT,
  adminBawahan,
  agregatWilayah,
  aksesAkun,
  dalamAkses,
  namaPetugasAkun,
  profilPublik,
  rapikanUsername,
  skorKinerjaWilayah,
  validasiProfilPetugas,
  validasiSandiBaru,
} from '@civicpulse/core'
import { config } from '../config.js'
import { buatBatasLaju } from '../ai/penjaga.js'
import { ipKlien } from '../lib/ip.js'
import { INDEKS_WILAYAH } from '../lib/wilayah.js'
import { wajibInstansi } from '../middleware/identitas.js'
import * as repoAkunAsli from '../repositories/akun.js'
import * as repoLaporanAsli from '../repositories/laporan.js'

const batas1Kb = bodyLimit({
  maxSize: 1024,
  onError: () => {
    throw new GalatDomain(KODE_GALAT.VALIDASI, 'Permintaan terlalu besar.')
  },
})

export function buatRuteAuth({
  batas = config.batasLoginPer15Menit,
  repoAkun = repoAkunAsli,
  repoLaporan = repoLaporanAsli,
} = {}) {
  const boleh = buatBatasLaju({ maks: batas, jendelaMs: 15 * 60_000 })
  const bolehProfil = buatBatasLaju({ maks: 10, jendelaMs: 60_000 })

  const terbitkan = async (a, exp) => {
    const akses = aksesAkun(a)
    const petugas = namaPetugasAkun(a)
    const payload = {
      peran: 'instansi',
      username: a.username,
      ...akses,
      wilayahNama: a.wilayahNama,
      petugas,
      jabatan: a.jabatan ?? '',
      exp,
    }
    const token = await sign(payload, config.jwtSecret, 'HS256')
    return {
      token,
      username: a.username,
      petugas,
      nama: a.nama,
      unit: a.unit,
      jabatan: a.jabatan ?? '',
      ...akses,
      wilayahNama: a.wilayahNama,
      sandiDiganti: Boolean(a.sandiDiganti),
    }
  }

  /** Akun milik token. Token lama (sistem PIN) tanpa username ⇒ diminta masuk ulang. */
  const akunToken = async (c) => {
    const a = await repoAkun.cari(c.get('instansi')?.username)
    if (!a) throw new GalatDomain(KODE_GALAT.TIDAK_BERWENANG, 'Sesi lama tidak berlaku lagi. Silakan masuk ulang.')
    return a
  }

  return new Hono()
    .post('/instansi', batas1Kb, async (c) => {
      if (!boleh(ipKlien(c)))
        throw new GalatDomain(KODE_GALAT.BATAS_HARIAN, 'Terlalu banyak percobaan masuk. Coba lagi 15 menit lagi.')
      const body = await c.req.json().catch(() => ({}))
      const a = await repoAkun.periksa(rapikanUsername(body?.username), body?.password)
      if (!a) throw new GalatDomain(KODE_GALAT.TIDAK_BERWENANG, 'Username atau password salah.')
      await repoAkun.catatMasuk(a.username)
      const exp = Math.floor(Date.now() / 1000) + 8 * 60 * 60
      return c.json({ data: await terbitkan(a, exp) })
    })
    .post('/profil', wajibInstansi, batas1Kb, async (c) => {
      if (!bolehProfil(ipKlien(c)))
        throw new GalatDomain(KODE_GALAT.BATAS_HARIAN, 'Terlalu sering mengubah profil. Coba lagi sebentar.')
      const profil = validasiProfilPetugas(await c.req.json().catch(() => ({})))
      const a = await akunToken(c)
      const baru = await repoAkun.simpanProfil(a.username, profil)
      return c.json({ data: await terbitkan(baru, c.get('instansi').exp) })
    })
    .post('/sandi', wajibInstansi, batas1Kb, async (c) => {
      if (!boleh(ipKlien(c)))
        throw new GalatDomain(KODE_GALAT.BATAS_HARIAN, 'Terlalu banyak percobaan. Coba lagi 15 menit lagi.')
      const body = await c.req.json().catch(() => ({}))
      const a = await akunToken(c)
      if (!(await repoAkun.periksa(a.username, body?.lama)))
        throw new GalatDomain(KODE_GALAT.TIDAK_BERWENANG, 'Password lama salah.')
      await repoAkun.gantiSandi(a.username, validasiSandiBaru(body?.baru, body?.lama))
      return c.json({ data: { berhasil: true } })
    })
    .get('/admin', wajibInstansi, async (c) => {
      const akses = c.get('akses')
      const pv = c.req.query('provinsiId')
      // Pusat boleh menelusuri admin kab/kota satu provinsi; provinsi selalu terkunci ke provinsinya.
      const lihat =
        akses.tingkat === TINGKAT.PUSAT && pv && /^[a-z0-9-]{2,60}$/.test(pv)
          ? { tingkat: TINGKAT.PROVINSI, provinsiId: pv, kabkotaId: null }
          : akses
      const daftar = adminBawahan(await repoAkun.semua(), lihat)
      const kunci = lihat.tingkat === TINGKAT.PUSAT ? 'provinsiId' : 'kabkotaId'
      const laporan = (await repoLaporan.semua()).filter((l) => dalamAkses(l, lihat, INDEKS_WILAYAH))
      const ag = agregatWilayah(laporan, kunci, INDEKS_WILAYAH)
      const data = daftar.map((a) => {
        const g = ag.get(a[kunci]) ?? { total: 0, terbuka: 0, lewatSla: 0, persenTepat: null }
        return {
          ...a,
          beban: {
            total: g.total,
            terbuka: g.terbuka,
            lewatSla: g.lewatSla,
            persenTepat: g.persenTepat ?? null,
            skor: skorKinerjaWilayah(g),
          },
        }
      })
      return c.json({ data })
    })
    .get('/saya', wajibInstansi, async (c) => c.json({ data: profilPublik(await akunToken(c)) }))
}

export const auth = buatRuteAuth()
