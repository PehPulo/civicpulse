// Repositori Laporan: satu-satunya lapisan yang mengakses penyimpanan data.
// Menggunakan Atomic Upsert & relasi idempotent untuk menjamin konsistensi data.
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { config } from '../config.js'

let memori = []

export function _resetMemori(laporanAwal = []) {
  memori = structuredClone(laporanAwal)
}

// ── Database berkas (DATA_FILE) untuk server tanpa Supabase, mis. Jetson ──
// Semua laporan disimpan sebagai satu berkas JSON. Penulisan atomik (tulis berkas sementara lalu rename) dan
// ditunda sebentar agar banyak perubahan beruntun cukup ditulis sekali. Hanya akun pemilik yang bisa membaca (0600).
let tundaTulis = null

/** Muat laporan dari DATA_FILE. @returns {number|null} jumlah laporan, atau null bila berkas belum ada. */
export function muatDariBerkas(berkas = config.dataFile) {
  if (!berkas || !existsSync(berkas)) return null
  const isi = JSON.parse(readFileSync(berkas, 'utf-8'))
  memori = Array.isArray(isi.laporan) ? isi.laporan : []
  return memori.length
}

/** Tulis seluruh laporan ke DATA_FILE sekarang juga. */
export function tulisKeBerkas(berkas = config.dataFile) {
  if (!berkas) return
  clearTimeout(tundaTulis)
  tundaTulis = null
  mkdirSync(dirname(berkas), { recursive: true })
  const sementara = `${berkas}.tmp`
  writeFileSync(sementara, JSON.stringify({ versi: 1, disimpan: new Date().toISOString(), laporan: memori }), {
    mode: 0o600,
  })
  renameSync(sementara, berkas)
}

function jadwalkanTulis() {
  if (!config.dataFile || tundaTulis) return
  tundaTulis = setTimeout(() => {
    try {
      tulisKeBerkas()
    } catch (e) {
      console.error('Gagal menyimpan DATA_FILE:', e.message)
    }
  }, 300)
}

function gunakanSupabase() {
  return Boolean(config.supabaseUrl && config.supabaseServiceKey)
}

async function getSupabaseClient() {
  const { createClient } = await import('@supabase/supabase-js')
  return createClient(config.supabaseUrl, config.supabaseServiceKey)
}

/**
 * Mengambil semua laporan (entitas penuh) dengan filter opsional.
 * @param {{ kategoriId?: string, status?: string, wilayahId?: string }} filter
 * @returns {Promise<object[]>}
 */
export async function semua(filter = {}) {
  if (gunakanSupabase()) {
    const supabase = await getSupabaseClient()
    let q = supabase
      .from('laporan')
      .select('*, riwayat:status_event(*), dukungan:dukungan(device_id), verifikasi:verifikasi(*)')
      .order('dibuat', { ascending: false })

    if (filter.kategoriId) q = q.eq('kategori_id', filter.kategoriId)
    if (filter.status) q = q.eq('status', filter.status)
    if (filter.wilayahId) q = q.eq('wilayah_id', filter.wilayahId)

    const { data, error } = await q
    if (error) throw error

    return data.map(petakanDariSql)
  }

  return structuredClone(
    memori
      .filter((l) => {
        if (filter.kategoriId && l.kategoriId !== filter.kategoriId) return false
        if (filter.status && l.status !== filter.status) return false
        if (filter.wilayahId && l.wilayahId !== filter.wilayahId) return false
        return true
      })
      .sort((a, b) => Date.parse(b.dibuat) - Date.parse(a.dibuat)),
  )
}

/**
 * Mengambil satu laporan berdasarkan kode lacak (case-insensitive).
 * @param {string} kode
 * @returns {Promise<object|null>}
 */
export async function cari(kode) {
  if (gunakanSupabase()) {
    const supabase = await getSupabaseClient()
    const { data, error } = await supabase
      .from('laporan')
      .select('*, riwayat:status_event(*), dukungan:dukungan(device_id), verifikasi:verifikasi(*)')
      .ilike('kode', kode)
      .maybeSingle()

    if (error) throw error
    if (!data) return null
    return petakanDariSql(data)
  }

  const l = memori.find((x) => x.kode.toUpperCase() === String(kode).toUpperCase())
  return l ? structuredClone(l) : null
}

/**
 * Simpan entitas penuh laporan (insert atau update) secara atomik.
 * @param {object} laporan
 * @returns {Promise<object>}
 */
export async function simpan(laporan) {
  if (gunakanSupabase()) {
    const supabase = await getSupabaseClient()

    // 1. Simpan/perbarui tabel laporan utama secara atomik (upsert)
    const barisLaporan = {
      kode: laporan.kode,
      kategori_id: laporan.kategoriId,
      wilayah_id: laporan.wilayahId,
      lat: laporan.lat,
      lng: laporan.lng,
      judul: laporan.judul,
      deskripsi: laporan.deskripsi,
      foto_url: laporan.fotoUrl ?? null,
      pelapor_id: laporan.pelaporId,
      dibuat: laporan.dibuat,
      status: laporan.status,
      prioritas: laporan.prioritas,
      ai: laporan.ai ?? null,
      tanggapan: laporan.tanggapan ?? null,
    }

    const { error: errLaporan } = await supabase.from('laporan').upsert(barisLaporan, { onConflict: 'kode' })
    if (errLaporan) throw errLaporan

    // 2. Simpan riwayat (status_event)
    if (laporan.riwayat?.length) {
      await supabase.from('status_event').delete().eq('laporan_kode', laporan.kode)
      const barisRiwayat = laporan.riwayat.map((e) => ({
        laporan_kode: laporan.kode,
        status: e.status,
        waktu: e.waktu,
        oleh: e.oleh,
        catatan: e.catatan ?? null,
        bukti_url: e.buktiUrl ?? null,
      }))
      const { error: errRiwayat } = await supabase.from('status_event').insert(barisRiwayat)
      if (errRiwayat) throw errRiwayat
    }

    // 3. Simpan dukungan secara idempotent via onConflict
    if (laporan.dukungan?.length) {
      const barisDukungan = [...new Set(laporan.dukungan)].map((deviceId) => ({
        laporan_kode: laporan.kode,
        device_id: deviceId,
      }))
      const { error: errDukungan } = await supabase
        .from('dukungan')
        .upsert(barisDukungan, { onConflict: 'laporan_kode,device_id', ignoreDuplicates: true })
      if (errDukungan) throw errDukungan
    }

    // 4. Simpan verifikasi
    if (laporan.verifikasi?.length) {
      await supabase.from('verifikasi').delete().eq('laporan_kode', laporan.kode)
      const barisVerifikasi = laporan.verifikasi.map((v) => ({
        laporan_kode: laporan.kode,
        device_id: v.deviceId,
        beres: v.beres,
        foto_url: v.fotoUrl ?? null,
        lat: v.lat ?? null,
        lng: v.lng ?? null,
        waktu: v.waktu,
        waktu_foto: v.waktuFoto ?? null,
        sah: v.sah,
        cek: v.cek,
        ai: v.ai ?? null,
      }))
      const { error: errVerifikasi } = await supabase.from('verifikasi').insert(barisVerifikasi)
      if (errVerifikasi) throw errVerifikasi
    }

    return structuredClone(laporan)
  }

  const idx = memori.findIndex((x) => x.kode === laporan.kode)
  if (idx >= 0) {
    memori[idx] = structuredClone(laporan)
  } else {
    memori.unshift(structuredClone(laporan))
  }
  jadwalkanTulis()
  return structuredClone(laporan)
}

/**
 * Menghitung berapa laporan dibuat oleh deviceId sejak awal hari ini.
 * @param {string} deviceId
 * @returns {Promise<number>}
 */
export async function hitungHariIni(deviceId) {
  const awalHari = new Date()
  awalHari.setHours(0, 0, 0, 0)
  const awalHariIso = awalHari.toISOString()

  if (gunakanSupabase()) {
    const supabase = await getSupabaseClient()
    const { count, error } = await supabase
      .from('laporan')
      .select('*', { count: 'exact', head: true })
      .eq('pelapor_id', deviceId)
      .gte('dibuat', awalHariIso)

    if (error) throw error
    return count ?? 0
  }

  return memori.filter((l) => l.pelaporId === deviceId && Date.parse(l.dibuat) >= awalHari.getTime()).length
}

function petakanDariSql(baris) {
  return {
    kode: baris.kode,
    kategoriId: baris.kategori_id,
    wilayahId: baris.wilayah_id,
    lat: baris.lat,
    lng: baris.lng,
    judul: baris.judul,
    deskripsi: baris.deskripsi,
    fotoUrl: baris.foto_url,
    pelaporId: baris.pelapor_id,
    dibuat: baris.dibuat,
    status: baris.status,
    prioritas: baris.prioritas,
    ai: baris.ai,
    tanggapan: baris.tanggapan,
    riwayat: (baris.riwayat ?? [])
      .sort((a, b) => Date.parse(a.waktu) - Date.parse(b.waktu))
      .map((e) => ({
        status: e.status,
        waktu: e.waktu,
        oleh: e.oleh,
        catatan: e.catatan ?? '',
        buktiUrl: e.bukti_url ?? null,
      })),
    dukungan: (baris.dukungan ?? []).map((d) => d.device_id),
    verifikasi: (baris.verifikasi ?? [])
      .sort((a, b) => Date.parse(a.waktu) - Date.parse(b.waktu))
      .map((v) => ({
        deviceId: v.device_id,
        beres: v.beres,
        fotoUrl: v.foto_url,
        lat: v.lat,
        lng: v.lng,
        waktu: v.waktu,
        waktuFoto: v.waktu_foto,
        sah: v.sah,
        cek: v.cek,
        ai: v.ai,
      })),
  }
}
