// PEMILIK: Ezra (sisi warga)
// Foto Nusantara (Wikimedia Commons, CC BY / CC BY-SA) di apps/web/public/pesona/<id>.webp.
// Lisensi mewajibkan nama pembuat & lisensi tampil di dekat foto (komponen Kredit / SampulHalaman).
// Mau ganti dengan gambar buatan sendiri? Simpan dengan id yang sama dan ubah kredit/lisensinya.

/** @type {{[id: string]: {nama: string, lokasi: string, kredit: string, lisensi: string, sumber: string}}} */
export const FOTO_NUSANTARA = {
  'gedung-sate': {
    nama: 'Gedung Sate',
    lokasi: 'Bandung, Jawa Barat',
    kredit: 'Gunawan Kartapranata',
    lisensi: 'CC BY-SA 3.0',
    sumber: 'https://commons.wikimedia.org/wiki/File:Gedung_Sate_Bandung.jpg',
  },
  borobudur: {
    nama: 'Candi Borobudur',
    lokasi: 'Magelang, Jawa Tengah',
    kredit: 'Justine Hong',
    lisensi: 'CC BY 2.0',
    sumber: 'https://commons.wikimedia.org/wiki/File:Borobudur_Sunrise_2012-01-05.jpg',
  },
  'raja-ampat': {
    nama: 'Piaynemo, Raja Ampat',
    lokasi: 'Papua Barat Daya',
    kredit: 'Irma Ade',
    lisensi: 'CC BY-SA 4.0',
    sumber: 'https://commons.wikimedia.org/wiki/File:Piaynemo_Island,_Raja_Ampat,_West_Papua,_Indonesia.jpg',
  },
  bromo: {
    nama: 'Gunung Bromo',
    lokasi: 'Jawa Timur',
    kredit: 'Thomas Fuhrmann',
    lisensi: 'CC BY-SA 4.0',
    sumber: 'https://commons.wikimedia.org/wiki/File:Gunung_Bromo_sunrise_-_Indonesia.jpg',
  },
  toraja: {
    nama: 'Tongkonan Kete Kesu',
    lokasi: 'Tana Toraja, Sulawesi Selatan',
    kredit: 'Arian Zwegers',
    lisensi: 'CC BY 2.0',
    sumber: 'https://commons.wikimedia.org/wiki/File:Tana_Toraja,_Kete_Kesu,_tongkonan_(6823189476).jpg',
  },
  toba: {
    nama: 'Danau Toba',
    lokasi: 'Sumatera Utara',
    kredit: 'Herman Kurniawan',
    lisensi: 'CC BY-SA 4.0',
    sumber: 'https://commons.wikimedia.org/wiki/File:Danau_Toba_View.jpg',
  },
  tegalalang: {
    nama: 'Sawah Tegalalang',
    lokasi: 'Gianyar, Bali',
    kredit: 'Anggabuana',
    lisensi: 'CC BY 4.0',
    sumber: 'https://commons.wikimedia.org/wiki/File:Tegalalang_Rice_Terrace_-_Subak_Ceking_on_Bali_15.jpg',
  },
  prambanan: {
    nama: 'Candi Prambanan',
    lokasi: 'Sleman, DI Yogyakarta',
    kredit: 'Jakub Hałun',
    lisensi: 'CC BY-SA 4.0',
    sumber: 'https://commons.wikimedia.org/wiki/File:Prambanan_temple,_Central_Java,_Indonesia,_20220818_1311_9139.jpg',
  },
  padar: {
    nama: 'Pulau Padar',
    lokasi: 'Taman Nasional Komodo, NTT',
    kredit: 'Jakub Hałun',
    lisensi: 'CC BY 4.0',
    sumber:
      'https://commons.wikimedia.org/wiki/File:Padar_Island,_Komodo_National_Park,_Indonesia,_20250822_0906_2624.jpg',
  },
  'tanah-lot': {
    nama: 'Pura Tanah Lot',
    lokasi: 'Tabanan, Bali',
    kredit: 'Jakub Hałun',
    lisensi: 'CC BY-SA 4.0',
    sumber: 'https://commons.wikimedia.org/wiki/File:Bali_-_Pura_Tanah_Lot,_20220827_0958_1114.jpg',
  },
  jakarta: {
    nama: 'Panorama Jakarta',
    lokasi: 'DKI Jakarta',
    kredit: 'Gunawan Kartapranata',
    lisensi: 'CC BY-SA 3.0',
    sumber: 'https://commons.wikimedia.org/wiki/File:Jakarta-Panorama.jpg',
  },
  'jam-gadang': {
    nama: 'Jam Gadang',
    lokasi: 'Bukittinggi, Sumatera Barat',
    kredit: 'Undeka 11',
    lisensi: 'CC BY-SA 4.0',
    sumber: 'https://commons.wikimedia.org/wiki/File:Pesona_Jam_Gadang_Menjelang_Maghrib_Bukittinggi_2026.jpg',
  },
  ijen: {
    nama: 'Kawah Ijen',
    lokasi: 'Banyuwangi, Jawa Timur',
    kredit: 'CEphoto, Uwe Aranas',
    lisensi: 'CC BY-SA 3.0',
    sumber:
      'https://commons.wikimedia.org/wiki/File:Kawah-Ijen_Indonesia_Acidious-Lake-at_the-floor-of-the-crater-01.jpg',
  },
}

/** Foto sampul per halaman; satu dipilih acak tiap kunjungan. */
export const SAMPUL = {
  peta: ['raja-ampat', 'padar', 'toba'],
  lapor: ['gedung-sate', 'jakarta', 'jam-gadang'],
  dasbor: ['prambanan', 'borobudur', 'jakarta'],
  metodologi: ['tegalalang', 'toraja', 'ijen'],
  lacak: ['tanah-lot', 'bromo', 'jam-gadang'],
  masuk: ['gedung-sate', 'prambanan', 'jakarta'],
  beranda: ['raja-ampat', 'padar', 'tanah-lot', 'bromo'],
  admin: ['gedung-sate', 'jakarta', 'prambanan', 'borobudur', 'jam-gadang', 'toraja', 'tegalalang', 'toba'],
}

/** Pilih satu id foto dari kumpulan halaman (acak tiap kunjungan). */
export function pilihFoto(halaman) {
  const pool = SAMPUL[halaman] ?? SAMPUL.beranda
  return pool[Math.floor(Math.random() * pool.length)]
}
