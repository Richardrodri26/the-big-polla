"use client";

import { create } from "zustand";
import type { FeedMatch } from "@/lib/tournament-data";

interface Toast {
  message: string;
  type?: "success" | "error" | "info";
}

interface AppState {
  predictorMatch: FeedMatch | null;
  predictions: Record<string, [number, number]>;
  toast: Toast | null;

  openPredictor: (match: FeedMatch) => void;
  closePredictor: () => void;
  savePrediction: (matchId: string, score: [number, number]) => void;
  showToast: (toast: Toast) => void;
  clearToast: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  predictorMatch: null,
  predictions: {},
  toast: null,

  openPredictor: (match) => set({ predictorMatch: match }),
  closePredictor: () => set({ predictorMatch: null }),

  savePrediction: (matchId, score) =>
    set((state) => ({
      predictions: { ...state.predictions, [matchId]: score },
      predictorMatch: null,
    })),

  showToast: (toast) => set({ toast }),
  clearToast: () => set({ toast: null }),
}));
