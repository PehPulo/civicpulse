// Tes kontrak dasar API. Albert menambah tes per endpoint saat mengimplementasikan (docs/API.md).
import { describe, expect, it } from 'vitest'
import { buatApp } from '../src/app.js'

const app = buatApp()
const req = (path, init) => app.request(`/api/v1${path}`, init)

describe('apps/api', () => {
  it('GET /health', async () => {
    const res = await req('/health')
    expect(res.status).toBe(200)
    expect((await res.json()).data.ok).toBe(true)
  })

  it('GET /wilayah mengembalikan dataset', async () => {
    const { data } = await (await req('/wilayah')).json()
    expect(data.wilayah.length).toBeGreaterThan(0)
  })

  it('POST /laporan tanpa X-Device-Id ⇒ 400 format galat seragam', async () => {
    const res = await req('/laporan', { method: 'POST' })
    expect(res.status).toBe(400)
    expect((await res.json()).error.kode).toBe('VALIDASI')
  })

  it('endpoint tak dikenal ⇒ 404', async () => {
    expect((await req('/tidak-ada')).status).toBe(404)
  })
})
