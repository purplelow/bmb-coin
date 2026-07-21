'use client';

import { useEffect } from 'react';
import { TradingEngine, type EnginePolicy } from '@/features/trading/engine';
import { getExchangeAdapter } from '@/services/exchange';
import { SEED_MARKETS } from '@/shared/config/markets';
import { useBotStore } from './botStore';
import { useMarketStore } from './marketStore';
import { usePortfolioStore } from './portfolioStore';
import { useSettingsStore } from './settingsStore';

/**
 * Live-trading policy for the engine, read fresh from the settings store:
 * - test mode: buy freely, no clamp.
 * - live mode: only auto-buy when the user has explicitly enabled it, and clamp
 *   every buy to the small-amount preset.
 */
/** 실시간 티커를 구독할 거래대금 상위 마켓 수. */
const TICKER_SUBSCRIBE_TOP = 50;

const enginePolicy: EnginePolicy = {
  canAutoBuy: () => {
    const s = useSettingsStore.getState();
    return s.tradingMode === 'test' || s.liveAutoBuy;
  },
  maxBuyAmount: () => {
    const s = useSettingsStore.getState();
    return s.tradingMode === 'live' ? s.orderPreset : Infinity;
  },
};

/** Spin up one trading session (market data + portfolio + engine) for the
 *  current adapter. Returns a teardown that fully unwinds it. */
function startSession(): () => void {
  const adapter = getExchangeAdapter();
  const isTest = useSettingsStore.getState().tradingMode === 'test';

  // 마켓 목록 로드 후 실시간 티커 구독. 전체(~270종)를 다 구독하면 웹소켓
  // 체결 스트림이 과해서, 실제로 화면에 살아 움직여야 하는 것만 구독한다:
  // 거래대금 상위 + 시드 + 관심 + 보유. 나머지 행은 부팅 시 스냅샷 가격을
  // 보여주고, 상세 화면 진입 시 그 마켓만 별도 구독으로 실시간이 된다.
  let stopped = false;
  let unsubTickers: (() => void) | null = null;
  // 잔고를 먼저(동시에) 불러와야 아래 held 계산에 보유 코인이 잡힌다 —
  // init()만 기다리면 보유 코인 티커가 구독에서 빠져 시세가 멈춰 보인다.
  const firstRefresh = usePortfolioStore.getState().refresh();
  void Promise.all([useMarketStore.getState().init(), firstRefresh])
    .then(() => {
      if (stopped) return;
      const loaded = useMarketStore.getState().markets.map((m) => m.code); // 거래대금순
      const held = usePortfolioStore
        .getState()
        .balances.filter((b) => b.currency !== 'KRW' && b.balance + b.locked > 0)
        .map((b) => `KRW-${b.currency}`);
      const codes = [
        ...new Set([
          ...loaded.slice(0, TICKER_SUBSCRIBE_TOP),
          ...SEED_MARKETS.map((m) => m.code),
          ...useSettingsStore.getState().watchlist,
          ...held,
        ]),
      ];
      unsubTickers = adapter.subscribeTickers(codes.length > 0 ? codes : loaded, (t) => {
        useMarketStore.getState().applyTicker(t);
      });
    });

  const refreshInterval = setInterval(() => {
    void usePortfolioStore.getState().refresh();
  }, 3000);

  // The in-browser engine only paper-trades (test mode). In LIVE mode the
  // 24/7 server engine (src/server/engine/runner.ts) is the sole executor —
  // running both would double-trade real money.
  let engineTeardown: (() => void) | null = null;
  if (isTest) {
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
    engine.syncBots(useBotStore.getState().bots);
    const unsubBots = useBotStore.subscribe((s) => {
      engine.syncBots(s.bots);
    });
    engine.start();
    engineTeardown = () => {
      engine.stop();
      unsubBots();
    };
  }

  return () => {
    stopped = true;
    engineTeardown?.();
    unsubTickers?.();
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
