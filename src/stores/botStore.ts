"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Bot, BotStats, BotStatus, SignalEvent, StrategyParams } from "@/types/domain";
import { uid } from "@/shared/lib/id";

// ── State shape ──────────────────────────────────────────────────

interface BotState {
  bots: Bot[];
  signals: SignalEvent[];

  // Actions
  createBot: (input: { name: string; market: string; strategy: StrategyParams }) => Bot;
  updateBot: (id: string, patch: Partial<Bot>) => void;
  removeBot: (id: string) => void;
  setStatus: (id: string, status: BotStatus) => void;
  addSignal: (e: SignalEvent) => void;
  applyBotStats: (id: string, patch: Partial<BotStats>) => void;
}

// ── Store ─────────────────────────────────────────────────────────

export const useBotStore = create<BotState>()(
  persist(
    (set) => ({
      bots: [],
      signals: [],

      createBot: (input) => {
        const bot: Bot = {
          id: uid("bot"),
          name: input.name,
          market: input.market,
          strategy: input.strategy,
          status: "running",
          createdAt: Date.now(),
          stats: {
            trades: 0,
            wins: 0,
            losses: 0,
            realizedPnl: 0,
            returnRate: 0,
          },
        };
        set((state) => ({ bots: [bot, ...state.bots] }));
        return bot;
      },

      updateBot: (id, patch) => {
        set((state) => ({
          bots: state.bots.map((b) => (b.id === id ? { ...b, ...patch } : b)),
        }));
      },

      removeBot: (id) => {
        set((state) => ({
          bots: state.bots.filter((b) => b.id !== id),
        }));
      },

      setStatus: (id, status) => {
        set((state) => ({
          bots: state.bots.map((b) => (b.id === id ? { ...b, status } : b)),
        }));
      },

      addSignal: (e) => {
        set((state) => ({
          signals: [e, ...state.signals].slice(0, 100),
        }));
      },

      applyBotStats: (id, patch) => {
        set((state) => ({
          bots: state.bots.map((b) =>
            b.id === id ? { ...b, stats: { ...b.stats, ...patch } } : b,
          ),
        }));
      },
    }),
    {
      name: "koinlab-bots",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ bots: state.bots }),
    },
  ),
);
