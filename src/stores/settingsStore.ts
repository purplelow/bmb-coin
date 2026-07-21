'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { serverStateStorage } from '@/shared/lib/server-storage';

export type TradingMode = 'test' | 'live';

/** Small-amount KRW presets for a single live order (and live bot buys). */
export const ORDER_PRESETS = [5_000, 10_000, 20_000] as const;

interface SettingsState {
  /** Active trading mode. `test` = simulated paper, `live` = real Upbit money. */
  tradingMode: TradingMode;
  /** KRW spent per live buy (manual or bot). Clamped server-side to the cap. */
  orderPreset: number;
  /** Allow live bots to AUTO-BUY. Off by default → live bots only auto-sell. */
  liveAutoBuy: boolean;
  /** 관심 코인 마켓 코드 목록 (예: 'KRW-BTC'). */
  watchlist: string[];

  setTradingMode: (mode: TradingMode) => void;
  setOrderPreset: (amount: number) => void;
  setLiveAutoBuy: (on: boolean) => void;
  toggleWatchlist: (code: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      tradingMode: 'test',
      orderPreset: ORDER_PRESETS[0],
      liveAutoBuy: false,
      watchlist: [],

      setTradingMode: (mode) => set({ tradingMode: mode }),
      setOrderPreset: (amount) => set({ orderPreset: amount }),
      setLiveAutoBuy: (on) => set({ liveAutoBuy: on }),
      toggleWatchlist: (code) =>
        set((s) => ({
          watchlist: s.watchlist.includes(code)
            ? s.watchlist.filter((c) => c !== code)
            : [...s.watchlist, code],
        })),
    }),
    {
      name: 'koinlab-settings',
      // DB-backed, session-scoped persistence (migrates old localStorage once).
      storage: createJSONStorage(() => serverStateStorage('settings', 'koinlab-settings')),
    },
  ),
);

export const useTradingMode = (): TradingMode => useSettingsStore((s) => s.tradingMode);
export const useIsLive = (): boolean => useSettingsStore((s) => s.tradingMode === 'live');
