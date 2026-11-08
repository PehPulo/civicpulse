// PEMILIK: Ezra · KONTRAK: docs/USERS.md § Tingkat admin
// Konteks yurisdiksi admin (dari sesi login) + cakupan tampilan yang dipilih di sidebar (provinsi → kab/kota).
// Cakupan hanya bisa MEMPERSEMPIT yurisdiksi, tidak memperluas. Server tetap menegakkan aksesnya sendiri.
import { createContext, useContext } from 'react'
import { LABEL_TINGKAT, TINGKAT, bolehSupervisi, bolehUbahStatus, dalamAkses } from '@civicpulse/core'
import { INDEKS_WILAYAH, kabkotaById, provinsiById } from '../../lib/peta.js'

/** Sesi lama tanpa tingkat ⇒ admin kab/kota Kota Bandung (sama dengan server). */
export function aksesDariSesi(sesi) {
  const tingkat = sesi?.tingkat ?? TINGKAT.KABKOTA
  if (tingkat === TINGKAT.PUSAT) return { tingkat, provinsiId: null, kabkotaId: null }
  if (tingkat === TINGKAT.PROVINSI) return { tingkat, provinsiId: sesi.provinsiId, kabkotaId: null }
  return {
    tingkat,
    provinsiId: sesi?.provinsiId ?? 'jawa-barat',
    kabkotaId: sesi?.kabkotaId ?? 'kota-bandung',
  }
}

/** Akses efektif = yurisdiksi dipersempit cakupan pilihan. */
export function aksesEfektif(akses, cakupan) {
  if (akses.tingkat === TINGKAT.KABKOTA) return akses
  const kk = cakupan?.kabkotaId && kabkotaById(cakupan.kabkotaId)
  if (kk && (akses.tingkat === TINGKAT.PUSAT || kk.provinsiId === akses.provinsiId))
    return { tingkat: TINGKAT.KABKOTA, provinsiId: kk.provinsiId, kabkotaId: kk.id }
  const pv = akses.tingkat === TINGKAT.PUSAT ? cakupan?.provinsiId : akses.provinsiId
  if (pv && provinsiById(pv)) return { tingkat: TINGKAT.PROVINSI, provinsiId: pv, kabkotaId: null }
  return akses
}

export function namaCakupan(a) {
  if (a.tingkat === TINGKAT.KABKOTA) return kabkotaById(a.kabkotaId)?.nama ?? a.kabkotaId
  if (a.tingkat === TINGKAT.PROVINSI) return `Provinsi ${provinsiById(a.provinsiId)?.nama ?? a.provinsiId}`
  return 'Seluruh Indonesia'
}

/** Nilai konteks lengkap untuk halaman panel. */
export function buatKonteks(sesi, cakupan, setCakupan) {
  const akses = aksesDariSesi(sesi)
  const efektif = aksesEfektif(akses, cakupan)
  return {
    akses,
    efektif,
    cakupan,
    setCakupan,
    tingkat: akses.tingkat,
    labelTingkat: LABEL_TINGKAT[akses.tingkat],
    namaYurisdiksi: namaCakupan(akses),
    namaCakupan: namaCakupan(efektif),
    menangani: bolehUbahStatus(akses),
    mengawasi: bolehSupervisi(akses),
    /** Laporan dalam cakupan efektif. */
    saring: (daftar) => (daftar ?? []).filter((l) => dalamAkses(l, efektif, INDEKS_WILAYAH)),
    /** Laporan dalam yurisdiksi (tanpa mempedulikan cakupan) — untuk izin & notifikasi. */
    dalamYurisdiksi: (l) => dalamAkses(l, akses, INDEKS_WILAYAH),
  }
}

export const KonteksCakupan = createContext(null)

/** Di luar LayoutInstansi (mis. tes) ⇒ konteks dari sesi tanpa cakupan. */
export function useCakupan() {
  return useContext(KonteksCakupan) ?? buatKonteks(null, {}, () => {})
}
