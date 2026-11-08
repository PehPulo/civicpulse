// PEMILIK: Ezra (AI) · KONTRAK: docs/AI.md § LLM · Ditinjau: Albert
// Klien Groq (API kompatibel OpenAI). Model, prompt, dan parameter dibaca dari ml/models.json (registry MLOps),
// sehingga evaluasi (ml/eval-llm.js) memakai kode & konfigurasi yang SAMA dengan server.
import registry from '../../../../ml/models.json' with { type: 'json' }

export const URL_GROQ = 'https://api.groq.com/openai/v1/chat/completions'

/** Konfigurasi LLM aktif (atau versi tertentu, untuk evaluasi). */
export function konfigLlm(versi = registry.aktif.llm) {
  const cfg = registry.model[versi]
  if (!cfg) throw new Error(`Model LLM "${versi}" tidak ada di ml/models.json`)
  return { versi, ...cfg }
}

/** Susunan pesan: sistem + satu contoh (one-shot) + fakta. */
export const pesanDasbor = (cfg, fakta) => [
  { role: 'system', content: cfg.prompt.sistem },
  { role: 'user', content: `Fakta dasbor:\n${cfg.prompt.contohRingkasan.fakta}\n\nRingkasan:` },
  { role: 'assistant', content: cfg.prompt.contohRingkasan.jawaban },
  { role: 'user', content: `Fakta dasbor:\n${fakta}\n\nRingkasan:` },
]

/**
 * Minta Groq menulis ringkasan dari fakta. Melempar Error bila gagal (jaringan, 429, batas waktu).
 * @returns {Promise<{ teks: string, token: number, ms: number, model: string }>}
 */
export function tulisRingkasan(fakta, { apiKey, versi, batasMs = 15000 } = {}) {
  const cfg = konfigLlm(versi)
  return panggilGroq(pesanDasbor(cfg, fakta), { apiKey, cfg, batasMs })
}

/**
 * Tulis teks dengan prompt lain (mis. panel instansi, apps/api/src/ai/prompt-instansi.js) memakai model aktif.
 * Pola sama: sistem + satu contoh + fakta. Melempar Error bila gagal.
 */
export function tulisDenganPrompt(fakta, prompt, { apiKey, versi, batasMs = 15000 } = {}) {
  const cfg = konfigLlm(versi)
  const pesan = [
    { role: 'system', content: prompt.sistem },
    {
      role: 'user',
      content: `${prompt.labelFakta}:
${prompt.contoh.fakta}

${prompt.labelJawaban}:`,
    },
    { role: 'assistant', content: prompt.contoh.jawaban },
    {
      role: 'user',
      content: `${prompt.labelFakta}:
${fakta}

${prompt.labelJawaban}:`,
    },
  ]
  return panggilGroq(pesan, { apiKey, cfg, batasMs })
}

async function panggilGroq(messages, { apiKey, cfg, batasMs }) {
  if (!apiKey) throw new Error('GROQ_API_KEY belum diisi')
  const t0 = Date.now()
  const res = await fetch(URL_GROQ, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: cfg.modelId, messages, ...cfg.generasi }),
    signal: AbortSignal.timeout(batasMs),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const e = new Error(`Groq ${res.status}: ${json.error?.message ?? 'gagal'}`)
    e.status = res.status
    throw e
  }
  return {
    teks: (json.choices?.[0]?.message?.content ?? '').trim(),
    token: json.usage?.total_tokens ?? 0,
    ms: Date.now() - t0,
    model: cfg.modelId,
  }
}
