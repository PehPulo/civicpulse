// POST /unggah
// Kontrak: docs/API.md § POST /unggah
// Best practice security: validasi mime-type, ukuran, dan magic bytes isi berkas sebenarnya.
import { Hono } from 'hono'
import { GalatDomain, KODE_GALAT } from '@civicpulse/core'
import { config } from '../config.js'
import { periksaMagicBytesGambar } from '../lib/file-validator.js'

const TIPE_DIIZINKAN = ['image/jpeg', 'image/png', 'image/webp']
const MAKS_UKURAN = 1 * 1024 * 1024 // 1 MB

export const unggah = new Hono().post('/', async (c) => {
  const body = await c.req.parseBody().catch(() => ({}))
  const file = body.file

  if (!file || typeof file === 'string') {
    throw new GalatDomain(KODE_GALAT.VALIDASI, 'Berkas file (multipart) wajib disertakan.')
  }

  const tipeDiberikan = (file.type || '').toLowerCase()
  if (!TIPE_DIIZINKAN.includes(tipeDiberikan)) {
    throw new GalatDomain(KODE_GALAT.VALIDASI, 'Tipe berkas tidak didukung. Gunakan JPEG, PNG, atau WebP.')
  }

  const buffer = await file.arrayBuffer()
  if (buffer.byteLength > MAKS_UKURAN) {
    throw new GalatDomain(KODE_GALAT.VALIDASI, 'Ukuran berkas melebihi batas maksimal 1 MB.')
  }

  // Verifikasi isi asli berkas lewat Magic Bytes header
  const tipeAsli = periksaMagicBytesGambar(buffer)
  if (!tipeAsli || !TIPE_DIIZINKAN.includes(tipeAsli)) {
    throw new GalatDomain(KODE_GALAT.VALIDASI, 'Berkas yang diunggah rusak atau bukan format gambar valid.')
  }

  // Jika Supabase dikonfigurasi, simpan ke Supabase Storage
  if (config.supabaseUrl && config.supabaseServiceKey) {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey)

    const ekstensi = tipeAsli === 'image/png' ? 'png' : tipeAsli === 'image/webp' ? 'webp' : 'jpg'
    const namaFile = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ekstensi}`

    const { error } = await supabase.storage
      .from('foto')
      .upload(namaFile, buffer, { contentType: tipeAsli, upsert: false })

    if (error) {
      console.error('Supabase storage upload error:', error)
      throw error
    }

    const { data: pubData } = supabase.storage.from('foto').getPublicUrl(namaFile)
    return c.json({ data: { url: pubData.publicUrl } }, 201)
  }

  // Fallback dev/testing: buat base64 data URL
  const base64 = Buffer.from(buffer).toString('base64')
  const url = `data:${tipeAsli};base64,${base64}`
  return c.json({ data: { url } }, 201)
})
