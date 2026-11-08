// PEMILIK: Ezra (AI) · Ditinjau: Albert
// Penjaga biaya LLM: batas per IP, plafon token harian, cache bersama, dan penggabungan permintaan kembar.
// Tujuan: bot/iseng yang menembak endpoint ribuan kali tetap hanya memicu sedikit panggilan ke Groq.
//
// Catatan: disimpan di memori proses. Di Vercel tiap instance punya memori sendiri, jadi batas berlaku per
// instance; tetap aman karena kuota gratis Groq (tanpa kartu kredit) adalah pagar terakhir yang tidak bisa
// menimbulkan tagihan.

const MENIT = 60_000

/** Batas laju sederhana (jendela geser) per kunci, mis. per IP. */
export function buatBatasLaju({ maks, jendelaMs = MENIT, maksKunci = 10_000 }) {
  const catatan = new Map()
  return function boleh(kunci, sekarang = Date.now()) {
    const awal = sekarang - jendelaMs
    const jejak = (catatan.get(kunci) ?? []).filter((t) => t > awal)
    if (jejak.length >= maks) {
      catatan.set(kunci, jejak)
      return false
    }
    jejak.push(sekarang)
    catatan.set(kunci, jejak)
    if (catatan.size > maksKunci) catatan.delete(catatan.keys().next().value)
    return true
  }
}

/** Plafon token per hari (UTC). Setelah habis, panggilan LLM ditolak sampai besok. */
export function buatPlafonHarian(batas) {
  let hari = ''
  let terpakai = 0
  const segarkan = (sekarang) => {
    const h = new Date(sekarang).toISOString().slice(0, 10)
    if (h !== hari) {
      hari = h
      terpakai = 0
    }
  }
  return {
    cukup(perkiraan, sekarang = Date.now()) {
      segarkan(sekarang)
      return terpakai + perkiraan <= batas
    },
    catat(token, sekarang = Date.now()) {
      segarkan(sekarang)
      terpakai += token
    },
    sisa(sekarang = Date.now()) {
      segarkan(sekarang)
      return Math.max(0, batas - terpakai)
    },
  }
}

/**
 * Cache dengan masa berlaku + permintaan kembar yang sedang berjalan digabung (satu panggilan untuk semua).
 * simpan(nilai) menentukan apakah hasil disimpan (mis. galat sementara jangan di-cache).
 */
export function buatCache({ ttlMs, maks = 200, simpan = () => true }) {
  const isi = new Map()
  const berjalan = new Map()
  return async function ambil(kunci, buat, sekarang = Date.now()) {
    const ada = isi.get(kunci)
    if (ada && ada.kedaluwarsa > sekarang) return { ...ada.nilai, cache: true }
    if (berjalan.has(kunci)) return { ...(await berjalan.get(kunci)), cache: true }
    const janji = buat().finally(() => berjalan.delete(kunci))
    berjalan.set(kunci, janji)
    const nilai = await janji
    if (simpan(nilai)) {
      isi.set(kunci, { nilai, kedaluwarsa: sekarang + ttlMs })
      if (isi.size > maks) isi.delete(isi.keys().next().value)
    }
    return { ...nilai, cache: false }
  }
}

/**
 * Batasi pekerjaan berat (inferensi model) yang berjalan bersamaan. Bila antrean penuh, jalankan() melempar
 * Error kode "SIBUK" agar server tidak kewalahan saat dibanjiri permintaan.
 */
export function buatAntrean({ bersamaan = 2, maksAntre = 20 } = {}) {
  let aktif = 0
  const tunggu = []
  const lepas = () => {
    aktif--
    tunggu.shift()?.()
  }
  return async function jalankan(kerja) {
    if (aktif >= bersamaan) {
      if (tunggu.length >= maksAntre) throw Object.assign(new Error('Server AI sedang sibuk'), { kode: 'SIBUK' })
      await new Promise((r) => tunggu.push(r))
    }
    aktif++
    try {
      return await kerja()
    } finally {
      lepas()
    }
  }
}
