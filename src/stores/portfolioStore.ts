'use client';

import { create } from 'zustand';
import { getExchangeAdapter } from '@/services/exchange';
import type { Balance, Order, Position } from '@/types/domain';
import { useMarketStore } from './marketStore';

// ── State shape ──────────────────────────────────────────────────

interface PortfolioState {
  balances: Balance[];
  orders: Order[];

  // Actions
  refresh: () => Promise<void>;
  addOrder: (o: Order) => Promise<void>;
}

// ── Store ─────────────────────────────────────────────────────────

export const usePortfolioStore = create<PortfolioState>((set) => ({
  balances: [],
  orders: [],

  refresh: async () => {
    const adapter = getExchangeAdapter();
    try {
      const [balances, orders] = await Promise.all([adapter.getBalances(), adapter.getOrders()]);
      set({ balances, orders });
    } catch {
      // Live mode: keys not configured yet, or a transient API failure.
      // Keep the previous snapshot — never wipe balances on a failed poll.
    }
  },

  addOrder: async (o: Order) => {
    const adapter = getExchangeAdapter();
    set((state) => ({ orders: [o, ...state.orders] }));
    try {
      const balances = await adapter.getBalances();
      set({ balances });
    } catch {
      // Balance refresh failed — the periodic refresh will catch up.
    }
  },
}));

// ── Helper hooks ─────────────────────────────────────────────────

export function usePositions(): Position[] {
  const balances = usePortfolioStore((s) => s.balances);
  const tickers = useMarketStore((s) => s.tickers);

  const positions: Position[] = [];

  for (const bal of balances) {
    if (bal.currency === 'KRW') continue;
    if (bal.balance <= 0 && bal.locked <= 0) continue;

    // Find the market code (e.g. KRW-BTC) for this currency
    const marketCode = `KRW-${bal.currency}`;
    const ticker = tickers[marketCode];
    // 시세도 매수가도 없으면 평가 불가(KRW 마켓 없는 에어드랍 등) — 그때만
    // 숨긴다. 시드 12종으로 거르면 라이브 보유분이 통째로 누락된다(과거 버그).
    if (!ticker && bal.avgBuyPrice <= 0) continue;

    const currentPrice = ticker?.tradePrice ?? bal.avgBuyPrice;
    const quantity = bal.balance + bal.locked;
    const valuation = quantity * currentPrice;
    const costBasis = quantity * bal.avgBuyPrice;
    const profit = valuation - costBasis;
    const profitRate = costBasis > 0 ? profit / costBasis : 0;

    positions.push({
      market: marketCode,
      base: bal.currency,
      quantity,
      avgBuyPrice: bal.avgBuyPrice,
      currentPrice,
      valuation,
      costBasis,
      profit,
      profitRate,
    });
  }

  return positions;
}

export function usePortfolioTotals(): {
  valuation: number;
  cash: number;
  costBasis: number;
  pnl: number;
  pnlRate: number;
} {
  const balances = usePortfolioStore((s) => s.balances);
  const tickers = useMarketStore((s) => s.tickers);

  const krwBalance = balances.find((b) => b.currency === 'KRW');
  const cash = (krwBalance?.balance ?? 0) + (krwBalance?.locked ?? 0);

  let assetValuation = 0;
  let totalCostBasis = 0;

  for (const bal of balances) {
    if (bal.currency === 'KRW') continue;
    if (bal.balance <= 0 && bal.locked <= 0) continue;

    const marketCode = `KRW-${bal.currency}`;
    const ticker = tickers[marketCode];
    if (!ticker && bal.avgBuyPrice <= 0) continue;

    const currentPrice = ticker?.tradePrice ?? bal.avgBuyPrice;
    const quantity = bal.balance + bal.locked;

    assetValuation += quantity * currentPrice;
    totalCostBasis += quantity * bal.avgBuyPrice;
  }

  const valuation = cash + assetValuation;
  const pnl = assetValuation - totalCostBasis;
  const pnlRate = totalCostBasis > 0 ? pnl / totalCostBasis : 0;

  return {
    valuation,
    cash,
    costBasis: totalCostBasis,
    pnl,
    pnlRate,
  };
}
