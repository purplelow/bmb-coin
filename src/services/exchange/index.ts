/**
 * Exchange adapter factory + public re-exports.
 *
 * Mode-aware: returns the Mock adapter in test mode and the Upbit (live) adapter
 * in live mode, reading the current mode from the settings store at call time.
 * Each concrete adapter is a lazily-created singleton.
 */

import { useSettingsStore } from '@/stores/settingsStore';
import { MockExchangeAdapter } from './mock/MockExchangeAdapter';
import { UpbitExchangeAdapter } from './upbit/UpbitExchangeAdapter';
import type { ExchangeAdapter } from './types';

// Re-export the shared interface types for convenience
export type { ExchangeAdapter, PlaceOrderInput, TickerListener } from './types';

let _mock: MockExchangeAdapter | null = null;
let _upbit: UpbitExchangeAdapter | null = null;

export function getExchangeAdapter(): ExchangeAdapter {
  const mode = useSettingsStore.getState().tradingMode;
  if (mode === 'live') {
    if (!_upbit) _upbit = new UpbitExchangeAdapter();
    return _upbit;
  }
  if (!_mock) _mock = new MockExchangeAdapter();
  return _mock;
}
