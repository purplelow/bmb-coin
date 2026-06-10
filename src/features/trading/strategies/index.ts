/**
 * Trading strategy definitions + evaluation.
 * Pure TS — no React, no DOM.
 */

import type { Candle, Signal, StrategyParams, StrategyType } from '@/types/domain';
import type { MaCrossParams, RsiParams } from '@/types/domain';
import { sma, rsi as computeRsi } from '@/shared/lib/indicators';

// ── Types ────────────────────────────────────────────────────────

export interface ParamField {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
}

export interface StrategyDef {
  type: StrategyType;
  label: string;
  description: string;
  defaultParams: StrategyParams;
  fields: ParamField[];
}

// ── Strategy definitions ─────────────────────────────────────────

const MA_CROSS_DEFAULT: StrategyParams = {
  type: 'ma_cross',
  params: {
    shortPeriod: 7,
    longPeriod: 25,
    orderAmount: 500_000,
  },
};

const RSI_DEFAULT: StrategyParams = {
  type: 'rsi',
  params: {
    period: 14,
    oversold: 30,
    overbought: 70,
    orderAmount: 500_000,
  },
};

export const STRATEGY_DEFS: Record<StrategyType, StrategyDef> = {
  ma_cross: {
    type: 'ma_cross',
    label: '이동평균 교차',
    description:
      '단기 이동평균이 장기 이동평균을 상향 돌파할 때 매수(골든크로스), 하향 이탈 시 매도(데드크로스)합니다.',
    defaultParams: MA_CROSS_DEFAULT,
    fields: [
      {
        key: 'shortPeriod',
        label: '단기 기간',
        min: 2,
        max: 50,
        step: 1,
        unit: '봉',
      },
      {
        key: 'longPeriod',
        label: '장기 기간',
        min: 5,
        max: 200,
        step: 1,
        unit: '봉',
      },
      {
        key: 'orderAmount',
        label: '주문 금액',
        min: 10_000,
        max: 10_000_000,
        step: 10_000,
        unit: '원',
      },
    ],
  },
  rsi: {
    type: 'rsi',
    label: 'RSI 반전',
    description:
      'RSI가 과매도 기준 이하로 내려가면 매수, 과매수 기준 이상으로 올라가면 매도합니다.',
    defaultParams: RSI_DEFAULT,
    fields: [
      {
        key: 'period',
        label: 'RSI 기간',
        min: 2,
        max: 50,
        step: 1,
        unit: '봉',
      },
      {
        key: 'oversold',
        label: '과매도 기준',
        min: 10,
        max: 50,
        step: 1,
      },
      {
        key: 'overbought',
        label: '과매수 기준',
        min: 50,
        max: 90,
        step: 1,
      },
      {
        key: 'orderAmount',
        label: '주문 금액',
        min: 10_000,
        max: 10_000_000,
        step: 10_000,
        unit: '원',
      },
    ],
  },
};

// ── Evaluation ───────────────────────────────────────────────────

export function evaluateStrategy(
  strategy: StrategyParams,
  candles: Candle[],
): { signal: Signal; reason: string } {
  if (candles.length === 0) {
    return { signal: 'hold', reason: '데이터 없음' };
  }

  const closes = candles.map((c) => c.close);

  if (strategy.type === 'ma_cross') {
    const { shortPeriod, longPeriod } = strategy.params as MaCrossParams;
    const shortSma = sma(closes, shortPeriod);
    const longSma = sma(closes, longPeriod);

    const len = closes.length;
    if (len < 2) return { signal: 'hold', reason: '데이터 부족' };

    const curShort = shortSma[len - 1] ?? null;
    const curLong = longSma[len - 1] ?? null;
    const prevShort = shortSma[len - 2] ?? null;
    const prevLong = longSma[len - 2] ?? null;

    if (
      curShort === null ||
      curLong === null ||
      prevShort === null ||
      prevLong === null
    ) {
      return { signal: 'hold', reason: '지표 계산 중' };
    }

    // After null checks, TS now knows these are `number`
    const cs: number = curShort;
    const cl: number = curLong;
    const ps: number = prevShort;
    const pl: number = prevLong;

    // Golden cross: short crossed above long
    if (ps <= pl && cs > cl) {
      return {
        signal: 'buy',
        reason: `골든크로스 (${shortPeriod} > ${longPeriod})`,
      };
    }

    // Dead cross: short crossed below long
    if (ps >= pl && cs < cl) {
      return {
        signal: 'sell',
        reason: `데드크로스 (${shortPeriod} < ${longPeriod})`,
      };
    }

    return { signal: 'hold', reason: '추세 유지' };
  }

  if (strategy.type === 'rsi') {
    const { period, oversold, overbought } = strategy.params as RsiParams;
    const rsiValues = computeRsi(closes, period);
    const lastRsi = rsiValues[rsiValues.length - 1];

    if (lastRsi === null || lastRsi === undefined) {
      return { signal: 'hold', reason: '지표 계산 중' };
    }

    const rsiDisplay = lastRsi.toFixed(1);

    if (lastRsi <= oversold) {
      return {
        signal: 'buy',
        reason: `RSI ${rsiDisplay} · 과매도`,
      };
    }

    if (lastRsi >= overbought) {
      return {
        signal: 'sell',
        reason: `RSI ${rsiDisplay} · 과매수`,
      };
    }

    return { signal: 'hold', reason: `RSI ${rsiDisplay} · 중립` };
  }

  return { signal: 'hold', reason: '알 수 없는 전략' };
}

// ── Default strategy factory ─────────────────────────────────────

export function createDefaultStrategy(type: StrategyType): StrategyParams {
  const def = STRATEGY_DEFS[type];
  // Deep clone to avoid shared mutable state
  return JSON.parse(JSON.stringify(def.defaultParams)) as StrategyParams;
}
