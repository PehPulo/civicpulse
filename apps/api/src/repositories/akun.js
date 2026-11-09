// PEMILIK: Ezra · Ditinjau: Albert · KONTRAK: docs/USERS.md § Akun instansi
// Repositori akun admin instansi (username + password). Password di-hash scrypt (salt acak per akun);
// akun yang belum mengganti password memakai password demo dari env (INSTANSI_SANDI_DEMO).
//
// Catatan: disimpan di memori proses (seperti mode memori laporan). Profil & password yang diganti hilang saat
// server restart, dan di Vercel tiap instance punya salinan sendiri. Tabel Supabase `akun_instansi` = langkah
// berikutnya (Albert) dengan antarmuka yang sama: cari, semua, catatMasuk, simpanProfil, gantiSandi.
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { akunDemo } from '@civicpulse/core'
import { config } from '../config.js'
import { NASIONAL } from '../lib/wilayah.js'

const scrypt = promisify(scryptCb)
const PANJANG = 32

let akun = new Map()
let demo = null // { salt, hash } password demo, dihitung sekali

const hashSandi = async (sandi, salt) => scrypt(String(sandi).normalize('NFKC'), salt, PANJANG)

async function hashDemo() {
  if (!demo) {
    const salt = randomBytes(16)
    demo = { salt, hash: await hashSandi(config.sandiDemo, salt) }
  }
  return demo
}

/** Isi ulang dari data demo (dipakai saat server menyala & di tes). */
export function _reset(sandiDemo) {
  akun = new Map(akunDemo(NASIONAL).map((a) => [a.username, { ...a }]))
  demo = null
  if (sandiDemo !== undefined) config.sandiDemo = sandiDemo
}
_reset()

export const cari = async (username) => akun.get(username) ?? null
export const semua = async () => [...akun.values()]

/**
 * Periksa username + password. Selalu menghitung scrypt (juga bila username tidak ada) agar waktu respons tidak
 * membocorkan username mana yang terdaftar.
 * @returns {Promise<object|null>} akun bila cocok
 */
export async function periksa(username, sandi) {
  const a = username ? akun.get(username) : null
  const ref = a?.hash ? { salt: a.salt, hash: a.hash } : await hashDemo()
  const coba = await hashSandi(typeof sandi === 'string' ? sandi : '', ref.salt)
  const cocok = timingSafeEqual(coba, ref.hash)
  return a && cocok && typeof sandi === 'string' ? a : null
}

export async function catatMasuk(username, waktu = new Date().toISOString()) {
  const a = akun.get(username)
  if (a) a.terakhirMasuk = waktu
}

export async function simpanProfil(username, { nama, unit, jabatan }) {
  const a = akun.get(username)
  if (a) Object.assign(a, { nama, unit, jabatan })
  return a
}

export async function gantiSandi(username, sandiBaru) {
  const a = akun.get(username)
  if (!a) return null
  const salt = randomBytes(16)
  Object.assign(a, { salt, hash: await hashSandi(sandiBaru, salt), sandiDiganti: true })
  return a
}
