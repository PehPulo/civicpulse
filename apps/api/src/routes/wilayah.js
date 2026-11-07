import { Hono } from 'hono'
import wilayahData from '@civicpulse/data/wilayah.json' with { type: 'json' }

// GET /wilayah. Sudah lengkap: data statis dari data/processed/wilayah.json.
export const wilayah = new Hono().get('/', (c) =>
  c.json({ data: { ilustrasi: wilayahData.ilustrasi, sumber: wilayahData.sumber, wilayah: wilayahData.wilayah } }),
)
