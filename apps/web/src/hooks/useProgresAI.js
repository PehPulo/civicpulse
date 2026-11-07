import { useEffect, useState } from 'react'
import { onProgresAI, progresAI } from '../ai/index.js'

/**
 * Progres unduhan model AI per jenis (dijumlahkan dari semua file model).
 * @returns {{ vision: Progres | null, llm: Progres | null }}
 * @typedef {{ persen: number, mbTerunduh: number, mbTotal: number, selesai: boolean }} Progres
 */
export function useProgresAI() {
  const [progres, setProgres] = useState(progresAI)
  useEffect(() => onProgresAI(setProgres), [])
  return progres
}
