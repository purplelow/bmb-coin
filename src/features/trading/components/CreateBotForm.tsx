"use client";

import React, { useState, useCallback } from "react";
import styled from "@emotion/styled";
import {
  TextField,
  NumberField,
  SegmentedControl,
  Slider,
  Switch,
  Button,
  SectionHeader,
} from "@/shared/ui";
import { SEED_MARKETS } from "@/shared/config/markets";
import {
  STRATEGY_DEFS,
  createDefaultStrategy,
} from "@/features/trading/strategies";
import { useBotStore } from "@/stores/botStore";
import { useUiStore } from "@/stores/uiStore";
import type { StrategyType, StrategyParams, RiskParams } from "@/types/domain";

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

// ── Helpers ────────────────────────────────────────────────────────

const STRATEGY_OPTIONS = (Object.keys(STRATEGY_DEFS) as StrategyType[]).map(
  (type) => ({ label: STRATEGY_DEFS[type].label, value: type })
);

function getParamValue(strategy: StrategyParams, key: string): number {
  const params = strategy.params as unknown as Record<string, number>;
  return params[key] ?? 0;
}

function setParamValue(
  strategy: StrategyParams,
  key: string,
  value: number
): StrategyParams {
  const merged = {
    ...strategy,
    params: {
      ...(strategy.params as unknown as Record<string, number>),
      [key]: value,
    },
  };
  return merged as unknown as StrategyParams;
}

// ── Component ──────────────────────────────────────────────────────

interface CreateBotFormProps {
  onClose: () => void;
}

export function CreateBotForm({ onClose }: CreateBotFormProps) {
  const [name, setName] = useState("");
  const [market, setMarket] = useState(
    SEED_MARKETS[0]?.code ?? "KRW-BTC"
  );
  const [strategyType, setStrategyType] = useState<StrategyType>("ma_cross");
  const [strategy, setStrategy] = useState<StrategyParams>(
    createDefaultStrategy("ma_cross")
  );
  const [slOn, setSlOn] = useState(true);
  const [sl, setSl] = useState(5);
  const [tpOn, setTpOn] = useState(true);
  const [tp, setTp] = useState(10);

  const createBot = useBotStore((s) => s.createBot);
  const showToast = useUiStore((s) => s.showToast);

  const handleStrategyTypeChange = useCallback((v: string) => {
    const type = v as StrategyType;
    setStrategyType(type);
    setStrategy(createDefaultStrategy(type));
  }, []);

  const handleSliderChange = useCallback(
    (key: string, value: number) => {
      setStrategy((prev) => setParamValue(prev, key, value));
    },
    []
  );

  const handleSubmit = useCallback(() => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      showToast("봇 이름을 입력해 주세요.", "danger");
      return;
    }
    const risk: RiskParams = {
      stopLossPct: slOn ? sl : null,
      takeProfitPct: tpOn ? tp : null,
    };
    createBot({ name: trimmedName, market, strategy, risk });
    showToast(`"${trimmedName}" 봇이 생성되었습니다.`, "success");
    onClose();
  }, [name, market, strategy, slOn, sl, tpOn, tp, createBot, showToast, onClose]);

  const def = STRATEGY_DEFS[strategyType];
  const orderAmountField = def.fields.find((f) => f.key === "orderAmount");
  const stratParamFields = def.fields.filter((f) => f.key !== "orderAmount");

  return (
    <Form>
      {/* Bot name */}
      <TextField
        label="봇 이름"
        value={name}
        onChange={setName}
        placeholder="내 자동매매 봇"
      />

      <Divider />

      {/* Market picker */}
      <FieldGroup>
        <SectionHeader title="마켓 선택" />
        <MarketChipRow>
          {SEED_MARKETS.map((m) => (
            <MarketChip
              key={m.code}
              type="button"
              active={market === m.code}
              onClick={() => setMarket(m.code)}
            >
              {m.base}
            </MarketChip>
          ))}
        </MarketChipRow>
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
                    {field.unit ? ` ${field.unit}` : ""}
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
        <NumberField
          label={orderAmountField.label}
          value={getParamValue(strategy, "orderAmount")}
          onChange={(v) => handleSliderChange("orderAmount", v)}
          min={orderAmountField.min}
          max={orderAmountField.max}
          step={orderAmountField.step}
          suffix="원"
        />
      )}

      {/* Submit */}
      <Button
        variant="primary"
        size="lg"
        fullWidth
        onClick={handleSubmit}
        type="button"
      >
        봇 생성
      </Button>
    </Form>
  );
}
