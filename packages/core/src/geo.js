const R_BUMI = 6371000

// Jarak dua titik dalam meter (rumus haversine).
export function jarakMeter(lat1, lng1, lat2, lng2) {
  const rad = (d) => (d * Math.PI) / 180
  const dLat = rad(lat2 - lat1)
  const dLng = rad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R_BUMI * Math.asin(Math.sqrt(a))
}

// Wilayah dengan centroid terdekat. Cukup untuk MVP; versi lanjut memakai poligon batas wilayah.
export function wilayahTerdekat(daftarWilayah, lat, lng) {
  let terbaik = null
  let jarakMin = Infinity
  for (const w of daftarWilayah) {
    const d = jarakMeter(lat, lng, w.lat, w.lng)
    if (d < jarakMin) {
      jarakMin = d
      terbaik = w
    }
  }
  return terbaik
}
