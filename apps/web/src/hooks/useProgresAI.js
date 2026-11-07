import { useEffect, useState } from 'react'
import { onProgresAI } from '../ai/index.js'

/** Persen unduhan model AI terakhir per jenis: { vision: 0–100 | null, llm: 0–100 | null }. */
export function useProgresAI() {
  const [progres, setProgres] = useState({ vision: null, llm: null })
  useEffect(
    () =>
      onProgresAI(({ model, persen, status }) =>
        setProgres((p) => ({ ...p, [model]: status === 'progress' ? persen : 100 })),
      ),
    [],
  )
  return progres
}
