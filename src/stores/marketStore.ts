'use client';

import { create } from 'zustand';
import { getExchangeAdapter } from '@/services/exchange';
import { SIM } from '@/shared/config';
import { DEFAULT_MARKET } from '@/shared/config/markets';
import type { Market, Ticker, Candle } from '@/types/domain';

// ── State shape ──────────────────────────────────────────────────

interface MarketState {
  markets: Market[];
  tickers: Record<string, Ticker>;
  candles: Record<string, Candle[]>;
  selectedMarket: string;
  status: 'idle' | 'loading' | 'ready';

  // Actions
  init: () => Promise<void>;
  setSelectedMarket: (code: string) => void;
  applyTicker: (t: Ticker) => void;
  loadCandles: (market: string) => Promise<void>;
}

// ── Store ─────────────────────────────────────────────────────────

export const useMarketStore = create<MarketState>((set, get) => ({
  markets: [],
  tickers: {},
  candles: {},
  selectedMarket: DEFAULT_MARKET,
  status: 'idle',

  init: async () => {
    const adapter = getExchangeAdapter();
    set({ status: 'loading' });

    try {
      const markets = await adapter.getMarkets();
      const codes = markets.map((m) => m.code);

      const tickerList = await adapter.getTickers(codes);
      const tickers: Record<string, Ticker> = {};
      for (const t of tickerList) {
        tickers[t.market] = t;
      }

      // Candles are fetched in small chunks: Upbit's public REST API allows
      // ~10 req/s per IP, so 12+ parallel requests in live mode would 429.
      // A failed market just loads lazily later via loadCandles().
      const candles: Record<string, Candle[]> = {};
      const CHUNK = 5;
      for (let i = 0; i < codes.length; i += CHUNK) {
        const chunk = codes.slice(i, i + CHUNK);
        const results = await Promise.all(
          chunk.map(async (code) => {
            try {
              return await adapter.getCandles(code, SIM.candleUnit, SIM.historyLength);
            } catch {
              return [] as Candle[];
            }
          }),
        );
        chunk.forEach((code, j) => {
          const arr = results[j];
          if (arr !== undefined && arr.length > 0) {
            candles[code] = arr;
          }
        });
      }

      set({
        markets,
        tickers,
        candles,
        selectedMarket: get().selectedMarket ?? DEFAULT_MARKET,
        status: 'ready',
      });
    } catch {
      // Total failure (offline / exchange down) — leave retryable, not stuck.
      set({ status: 'idle' });
    }
  },

  setSelectedMarket: (code: string) => {
    set({ selectedMarket: code });
  },

  applyTicker: (t: Ticker) => {
    set((state) => ({
      tickers: { ...state.tickers, [t.market]: t },
    }));
  },

  loadCandles: async (market: string) => {
    const adapter = getExchangeAdapter();
    try {
      const fetched = await adapter.getCandles(market, SIM.candleUnit, SIM.historyLength);
      set((state) => ({
        candles: { ...state.candles, [market]: fetched },
      }));
    } catch {
      // Keep whatever we had; caller retries on next visit.
    }
  },
}));

// ── Helper hooks ─────────────────────────────────────────────────

export function useTicker(market: string): Ticker | undefined {
  return useMarketStore((s) => s.tickers[market]);
}

export function useMarkets(): Market[] {
  return useMarketStore((s) => s.markets);
}

export function useSelectedMarket(): string {
  return useMarketStore((s) => s.selectedMarket);
}
