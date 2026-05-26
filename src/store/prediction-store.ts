'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface PredictionState {
  predictions: Record<string, [number, number]>
  savePrediction: (matchId: string, score: [number, number]) => void
  getPrediction: (matchId: string) => [number, number] | undefined
  clearAll: () => void
}

export const usePredictionStore = create<PredictionState>()(
  persist(
    (set, get) => ({
      predictions: {},
      savePrediction: (matchId, score) =>
        set(s => ({ predictions: { ...s.predictions, [matchId]: score } })),
      getPrediction: (matchId) => get().predictions[matchId],
      clearAll: () => set({ predictions: {} }),
    }),
    { name: 'tbp-predictions' },
  ),
)
