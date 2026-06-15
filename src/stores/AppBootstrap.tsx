"use client";

import { useEffect } from "react";
import { getExchangeAdapter } from "@/services/exchange";
import { TradingEngine, type EnginePolicy } from "@/features/trading/engine";
import { SEED_MARKETS } from "@/shared/config/markets";
import { useMarketStore } from "./marketStore";
import { usePortfolioStore } from "./portfolioStore";
import { useBotStore } from "./botStore";
import { useSettingsStore } from "./settingsStore";

/**
 * Live-trading policy for the engine, read fresh from the settings store:
 * - test mode: buy freely, no clamp.
 * - live mode: only auto-buy when the user has explicitly enabled it, and clamp
 *   every buy to the small-amount preset.
 */
const enginePolicy: EnginePolicy = {
  canAutoBuy: () => {
    const s = useSettingsStore.getState();
    return s.tradingMode === "test" || s.liveAutoBuy;
  },
  maxBuyAmount: () => {
    const s = useSettingsStore.getState();
    return s.tradingMode === "live" ? s.orderPreset : Infinity;
  },
};

/** Spin up one trading session (market data + portfolio + engine) for the
 *  current adapter. Returns a teardown that fully unwinds it. */
function startSession(): () => void {
  const adapter = getExchangeAdapter();
  const allMarketCodes = SEED_MARKETS.map((m) => m.code);

  void useMarketStore.getState().init();
  void usePortfolioStore.getState().refresh();

  const engine = new TradingEngine(
    adapter,
    {
      onSignal: (e) => useBotStore.getState().addSignal(e),
      onBotUpdate: (id, patch) => useBotStore.getState().updateBot(id, patch),
      onOrder: (o) => {
        void usePortfolioStore.getState().addOrder(o);
      },
    },
    enginePolicy,
  );

  const unsubTickers = adapter.subscribeTickers(allMarketCodes, (t) => {
    useMarketStore.getState().applyTicker(t);
  });

  const refreshInterval = setInterval(() => {
    void usePortfolioStore.getState().refresh();
  }, 3000);

  engine.syncBots(useBotStore.getState().bots);
  const unsubBots = useBotStore.subscribe((s) => {
    engine.syncBots(s.bots);
  });

  engine.start();

  return () => {
    engine.stop();
    unsubTickers();
    unsubBots();
    clearInterval(refreshInterval);
  };
}

export default function AppBootstrap(): null {
  useEffect(() => {
    let teardown = startSession();
    let currentMode = useSettingsStore.getState().tradingMode;

    // Re-bootstrap the whole session when the user flips test <-> live, so the
    // right adapter, balances, and market data are loaded.
    const unsubMode = useSettingsStore.subscribe((s) => {
      if (s.tradingMode !== currentMode) {
        currentMode = s.tradingMode;
        teardown();
        teardown = startSession();
      }
    });

    return () => {
      teardown();
      unsubMode();
    };
  }, []);

  return null;
}
