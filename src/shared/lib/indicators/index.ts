/**
 * Technical indicator functions.
 * All outputs are aligned to the input length with leading nulls.
 * Pure TS — no React, no DOM.
 */

// ── SMA ─────────────────────────────────────────────────────────

/**
 * Simple Moving Average.
 * Output[i] is the average of values[i-period+1..i], null when there aren't
 * enough preceding values.
 */
export function sma(values: number[], period: number): (number | null)[] {
  if (period <= 0) return values.map(() => null);
  const out: (number | null)[] = new Array(values.length).fill(null);
  for (let i = period - 1; i < values.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += values[j] ?? 0;
    }
    out[i] = sum / period;
  }
  return out;
}

// ── EMA ─────────────────────────────────────────────────────────

/**
 * Exponential Moving Average.
 * Seeds from the first SMA(period), then applies the standard EMA multiplier.
 */
export function ema(values: number[], period: number): (number | null)[] {
  if (period <= 0 || values.length === 0) return values.map(() => null);
  const out: (number | null)[] = new Array(values.length).fill(null);
  const k = 2 / (period + 1);

  // Seed with SMA of first `period` elements
  let seedStart = -1;
  for (let i = period - 1; i < values.length; i++) {
    if (seedStart === -1) {
      // Compute initial SMA seed
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += values[j] ?? 0;
      }
      out[i] = sum / period;
      seedStart = i;
    } else {
      const prev = out[i - 1] ?? null;
      const cur = values[i] ?? 0;
      out[i] = prev !== null && prev !== undefined ? cur * k + prev * (1 - k) : null;
    }
  }
  return out;
}

// ── RSI ─────────────────────────────────────────────────────────

/**
 * Relative Strength Index using Wilder smoothing (RMA).
 * RSI = 100 - 100 / (1 + avgGain/avgLoss).
 * Output[i] is null for the first `period` indices.
 */
export function rsi(values: number[], period: number): (number | null)[] {
  if (period <= 0 || values.length < period + 1) {
    return values.map(() => null);
  }

  const out: (number | null)[] = new Array(values.length).fill(null);

  // Calculate price changes
  const changes: number[] = [];
  for (let i = 1; i < values.length; i++) {
    changes.push((values[i] ?? 0) - (values[i - 1] ?? 0));
  }

  // Seed: first avgGain / avgLoss from first `period` changes
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 0; i < period; i++) {
    const c = changes[i] ?? 0;
    if (c > 0) avgGain += c;
    else avgLoss += -c;
  }
  avgGain /= period;
  avgLoss /= period;

  // First RSI value aligns to index `period` in the output (needs period+1 prices)
  const firstRsiIdx = period;
  out[firstRsiIdx] =
    avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  // Continue with Wilder smoothing
  for (let i = period + 1; i < values.length; i++) {
    const c = changes[i - 1] ?? 0;
    const gain = c > 0 ? c : 0;
    const loss = c < 0 ? -c : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }

  return out;
}
