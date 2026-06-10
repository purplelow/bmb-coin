"use client";

import { create } from "zustand";
import type { Market, Ticker, Candle } from "@/types/domain";
import { getExchangeAdapter } from "@/services/exchange";
import { SIM } from "@/shared/config";
import { DEFAULT_MARKET } from "@/shared/config/markets";

// ── State shape ──────────────────────────────────────────────────

interface MarketState {
  markets: Market[];
  tickers: Record<string, Ticker>;
  candles: Record<string, Candle[]>;
  selectedMarket: string;
  status: "idle" | "loading" | "ready";

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
  status: "idle",

  init: async () => {
    const adapter = getExchangeAdapter();
    set({ status: "loading" });

    const markets = await adapter.getMarkets();
    const codes = markets.map((m) => m.code);

    const [tickerList, ...candleArrays] = await Promise.all([
      adapter.getTickers(codes),
      ...codes.map((code) =>
        adapter.getCandles(code, SIM.candleUnit, SIM.historyLength),
      ),
    ]);

    const tickers: Record<string, Ticker> = {};
    for (const t of tickerList) {
      tickers[t.market] = t;
    }

    const candles: Record<string, Candle[]> = {};
    for (let i = 0; i < codes.length; i++) {
      const code = codes[i];
      const arr = candleArrays[i];
      if (code !== undefined && arr !== undefined) {
        candles[code] = arr;
      }
    }

    set({
      markets,
      tickers,
      candles,
      selectedMarket: get().selectedMarket ?? DEFAULT_MARKET,
      status: "ready",
    });
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
    const fetched = await adapter.getCandles(
      market,
      SIM.candleUnit,
      SIM.historyLength,
    );
    set((state) => ({
      candles: { ...state.candles, [market]: fetched },
    }));
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
