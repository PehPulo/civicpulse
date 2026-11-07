// PEMILIK: Ezra (AI) · KONTRAK: docs/AI.md § Worker
//
// Web Worker AI. Protokol pesan:
//   masuk  { id, tugas: 'pemanasan' | 'klasifikasi' | 'verifikasi' | 'ringkas', payload }
//   keluar { id, hasil } | { id, error }
//
// TODO(Ezra): implementasikan dengan Transformers.js + CLIP (lihat docs/AI.md § Implementasi):
//   import { pipeline } from '@huggingface/transformers'
//   const klasifikator = await pipeline('zero-shot-image-classification', MODEL.id)
//   label prompt & versi model diambil dari ml/models.json (dikelola Albert, MLOps).
// Sampai diimplementasikan, worker menjawab `null` ⇒ UI berjalan tanpa saran AI.

self.onmessage = async ({ data: { id, tugas } }) => {
  try {
    switch (tugas) {
      case 'pemanasan':
      case 'klasifikasi':
      case 'verifikasi':
      case 'ringkas':
        self.postMessage({ id, hasil: null })
        break
      default:
        throw new Error(`Tugas AI tidak dikenal: ${tugas}`)
    }
  } catch (e) {
    self.postMessage({ id, error: e.message })
  }
}
