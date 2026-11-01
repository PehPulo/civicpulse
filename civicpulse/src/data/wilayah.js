// DATA ILUSTRASI untuk draft. Akan diganti hasil impor IRBI & DIBI (BNPB) dan data kemiskinan BPS.
// risiko: indeks risiko per jenis bahaya yang sudah dinormalisasi ke 0–100.
// kejadian5th: jumlah kejadian per jenis bahaya dalam 5 tahun terakhir.
// serupa30h: jumlah pelapor unik lain per kategori dalam radius ±500 m / 30 hari.

export const WILAYAH = [
  {
    id: 'dayeuhkolot', kecamatan: 'Dayeuhkolot', kabupaten: 'Kab. Bandung',
    lat: -6.9876, lng: 107.6247, miskin: 6.4,
    risiko: { banjir: 92, longsor: 18, jalan: 55 },
    kejadian5th: { banjir: 6, longsor: 0, jalan: 2 },
    serupa30h: { drainase: 4, banjir: 7, jalan: 2, longsor: 0, lainnya: 1 },
  },
  {
    id: 'baleendah', kecamatan: 'Baleendah', kabupaten: 'Kab. Bandung',
    lat: -7.004, lng: 107.628, miskin: 6.4,
    risiko: { banjir: 88, longsor: 30, jalan: 52 },
    kejadian5th: { banjir: 5, longsor: 1, jalan: 1 },
    serupa30h: { drainase: 3, banjir: 5, jalan: 1, longsor: 0, lainnya: 0 },
  },
  {
    id: 'bojongsoang', kecamatan: 'Bojongsoang', kabupaten: 'Kab. Bandung',
    lat: -6.9785, lng: 107.6448, miskin: 6.4,
    risiko: { banjir: 80, longsor: 10, jalan: 48 },
    kejadian5th: { banjir: 3, longsor: 0, jalan: 1 },
    serupa30h: { drainase: 2, banjir: 3, jalan: 3, longsor: 0, lainnya: 0 },
  },
  {
    id: 'lembang', kecamatan: 'Lembang', kabupaten: 'Kab. Bandung Barat',
    lat: -6.8117, lng: 107.6175, miskin: 10.2,
    risiko: { banjir: 35, longsor: 86, jalan: 70 },
    kejadian5th: { banjir: 1, longsor: 4, jalan: 3 },
    serupa30h: { drainase: 0, banjir: 0, jalan: 2, longsor: 1, lainnya: 0 },
  },
  {
    id: 'cisarua', kecamatan: 'Cisarua', kabupaten: 'Kab. Bandung Barat',
    lat: -6.827, lng: 107.556, miskin: 10.2,
    risiko: { banjir: 28, longsor: 90, jalan: 74 },
    kejadian5th: { banjir: 0, longsor: 5, jalan: 2 },
    serupa30h: { drainase: 0, banjir: 0, jalan: 1, longsor: 0, lainnya: 0 },
  },
  {
    id: 'coblong', kecamatan: 'Coblong', kabupaten: 'Kota Bandung',
    lat: -6.888, lng: 107.615, miskin: 3.9,
    risiko: { banjir: 40, longsor: 22, jalan: 30 },
    kejadian5th: { banjir: 1, longsor: 0, jalan: 0 },
    serupa30h: { drainase: 9, banjir: 2, jalan: 8, longsor: 0, lainnya: 3 },
  },
  {
    id: 'sukajadi', kecamatan: 'Sukajadi', kabupaten: 'Kota Bandung',
    lat: -6.887, lng: 107.596, miskin: 3.9,
    risiko: { banjir: 45, longsor: 25, jalan: 32 },
    kejadian5th: { banjir: 2, longsor: 0, jalan: 0 },
    serupa30h: { drainase: 6, banjir: 1, jalan: 5, longsor: 0, lainnya: 2 },
  },
  {
    id: 'cimahi-selatan', kecamatan: 'Cimahi Selatan', kabupaten: 'Kota Cimahi',
    lat: -6.905, lng: 107.537, miskin: 4.8,
    risiko: { banjir: 66, longsor: 15, jalan: 40 },
    kejadian5th: { banjir: 3, longsor: 0, jalan: 1 },
    serupa30h: { drainase: 2, banjir: 2, jalan: 2, longsor: 0, lainnya: 0 },
  },
]

export const PUSAT_PETA = [-6.92, 107.6]

// Cari kecamatan terdekat dari sebuah titik (cukup untuk skala MVP; versi akhir memakai poligon batas wilayah).
export function wilayahTerdekat(lat, lng) {
  let terbaik = WILAYAH[0]
  let jarakMin = Infinity
  for (const w of WILAYAH) {
    const d = (w.lat - lat) ** 2 + (w.lng - lng) ** 2
    if (d < jarakMin) {
      jarakMin = d
      terbaik = w
    }
  }
  return terbaik
}
