// TODO(Albert): implementasi dengan Supabase (@supabase/supabase-js), skema: apps/api/db/migrations/001_init.sql.
// Antarmuka ini KONTRAK. Route hanya boleh memanggil fungsi di bawah ini.

/** @returns {Promise<object[]>} semua laporan (entitas penuh, docs/DATA-MODEL.md) dengan filter opsional */
export async function semua(_filter = {}) {
  throw new Error('repositories/laporan.semua belum diimplementasikan')
}

/** @returns {Promise<object|null>} */
export async function cari(_kode) {
  throw new Error('repositories/laporan.cari belum diimplementasikan')
}

/** Simpan entitas penuh (insert atau update) secara atomik. @returns {Promise<object>} */
export async function simpan(_laporan) {
  throw new Error('repositories/laporan.simpan belum diimplementasikan')
}

/** Jumlah laporan oleh deviceId sejak awal hari (batas harian). @returns {Promise<number>} */
export async function hitungHariIni(_deviceId) {
  throw new Error('repositories/laporan.hitungHariIni belum diimplementasikan')
}
