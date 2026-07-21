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

/** 부팅 시 스파크라인 캔들을 미리 받아둘 마켓 수 (거래대금 상위). */
const CANDLE_PRELOAD_COUNT = 12;

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

      // 거래대금(24h) 큰 순으로 정렬 — 라이브 전체 목록(~180종)에서 주요 코인이
      // 위로 온다. 테스트 모드(12종)도 같은 규칙.
      markets.sort(
        (a, b) =>
          (tickers[b.code]?.accTradePrice24h ?? 0) - (tickers[a.code]?.accTradePrice24h ?? 0),
      );

      // Candles are fetched in small chunks: Upbit's public REST API allows
      // ~10 req/s per IP, so 12+ parallel requests in live mode would 429.
      // 스파크라인용 프리로드는 상위 일부만 — 전체(~180종)를 다 받으면 부팅마다
      // 180요청이 나간다. 나머지는 상세 진입 시 loadCandles()로 lazy 로드.
      const candles: Record<string, Candle[]> = {};
      const candleCodes = markets.slice(0, CANDLE_PRELOAD_COUNT).map((m) => m.code);
      const CHUNK = 5;
      for (let i = 0; i < candleCodes.length; i += CHUNK) {
        const chunk = candleCodes.slice(i, i + CHUNK);
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
