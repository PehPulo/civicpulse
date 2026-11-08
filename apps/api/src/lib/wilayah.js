// Daftar wilayah yang dipakai SEMUA aturan bisnis di server: kecamatan pilot (data asli) + wilayah ilustrasi
// per kab/kota se-Indonesia (gabungWilayah di core). Satu sumber agar web & api menghitung hal yang sama.
import { gabungWilayah } from '@civicpulse/core'
import pilot from '@civicpulse/data/wilayah.json' with { type: 'json' }
import nasional from '@civicpulse/data/nasional.json' with { type: 'json' }

export const PILOT = pilot
export const NASIONAL = nasional
export const W = gabungWilayah(pilot.wilayah, nasional)
export const INDEKS_WILAYAH = new Map(W.map((w) => [w.id, w]))
