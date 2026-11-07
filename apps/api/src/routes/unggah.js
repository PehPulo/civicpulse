// TODO(Albert): terima multipart `file` (JPEG, ≤ 1 MB setelah kompresi klien), simpan ke Supabase Storage
// bucket `foto` dengan nama acak, balas { data: { url } }. Tolak tipe selain image/jpeg|png|webp.
import { Hono } from 'hono'
import { belumAda } from '../middleware/galat.js'
import { wajibWarga } from '../middleware/identitas.js'

export const unggah = new Hono().post('/', wajibWarga, () => belumAda('POST /unggah'))
