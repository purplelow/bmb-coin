/**
 * Formatting utilities.
 * Pure TS — no React, no DOM dependencies.
 */

// ── KRW ────────────────────────────────────────────────────────

/**
 * Format a KRW value.
 * - compact: uses 만(10,000) / 억(100,000,000) suffixes for large values.
 * - default: "₩123,456" with thousands grouping.
 */
export function formatKRW(
  value: number,
  opts?: { compact?: boolean; decimals?: number },
): string {
  const compact = opts?.compact ?? false;
  const decimals = opts?.decimals;

  if (compact) {
    const abs = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    if (abs >= 100_000_000) {
      const v = abs / 100_000_000;
      const dec = decimals ?? (v < 10 ? 2 : v < 100 ? 1 : 0);
      return `${sign}₩${v.toFixed(dec)}억`;
    }
    if (abs >= 10_000) {
      const v = abs / 10_000;
      const dec = decimals ?? (v < 10 ? 2 : v < 100 ? 1 : 0);
      return `${sign}₩${v.toFixed(dec)}만`;
    }
    const dec = decimals ?? 0;
    return `${sign}₩${abs.toFixed(dec)}`;
  }

  const dec = decimals ?? 0;
  return (
    '₩' +
    value.toLocaleString('ko-KR', {
      minimumFractionDigits: dec,
      maximumFractionDigits: dec,
    })
  );
}

// ── Price ───────────────────────────────────────────────────────

/**
 * Format a price adapting decimal places to magnitude.
 * >= 1000 -> 0 decimals
 * >= 100  -> 1 decimal
 * >= 1    -> 2 decimals
 * < 1     -> up to 4 significant decimals, trailing zeros trimmed
 */
export function formatPrice(value: number): string {
  const abs = Math.abs(value);
  let dec: number;
  if (abs >= 1000) {
    dec = 0;
  } else if (abs >= 100) {
    dec = 1;
  } else if (abs >= 1) {
    dec = 2;
  } else {
    // Up to 4 decimals, trim trailing zeros
    const fixed = value.toFixed(4).replace(/\.?0+$/, '');
    return fixed;
  }
  return value.toLocaleString('ko-KR', {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
}

// ── Generic number ──────────────────────────────────────────────

/** Format a plain number with given decimal places (default 2). */
export function formatNumber(value: number, decimals = 2): string {
  return value.toLocaleString('ko-KR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// ── Percent ─────────────────────────────────────────────────────

/**
 * Format a fractional rate as percent.
 * Input 0.0123 -> "1.23%"
 * signed: true -> prefix "+" for positives.
 */
export function formatPercent(
  rate: number,
  opts?: { signed?: boolean },
): string {
  const signed = opts?.signed ?? false;
  const pct = (rate * 100).toFixed(2);
  const num = parseFloat(pct);
  if (signed && num > 0) return `+${pct}%`;
  return `${pct}%`;
}

// ── Volume / quantity ───────────────────────────────────────────

/**
 * Format a trading volume (large KRW amounts).
 * Uses compact notation like formatKRW compact.
 */
export function formatVolume(value: number): string {
  return formatKRW(value, { compact: true });
}

/**
 * Format a base-asset quantity with up to 8 significant decimals, trimming
 * trailing zeros.
 */
export function formatQuantity(value: number): string {
  if (value === 0) return '0';
  const fixed = value.toFixed(8).replace(/\.?0+$/, '');
  return fixed;
}

// ── Time ────────────────────────────────────────────────────────

/** Format epoch-ms as "HH:MM". */
export function formatTime(ts: number): string {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/** Format epoch-ms as "MM.DD HH:MM". */
export function formatDateTime(ts: number): string {
  const d = new Date(ts);
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${mo}.${dd} ${hh}:${mm}`;
}
