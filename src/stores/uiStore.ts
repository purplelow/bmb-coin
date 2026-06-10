"use client";

import { create } from "zustand";
import { uid } from "@/shared/lib/id";

// ── Types ─────────────────────────────────────────────────────────

export interface Toast {
  id: string;
  message: string;
  tone: "success" | "danger" | "info";
}

// ── State shape ──────────────────────────────────────────────────

interface UiState {
  toasts: Toast[];

  // Actions
  showToast: (message: string, tone?: "success" | "danger" | "info") => void;
  dismissToast: (id: string) => void;
}

// ── Store ─────────────────────────────────────────────────────────

export const useUiStore = create<UiState>((set) => ({
  toasts: [],

  showToast: (message, tone = "info") => {
    const id = uid("toast");
    const toast: Toast = { id, message, tone };
    set((state) => ({ toasts: [...state.toasts, toast] }));

    // Auto-remove after ~2500ms
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 2500);
  },

  dismissToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));
