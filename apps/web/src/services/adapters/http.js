// Adapter HTTP: klien untuk apps/api sesuai docs/API.md (base: VITE_API_URL, mis. https://…/api/v1).
// Satu-satunya jalur data web ⇄ backend (ADR-0005). Galat server diteruskan sebagai GalatDomain.
import { GalatDomain } from '@civicpulse/core'
import { sesiHabis } from '../identitas.js'

export function buatAdapterHttp(baseUrl) {
  async function panggil(path, { method = 'GET', body, deviceId, token, form } = {}) {
    const headers = { Accept: 'application/json' }
    if (deviceId) headers['X-Device-Id'] = deviceId
    if (token) headers.Authorization = `Bearer ${token}`
    if (body) headers['Content-Type'] = 'application/json'
    let res
    try {
      res = await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: form ?? (body ? JSON.stringify(body) : undefined),
      })
    } catch {
      throw new GalatDomain('JARINGAN', 'Tidak dapat terhubung ke server. Periksa koneksi internet.')
    }
    const json = res.status === 204 ? null : await res.json().catch(() => null)
    if (!res.ok) {
      const e = json?.error ?? {}
      if (res.status === 401 && token) sesiHabis()
      throw new GalatDomain(e.kode ?? `HTTP_${res.status}`, e.pesan ?? `Permintaan gagal (${res.status}).`, e.detail)
    }
    return json?.data ?? json
  }

  // Foto (data URL hasil kompresi) diunggah dulu ke POST /unggah ⇒ { url }.
  async function unggah(dataUrl, ctx) {
    if (!dataUrl?.startsWith('data:')) return dataUrl ?? null
    const form = new FormData()
    form.append('file', await (await fetch(dataUrl)).blob(), 'foto.jpg')
    return (await panggil('/unggah', { method: 'POST', form, ...ctx })).url
  }

  const q = (obj = {}) => {
    const p = new URLSearchParams(Object.entries(obj).filter(([, v]) => v != null && v !== ''))
    return p.size ? `?${p}` : ''
  }

  return {
    mode: 'server',
    health: () => panggil('/health'),
    daftarWilayah: () => panggil('/wilayah'),
    daftarLaporan: (filter, ctx) => panggil(`/laporan${q(filter)}`, ctx),
    getLaporan: (kode, ctx) => panggil(`/laporan/${encodeURIComponent(kode)}`, ctx),
    buatLaporan: async (input, ctx) =>
      panggil('/laporan', { method: 'POST', body: { ...input, fotoUrl: await unggah(input.fotoUrl, ctx) }, ...ctx }),
    dukung: (kode, ctx) => panggil(`/laporan/${encodeURIComponent(kode)}/dukungan`, { method: 'POST', ...ctx }),
    kirimVerifikasi: async (kode, data, ctx) =>
      panggil(`/laporan/${encodeURIComponent(kode)}/verifikasi`, {
        method: 'POST',
        body: { ...data, fotoUrl: await unggah(data.fotoUrl, ctx) },
        ...ctx,
      }),
    loginInstansi: (username, password) => panggil('/auth/instansi', { method: 'POST', body: { username, password } }),
    ubahSandi: (body, ctx) => panggil('/auth/sandi', { method: 'POST', body, ...ctx }),
    daftarAdmin: ({ provinsiId } = {}, ctx) =>
      panggil(`/auth/admin${provinsiId ? `?provinsiId=${encodeURIComponent(provinsiId)}` : ''}`, ctx),
    cctvLaporan: (kode, ctx) => panggil(`/cctv/laporan/${encodeURIComponent(kode)}`, ctx),
    supervisi: (kode, catatan, ctx) =>
      panggil(`/laporan/${encodeURIComponent(kode)}/supervisi`, { method: 'POST', body: { catatan }, ...ctx }),
    ubahProfil: (profil, ctx) => panggil('/auth/profil', { method: 'POST', body: profil, ...ctx }),
    ubahStatus: async (kode, body, ctx) =>
      panggil(`/laporan/${encodeURIComponent(kode)}/status`, {
        method: 'POST',
        body: { ...body, buktiUrl: await unggah(body.buktiUrl, ctx) },
        ...ctx,
      }),
    statistik: () => panggil('/statistik'),
  }
}
