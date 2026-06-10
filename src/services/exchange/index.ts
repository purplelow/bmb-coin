/**
 * Exchange adapter factory + public re-exports.
 *
 * Returns MockExchangeAdapter in test mode, UpbitExchangeAdapter otherwise.
 * The singleton is created on first call and reused thereafter.
 */

import { isTestMode } from '@/shared/config';
import { MockExchangeAdapter } from './mock/MockExchangeAdapter';
import { UpbitExchangeAdapter } from './upbit/UpbitExchangeAdapter';

// Re-export the shared interface types for convenience
export type { ExchangeAdapter, PlaceOrderInput, TickerListener } from './types';

let _adapter: MockExchangeAdapter | UpbitExchangeAdapter | null = null;

export function getExchangeAdapter(): MockExchangeAdapter | UpbitExchangeAdapter {
  if (!_adapter) {
    _adapter = isTestMode
      ? new MockExchangeAdapter()
      : new UpbitExchangeAdapter();
  }
  return _adapter;
}
