/**
 * Live-trading safety rails — SERVER ONLY.
 *
 * These are the *authoritative* limits. The client UI also shows caps, but a
 * client can be tampered with, so every buy order is re-checked here before it
 * is ever sent to Upbit.
 *
 * Note: the daily ledger is in-memory and per server process — it resets on
 * restart. The per-order cap is the hard floor that always holds; the daily cap
 * is best-effort accounting on top of it.
 */

export function maxOrderKRW(): number {
  const v = Number(process.env.UPBIT_MAX_ORDER_KRW);
  return Number.isFinite(v) && v > 0 ? v : 100_000;
}

export function dailyCapKRW(): number {
  const v = Number(process.env.UPBIT_DAILY_CAP_KRW);
  return Number.isFinite(v) && v > 0 ? v : 500_000;
}

/**
 * 매수 허용 최대 호가 스프레드(%). 저가 코인(예: 115원짜리 DOGE)은 호가
 * 1틱이 0.9%라 시장가 왕복만으로 그만큼 손실이 확정된다 — 스프레드가 이
 * 값을 넘는 마켓에서는 엔진이 매수를 건너뛴다.
 */
export function maxSpreadPct(): number {
  const v = Number(process.env.UPBIT_MAX_SPREAD_PCT);
  return Number.isFinite(v) && v > 0 ? v : 0.3;
}

interface Ledger {
  day: string;
  spent: number;
}

let ledger: Ledger = { day: '', spent: 0 };

function today(): string {
  // UTC day key — deterministic and timezone-independent.
  return new Date().toISOString().slice(0, 10);
}

function currentLedger(): Ledger {
  const day = today();
  if (ledger.day !== day) {
    ledger = { day, spent: 0 };
  }
  return ledger;
}

export function dailySpent(): number {
  return currentLedger().spent;
}

export function dailyRemaining(): number {
  return Math.max(0, dailyCapKRW() - dailySpent());
}

export class CapError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CapError';
  }
}

/** Throw a CapError if a buy of `amountKRW` would breach the per-order or daily cap. */
export function assertBuyWithinCaps(amountKRW: number): void {
  if (!Number.isFinite(amountKRW) || amountKRW <= 0) {
    throw new CapError('주문 금액이 올바르지 않습니다.');
  }
  const perOrder = maxOrderKRW();
  if (amountKRW > perOrder) {
    throw new CapError(`1회 주문 한도(₩${perOrder.toLocaleString()})를 초과했습니다.`);
  }
  const remaining = dailyRemaining();
  if (amountKRW > remaining) {
    throw new CapError(`오늘 매수 한도를 초과했습니다. (남은 한도 ₩${remaining.toLocaleString()})`);
  }
}

/** Record a successful buy against the daily ledger. */
export function recordBuy(amountKRW: number): void {
  const l = currentLedger();
  l.spent += amountKRW;
}
