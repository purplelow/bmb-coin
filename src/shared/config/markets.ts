import type { Market } from '@/types/domain';

/**
 * Seed data for the simulated Upbit KRW market.
 *
 * `seedPrice` is the simulator's starting point (illustrative KRW values) and
 * `volatility` is an approximate daily stdev used to shape the random walk.
 * Shared contract: the simulation service generates candles from this, and the
 * UI lists markets from this.
 */
export interface SeedMarket extends Market {
  seedPrice: number;
  /** Approximate daily volatility (fractional), e.g. 0.04 = 4%. */
  volatility: number;
}

export const SEED_MARKETS: SeedMarket[] = [
  { code: 'KRW-BTC', koreanName: '비트코인', englishName: 'Bitcoin', quote: 'KRW', base: 'BTC', seedPrice: 95_000_000, volatility: 0.035 },
  { code: 'KRW-ETH', koreanName: '이더리움', englishName: 'Ethereum', quote: 'KRW', base: 'ETH', seedPrice: 5_200_000, volatility: 0.045 },
  { code: 'KRW-SOL', koreanName: '솔라나', englishName: 'Solana', quote: 'KRW', base: 'SOL', seedPrice: 320_000, volatility: 0.06 },
  { code: 'KRW-XRP', koreanName: '리플', englishName: 'Ripple', quote: 'KRW', base: 'XRP', seedPrice: 3_200, volatility: 0.055 },
  { code: 'KRW-DOGE', koreanName: '도지코인', englishName: 'Dogecoin', quote: 'KRW', base: 'DOGE', seedPrice: 580, volatility: 0.08 },
  { code: 'KRW-ADA', koreanName: '에이다', englishName: 'Cardano', quote: 'KRW', base: 'ADA', seedPrice: 1_400, volatility: 0.06 },
  { code: 'KRW-LINK', koreanName: '체인링크', englishName: 'Chainlink', quote: 'KRW', base: 'LINK', seedPrice: 38_000, volatility: 0.065 },
  { code: 'KRW-AVAX', koreanName: '아발란체', englishName: 'Avalanche', quote: 'KRW', base: 'AVAX', seedPrice: 65_000, volatility: 0.07 },
  { code: 'KRW-DOT', koreanName: '폴카닷', englishName: 'Polkadot', quote: 'KRW', base: 'DOT', seedPrice: 12_000, volatility: 0.06 },
  { code: 'KRW-TRX', koreanName: '트론', englishName: 'TRON', quote: 'KRW', base: 'TRX', seedPrice: 380, volatility: 0.05 },
  { code: 'KRW-ATOM', koreanName: '코스모스', englishName: 'Cosmos', quote: 'KRW', base: 'ATOM', seedPrice: 9_500, volatility: 0.065 },
  { code: 'KRW-NEAR', koreanName: '니어프로토콜', englishName: 'NEAR Protocol', quote: 'KRW', base: 'NEAR', seedPrice: 7_800, volatility: 0.075 },
];

export const SEED_MARKET_BY_CODE: Record<string, SeedMarket> = Object.fromEntries(
  SEED_MARKETS.map((m) => [m.code, m]),
);

/** Default market focused on first load. */
export const DEFAULT_MARKET = 'KRW-BTC';
