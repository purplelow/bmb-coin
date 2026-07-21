'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import styled from '@emotion/styled';
import { STRATEGY_DEFS, createDefaultStrategy } from '@/features/trading/strategies';
import { SEED_MARKETS } from '@/shared/config/markets';
import {
  TextField,
  NumberField,
  SegmentedControl,
  Slider,
  Switch,
  Button,
  SectionHeader,
} from '@/shared/ui';
import { useBotStore } from '@/stores/botStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useUiStore } from '@/stores/uiStore';
import type { Bot, Market, StrategyType, StrategyParams, RiskParams } from '@/types/domain';

// ── Styled ─────────────────────────────────────────────────────────

const Form = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(5)};
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(3)};
`;

const FieldLabel = styled.span`
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  color: ${({ theme }) => theme.color.text.mid};
`;

const SliderRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(2)};
`;

const SliderLabelRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SliderValue = styled.span`
  font-family: ${({ theme }) => theme.font.mono};
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.color.accent.primary};
`;

const MarketChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space(2)};
`;

const MarketChip = styled.button<{ active: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  padding: 0 ${({ theme }) => theme.space(3)};
  line-height: 1;
  border-radius: ${({ theme }) => theme.radius.pill};
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  cursor: pointer;
  border: 1px solid;
  transition: all ${({ theme }) => theme.motion.fast};
  -webkit-tap-highlight-color: transparent;

  ${({ active, theme }) =>
    active
      ? `
    background: ${theme.color.accent.primarySoft};
    border-color: ${theme.color.accent.primary};
    color: ${theme.color.accent.primary};
  `
      : `
    background: ${theme.color.glass.surface};
    border-color: ${theme.color.glass.border};
    color: ${theme.color.text.mid};
    &:hover {
      border-color: ${theme.color.glass.borderStrong};
      color: ${theme.color.text.high};
    }
  `}

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.accent.primary};
    outline-offset: 2px;
  }
`;

const StrategyDesc = styled.p`
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.color.text.low};
  line-height: 1.55;
  margin: 0;
`;

const Divider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.color.glass.border};
`;

const RiskRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(2)};
`;

const RiskSwitchRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const RiskHelperText = styled.p`
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.color.text.low};
  line-height: 1.55;
  margin: 0;
`;

const SpreadWarnText = styled.p`
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.color.status.warning};
  line-height: 1.55;
  margin: 0;
`;

// ── Helpers ────────────────────────────────────────────────────────

const STRATEGY_OPTIONS = (Object.keys(STRATEGY_DEFS) as StrategyType[]).map((type) => ({
  label: STRATEGY_DEFS[type].label,
  value: type,
}));

function getParamValue(strategy: StrategyParams, key: string): number {
  const params = strategy.params as unknown as Record<string, number>;
  return params[key] ?? 0;
}

function setParamValue(strategy: StrategyParams, key: string, value: number): StrategyParams {
  const merged = {
    ...strategy,
    params: {
      ...(strategy.params as unknown as Record<string, number>),
      [key]: value,
    },
  };
  return merged as unknown as StrategyParams;
}

const SEED_AS_MARKETS: Market[] = SEED_MARKETS.map(
  ({ code, koreanName, englishName, quote, base }) => ({
    code,
    koreanName,
    englishName,
    quote,
    base,
  }),
);

/** 검색 결과 chip 수 상한 — 전체 KRW 마켓(~180종)을 다 그리지 않는다. */
const MARKET_RESULT_CAP = 24;

/**
 * 리스크 프리셋 — 매매 스타일별 손절/익절 권장값을 한 번에 설정.
 * 수수료+슬리피지가 왕복 ~0.1%+라, 익절 폭이 그보다 충분히 커야 남는다.
 */
const RISK_PRESETS = [
  {
    key: 'scalp',
    label: '초단타',
    sl: 1,
    tp: 2,
    desc: '작은 등락에 바로 반응합니다. 매매가 잦아 수수료 비중이 커요.',
  },
  {
    key: 'day',
    label: '단타',
    sl: 3,
    tp: 5,
    desc: '하루 안팎의 짧은 흐름을 노립니다. 무난한 출발점이에요.',
  },
  {
    key: 'swing',
    label: '장타',
    sl: 7,
    tp: 15,
    desc: '큰 흐름을 따라갑니다. 일시적인 하락은 버티고 길게 가져가요.',
  },
  {
    key: 'highrisk',
    label: '하이리스크',
    sl: 15,
    tp: 30,
    desc: '변동을 크게 허용하고 큰 수익을 노립니다. 손실 폭도 그만큼 커요.',
  },
] as const;

type RiskPreset = (typeof RISK_PRESETS)[number];

/**
 * 캔들 주기 선택지. 1분봉 MA 교차는 노이즈에 몇 분마다 사고팔아 수수료·
 * 스프레드에 잔고가 갈리므로, 새 봇 기본값은 15분봉이다.
 */
const CANDLE_UNIT_OPTIONS = [
  { label: '1분', value: '1' },
  { label: '5분', value: '5' },
  { label: '15분', value: '15' },
  { label: '1시간', value: '60' },
];
const DEFAULT_CANDLE_UNIT = 15;

// ── Component ──────────────────────────────────────────────────────

interface CreateBotFormProps {
  onClose: () => void;
  /** 있으면 편집 모드 — 기존 값으로 초기화하고 저장 시 updateBot. */
  bot?: Bot;
}

export function CreateBotForm({ onClose, bot }: CreateBotFormProps) {
  const [name, setName] = useState(bot?.name ?? '');
  const [market, setMarket] = useState(bot?.market ?? SEED_MARKETS[0]?.code ?? 'KRW-BTC');
  const [strategyType, setStrategyType] = useState<StrategyType>(
    bot?.strategy.type ?? 'ma_cross',
  );
  const [strategy, setStrategy] = useState<StrategyParams>(
    bot?.strategy ?? createDefaultStrategy('ma_cross'),
  );
  const [slOn, setSlOn] = useState(bot ? bot.risk?.stopLossPct != null : true);
  const [sl, setSl] = useState(bot?.risk?.stopLossPct ?? 5);
  const [tpOn, setTpOn] = useState(bot ? bot.risk?.takeProfitPct != null : true);
  const [tp, setTp] = useState(bot?.risk?.takeProfitPct ?? 10);
  // 편집 시 candleUnit이 없는 구형 봇은 실제 동작대로 1분으로 보여준다.
  const [candleUnit, setCandleUnit] = useState<number>(
    bot ? (bot.candleUnit ?? 1) : DEFAULT_CANDLE_UNIT,
  );

  const createBot = useBotStore((s) => s.createBot);
  const updateBot = useBotStore((s) => s.updateBot);
  const showToast = useUiStore((s) => s.showToast);
  const isLive = useSettingsStore((s) => s.tradingMode === 'live');

  // 라이브 모드: 업비트 전체 KRW 마켓을 1회 조회해 검색으로 고를 수 있게 한다.
  // 테스트 모드: 시뮬레이터가 캔들을 만드는 시드 12종만 선택 가능.
  const [allMarkets, setAllMarkets] = useState<Market[] | null>(null);
  const [marketQuery, setMarketQuery] = useState('');
  const [caps, setCaps] = useState<{ maxOrderKRW: number; dailyCapKRW: number } | null>(null);

  useEffect(() => {
    if (!isLive) return;
    let cancelled = false;
    (async () => {
      try {
        const [marketsRes, statusRes] = await Promise.all([
          fetch('/api/upbit/markets'),
          fetch('/api/upbit/status'),
        ]);
        if (!cancelled && marketsRes.ok) {
          setAllMarkets((await marketsRes.json()) as Market[]);
        }
        if (!cancelled && statusRes.ok) {
          setCaps((await statusRes.json()) as { maxOrderKRW: number; dailyCapKRW: number });
        }
      } catch {
        // 실패 시 시드 12종으로만 동작 — 치명적이지 않다.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLive]);

  // 라이브 모드: 선택 마켓의 호가 스프레드 조회 — 저가 코인 경고용.
  const [spread, setSpread] = useState<{ spreadPct: number; maxSpreadPct: number } | null>(null);
  useEffect(() => {
    if (!isLive) {
      setSpread(null);
      return;
    }
    let cancelled = false;
    setSpread(null);
    (async () => {
      try {
        const res = await fetch(`/api/upbit/orderbook?market=${encodeURIComponent(market)}`);
        if (!cancelled && res.ok) {
          setSpread((await res.json()) as { spreadPct: number; maxSpreadPct: number });
        }
      } catch {
        // 조회 실패 시 경고 없이 진행 — 서버 엔진이 매수 시점에 다시 검사한다.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLive, market]);

  const marketChoices = useMemo(() => {
    const pool = isLive && allMarkets ? allMarkets : SEED_AS_MARKETS;
    const q = marketQuery.trim().toLowerCase();
    let list: Market[];
    if (!q) {
      // 검색어가 없으면 시드 12종만 기본 노출 (전체를 다 그리지 않음).
      list = SEED_AS_MARKETS;
    } else {
      list = pool
        .filter(
          (m) =>
            m.koreanName.toLowerCase().includes(q) ||
            m.englishName.toLowerCase().includes(q) ||
            m.base.toLowerCase().includes(q) ||
            m.code.toLowerCase().includes(q),
        )
        .slice(0, MARKET_RESULT_CAP);
    }
    // 현재 선택된 마켓은 목록에 없어도 항상 맨 앞에 보여준다.
    if (!list.some((m) => m.code === market)) {
      const selected =
        pool.find((m) => m.code === market) ??
        ({ code: market, koreanName: market, englishName: market, quote: 'KRW', base: market.replace('KRW-', '') } as Market);
      list = [selected, ...list];
    }
    return list;
  }, [isLive, allMarkets, marketQuery, market]);

  const handleStrategyTypeChange = useCallback((v: string) => {
    const type = v as StrategyType;
    setStrategyType(type);
    setStrategy(createDefaultStrategy(type));
  }, []);

  const handleSliderChange = useCallback((key: string, value: number) => {
    setStrategy((prev) => setParamValue(prev, key, value));
  }, []);

  const applyRiskPreset = useCallback((preset: RiskPreset) => {
    setSlOn(true);
    setTpOn(true);
    setSl(preset.sl);
    setTp(preset.tp);
  }, []);

  // 현재 손절/익절 값이 프리셋과 정확히 일치할 때만 active — 슬라이더를
  // 직접 움직이면 자동으로 해제된다 (별도 상태 없이 값에서 유도).
  const activeRiskPreset =
    slOn && tpOn ? RISK_PRESETS.find((p) => p.sl === sl && p.tp === tp) : undefined;

  const handleSubmit = useCallback(() => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      showToast('봇 이름을 입력해 주세요.', 'danger');
      return;
    }
    const risk: RiskParams = {
      stopLossPct: slOn ? sl : null,
      takeProfitPct: tpOn ? tp : null,
    };
    if (bot) {
      updateBot(bot.id, { name: trimmedName, market, strategy, risk, candleUnit });
      showToast(`"${trimmedName}" 봇이 수정되었습니다.`, 'success');
    } else {
      createBot({ name: trimmedName, market, strategy, risk, candleUnit });
      showToast(`"${trimmedName}" 봇이 생성되었습니다.`, 'success');
    }
    onClose();
  }, [name, market, strategy, slOn, sl, tpOn, tp, candleUnit, bot, createBot, updateBot, showToast, onClose]);

  const def = STRATEGY_DEFS[strategyType];
  const orderAmountField = def.fields.find((f) => f.key === 'orderAmount');
  const stratParamFields = def.fields.filter((f) => f.key !== 'orderAmount');

  return (
    <Form>
      {/* Bot name */}
      <TextField label="봇 이름" value={name} onChange={setName} placeholder="내 자동매매 봇" />

      <Divider />

      {/* Market picker */}
      <FieldGroup>
        <SectionHeader title="마켓 선택" />
        {isLive && (
          <TextField
            value={marketQuery}
            onChange={setMarketQuery}
            placeholder="전체 KRW 마켓 검색 (코인명, 심볼)"
          />
        )}
        <MarketChipRow>
          {marketChoices.map((m) => (
            <MarketChip
              key={m.code}
              type="button"
              active={market === m.code}
              title={m.koreanName}
              onClick={() => setMarket(m.code)}
            >
              {m.base}
            </MarketChip>
          ))}
        </MarketChipRow>
        {spread !== null && spread.spreadPct > spread.maxSpreadPct && (
          <SpreadWarnText>
            ⚠ 이 코인은 호가 간격이 넓어(현재 스프레드 {spread.spreadPct.toFixed(2)}%) 시장가로
            사고파는 것만으로 매번 그만큼 손실이 확정됩니다. 서버가 스프레드{' '}
            {spread.maxSpreadPct}% 초과 시 자동매수를 건너뜁니다 — 다른 코인을 권장해요.
          </SpreadWarnText>
        )}
      </FieldGroup>

      <Divider />

      {/* Strategy picker */}
      <FieldGroup>
        <SectionHeader title="전략 선택" />
        <SegmentedControl
          options={STRATEGY_OPTIONS}
          value={strategyType}
          onChange={handleStrategyTypeChange}
          fullWidth
        />
        <StrategyDesc>{def.description}</StrategyDesc>
      </FieldGroup>

      <Divider />

      {/* Candle interval */}
      <FieldGroup>
        <SectionHeader title="캔들 주기" />
        <SegmentedControl
          options={CANDLE_UNIT_OPTIONS}
          value={String(candleUnit)}
          onChange={(v) => setCandleUnit(Number(v))}
          fullWidth
        />
        <RiskHelperText>
          전략이 신호를 평가하는 봉 단위입니다. 짧을수록 매매가 잦아져 수수료·스프레드 부담이
          커집니다. 처음이라면 15분 이상을 권장해요.
        </RiskHelperText>
      </FieldGroup>

      <Divider />

      {/* Dynamic param sliders */}
      {stratParamFields.length > 0 && (
        <FieldGroup>
          <SectionHeader title="파라미터 설정" />
          {stratParamFields.map((field) => {
            const val = getParamValue(strategy, field.key);
            return (
              <SliderRow key={field.key}>
                <SliderLabelRow>
                  <FieldLabel>{field.label}</FieldLabel>
                  <SliderValue>
                    {val}
                    {field.unit ? ` ${field.unit}` : ''}
                  </SliderValue>
                </SliderLabelRow>
                <Slider
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  value={val}
                  onChange={(v) => handleSliderChange(field.key, v)}
                />
              </SliderRow>
            );
          })}
        </FieldGroup>
      )}

      <Divider />

      {/* Risk management */}
      <FieldGroup>
        <SectionHeader title="리스크 관리" />

        {/* Style presets — one-tap SL/TP for users unsure of the numbers */}
        <MarketChipRow>
          {RISK_PRESETS.map((p) => (
            <MarketChip
              key={p.key}
              type="button"
              active={activeRiskPreset?.key === p.key}
              title={`손절 -${p.sl}% · 익절 +${p.tp}%`}
              onClick={() => applyRiskPreset(p)}
            >
              {p.label}
            </MarketChip>
          ))}
        </MarketChipRow>
        {activeRiskPreset && (
          <RiskHelperText>
            {activeRiskPreset.desc} (손절 -{activeRiskPreset.sl}% · 익절 +{activeRiskPreset.tp}%)
          </RiskHelperText>
        )}

        {/* Stop-loss */}
        <RiskRow>
          <RiskSwitchRow>
            <FieldLabel>손절</FieldLabel>
            <Switch checked={slOn} onChange={setSlOn} />
          </RiskSwitchRow>
          {slOn && (
            <SliderRow>
              <SliderLabelRow>
                <FieldLabel>손절 비율</FieldLabel>
                <SliderValue>-{sl}%</SliderValue>
              </SliderLabelRow>
              <Slider min={1} max={30} step={1} value={sl} onChange={setSl} />
            </SliderRow>
          )}
        </RiskRow>

        {/* Take-profit */}
        <RiskRow>
          <RiskSwitchRow>
            <FieldLabel>익절</FieldLabel>
            <Switch checked={tpOn} onChange={setTpOn} />
          </RiskSwitchRow>
          {tpOn && (
            <SliderRow>
              <SliderLabelRow>
                <FieldLabel>익절 비율</FieldLabel>
                <SliderValue>+{tp}%</SliderValue>
              </SliderLabelRow>
              <Slider min={1} max={50} step={1} value={tp} onChange={setTp} />
            </SliderRow>
          )}
        </RiskRow>

        <RiskHelperText>
          평균 매수가 대비 등락률 기준. 전략 신호와 무관하게 즉시 시장가 매도합니다.
        </RiskHelperText>
      </FieldGroup>

      {/* Order amount */}
      {orderAmountField !== undefined && (
        <FieldGroup>
          <NumberField
            label={orderAmountField.label}
            value={getParamValue(strategy, 'orderAmount')}
            onChange={(v) => handleSliderChange('orderAmount', v)}
            min={orderAmountField.min}
            max={orderAmountField.max}
            step={orderAmountField.step}
            suffix="원"
          />
          {isLive && (
            <RiskHelperText>
              매수 신호 1회당 이 금액으로 삽니다.
              {caps
                ? ` 서버 한도: 1회 ₩${caps.maxOrderKRW.toLocaleString()} · 일 ₩${caps.dailyCapKRW.toLocaleString()} — 초과분은 한도까지로 줄여 실행됩니다.`
                : ' 서버의 1회/일 한도 안에서 실행됩니다.'}
            </RiskHelperText>
          )}
        </FieldGroup>
      )}

      {/* Submit */}
      <Button variant="primary" size="lg" fullWidth onClick={handleSubmit} type="button">
        {bot ? '저장' : '봇 생성'}
      </Button>
    </Form>
  );
}
