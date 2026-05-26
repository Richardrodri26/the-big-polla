'use client'

import { create } from 'zustand'
import type { Match } from '@/types/domain'

interface Toast {
  message: string
  type?: 'success' | 'error' | 'info'
}

interface AppState {
  predictorMatch: Match | null
  toast: Toast | null
  openPredictor: (match: Match) => void
  closePredictor: () => void
  showToast: (toast: Toast) => void
  clearToast: () => void
}

export const useAppStore = create<AppState>((set) => ({
  predictorMatch: null,
  toast: null,
  openPredictor: (match) => set({ predictorMatch: match }),
  closePredictor: () => set({ predictorMatch: null }),
  showToast: (toast) => set({ toast }),
  clearToast: () => set({ toast: null }),
}))
