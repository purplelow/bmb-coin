"use client";

import { create } from "zustand";
import type { Balance, Order, Position } from "@/types/domain";
import { getExchangeAdapter } from "@/services/exchange";
import { SEED_MARKET_BY_CODE } from "@/shared/config/markets";
import { useMarketStore } from "./marketStore";

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
    const [balances, orders] = await Promise.all([
      adapter.getBalances(),
      adapter.getOrders(),
    ]);
    set({ balances, orders });
  },

  addOrder: async (o: Order) => {
    const adapter = getExchangeAdapter();
    set((state) => ({ orders: [o, ...state.orders] }));
    const balances = await adapter.getBalances();
    set({ balances });
  },
}));

// ── Helper hooks ─────────────────────────────────────────────────

export function usePositions(): Position[] {
  const balances = usePortfolioStore((s) => s.balances);
  const tickers = useMarketStore((s) => s.tickers);

  const positions: Position[] = [];

  for (const bal of balances) {
    if (bal.currency === "KRW") continue;
    if (bal.balance <= 0 && bal.locked <= 0) continue;

    // Find the market code (e.g. KRW-BTC) for this currency
    const marketCode = `KRW-${bal.currency}`;
    const seedMarket = SEED_MARKET_BY_CODE[marketCode];
    if (!seedMarket) continue;

    const ticker = tickers[marketCode];
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

  const krwBalance = balances.find((b) => b.currency === "KRW");
  const cash = (krwBalance?.balance ?? 0) + (krwBalance?.locked ?? 0);

  let assetValuation = 0;
  let totalCostBasis = 0;

  for (const bal of balances) {
    if (bal.currency === "KRW") continue;
    if (bal.balance <= 0 && bal.locked <= 0) continue;

    const marketCode = `KRW-${bal.currency}`;
    const seedMarket = SEED_MARKET_BY_CODE[marketCode];
    if (!seedMarket) continue;

    const ticker = tickers[marketCode];
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
