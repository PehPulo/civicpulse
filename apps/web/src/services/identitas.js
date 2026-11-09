// Identitas anonim warga (docs/USERS.md § Warga): UUID per perangkat, tanpa login & tanpa NIK.
const KUNCI_DEVICE = 'civicpulse:device'
const KUNCI_SESI = 'civicpulse:sesi-instansi'

let cadangan = null

export function deviceId() {
  try {
    let id = localStorage.getItem(KUNCI_DEVICE)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(KUNCI_DEVICE, id)
    }
    return id
  } catch {
    cadangan ??= crypto.randomUUID()
    return cadangan
  }
}

export function sesiInstansi() {
  try {
    return JSON.parse(sessionStorage.getItem(KUNCI_SESI) || 'null')
  } catch {
    return null
  }
}

export function simpanSesiInstansi(sesi) {
  try {
    if (sesi) sessionStorage.setItem(KUNCI_SESI, JSON.stringify(sesi))
    else sessionStorage.removeItem(KUNCI_SESI)
  } catch {
    // sesi hanya bertahan di memori
  }
}

export const EVENT_SESI_HABIS = 'civicpulse:sesi-habis'

/** Server menolak token (401: kedaluwarsa / server diganti rahasianya) ⇒ hapus sesi, penjaga rute arahkan ke login. */
export function sesiHabis() {
  if (!sesiInstansi()) return
  simpanSesiInstansi(null)
  window.dispatchEvent(new Event(EVENT_SESI_HABIS))
}
