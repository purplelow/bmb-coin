"use client";

import { useEffect, useRef } from "react";
import { getExchangeAdapter } from "@/services/exchange";
import { TradingEngine } from "@/features/trading/engine";
import { SEED_MARKETS } from "@/shared/config/markets";
import { useMarketStore } from "./marketStore";
import { usePortfolioStore } from "./portfolioStore";
import { useBotStore } from "./botStore";

// Module-level guard so the bootstrap logic only runs once even in StrictMode
let _bootstrapped = false;

export default function AppBootstrap(): null {
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current || _bootstrapped) return;
    ranRef.current = true;
    _bootstrapped = true;

    const adapter = getExchangeAdapter();
    const allMarketCodes = SEED_MARKETS.map((m) => m.code);

    // Initialise market + portfolio data
    void useMarketStore.getState().init();
    void usePortfolioStore.getState().refresh();

    // Construct trading engine
    const engine = new TradingEngine(adapter, {
      onSignal: (e) => useBotStore.getState().addSignal(e),
      onBotUpdate: (id, patch) => useBotStore.getState().updateBot(id, patch),
      onOrder: (o) => {
        void usePortfolioStore.getState().addOrder(o);
      },
    });

    // Subscribe to live tickers and forward to market store
    const unsubTickers = adapter.subscribeTickers(allMarketCodes, (t) => {
      useMarketStore.getState().applyTicker(t);
    });

    // Periodically refresh portfolio so valuations track prices
    const refreshInterval = setInterval(() => {
      void usePortfolioStore.getState().refresh();
    }, 3000);

    // Sync engine with current bots and start
    engine.syncBots(useBotStore.getState().bots);

    // Keep engine in sync whenever bots change in the store
    const unsubBots = useBotStore.subscribe((s) => {
      engine.syncBots(s.bots);
    });

    engine.start();

    return () => {
      engine.stop();
      unsubTickers();
      unsubBots();
      clearInterval(refreshInterval);
      // Allow re-bootstrap if the component is remounted (dev StrictMode double-invoke)
      ranRef.current = false;
      _bootstrapped = false;
    };
  }, []);

  return null;
}
