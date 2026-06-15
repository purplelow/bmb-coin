"use client";

import React, { useState } from "react";
import styled from "@emotion/styled";
import {
  SegmentedControl,
  NumberField,
  Button,
  GlassCard,
  Sheet,
} from "@/shared/ui";
import { usePortfolioStore, usePositions, usePortfolioTotals } from "@/stores/portfolioStore";
import { useUiStore } from "@/stores/uiStore";
import { useSettingsStore, useIsLive, ORDER_PRESETS } from "@/stores/settingsStore";
import { getExchangeAdapter } from "@/services/exchange";
import { formatKRW, formatQuantity } from "@/shared/lib/format";

interface TradePanelProps {
  market: string;
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(4)};
`;

const AvailableRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const AvailableLabel = styled.span`
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.color.text.low};
`;

const AvailableValue = styled.span`
  font-family: ${({ theme }) => theme.font.mono};
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.color.text.mid};
`;

const ChipsRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space(2)};
`;

const Chip = styled.button`
  flex: 1;
  height: 32px;
  background: ${({ theme }) => theme.color.glass.surface};
  border: 1px solid ${({ theme }) => theme.color.glass.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  color: ${({ theme }) => theme.color.text.mid};
  cursor: pointer;
  transition:
    background ${({ theme }) => theme.motion.fast},
    border-color ${({ theme }) => theme.motion.fast},
    color ${({ theme }) => theme.motion.fast};
  -webkit-tap-highlight-color: transparent;

  &:hover {
    background: ${({ theme }) => theme.color.glass.surfaceStrong};
    color: ${({ theme }) => theme.color.text.high};
    border-color: ${({ theme }) => theme.color.glass.borderStrong};
  }

  &:active {
    background: ${({ theme }) => theme.color.glass.highlight};
  }
`;

const ConfirmText = styled.p`
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.md};
  line-height: 1.7;
  color: ${({ theme }) => theme.color.text.mid};
  margin-bottom: ${({ theme }) => theme.space(5)};
`;

const Strong = styled.span`
  color: ${({ theme }) => theme.color.text.high};
  font-weight: ${({ theme }) => theme.font.weight.bold};
`;

const SIDE_OPTIONS = [
  { label: "매수", value: "bid" },
  { label: "매도", value: "ask" },
];

const PERCENT_CHIPS = [10, 25, 50, 100];

export function TradePanel({ market }: TradePanelProps) {
  const [side, setSide] = useState<"bid" | "ask">("bid");
  const [buyAmount, setBuyAmount] = useState(0);
  const [sellVolume, setSellVolume] = useState(0);
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { cash } = usePortfolioTotals();
  const positions = usePositions();
  const isLive = useIsLive();
  const orderPreset = useSettingsStore((s) => s.orderPreset);

  const base = market.replace("KRW-", "");
  const position = positions.find((p) => p.base === base);
  const holdingQty = position?.quantity ?? 0;

  const handleChipBuy = (pct: number) => {
    const amt = Math.floor((cash * pct) / 100);
    setBuyAmount(amt);
  };

  const handleChipSell = (pct: number) => {
    if (holdingQty <= 0) return;
    const qty = parseFloat(((holdingQty * pct) / 100).toFixed(8));
    setSellVolume(qty);
  };

  const isBuy = side === "bid";

  // Actually submit the order to the active adapter (mock or live).
  const placeOrder = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const adapter = getExchangeAdapter();
      if (side === "bid") {
        await adapter.placeOrder({ market, side: "bid", type: "price", amount: buyAmount });
      } else {
        await adapter.placeOrder({ market, side: "ask", type: "market", volume: sellVolume });
      }
      await usePortfolioStore.getState().refresh();
      useUiStore.getState().showToast("주문이 체결되었습니다", "success");
      setBuyAmount(0);
      setSellVolume(0);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "주문 처리 중 오류가 발생했습니다";
      useUiStore.getState().showToast(msg, "danger");
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  };

  const handleTrade = () => {
    if (loading) return;
    if (side === "bid" && buyAmount <= 0) {
      useUiStore.getState().showToast("매수 금액을 입력해주세요", "danger");
      return;
    }
    if (side === "ask" && sellVolume <= 0) {
      useUiStore.getState().showToast("매도 수량을 입력해주세요", "danger");
      return;
    }
    // Live orders always pass through an explicit "real money" confirmation.
    if (isLive) setConfirmOpen(true);
    else void placeOrder();
  };

  const buttonLabel = isBuy ? "매수" : "매도";
  const buttonDisabled = loading || (isBuy ? buyAmount <= 0 : sellVolume <= 0);

  return (
    <GlassCard padding={4}>
      <Wrapper>
        <SegmentedControl
          options={SIDE_OPTIONS}
          value={side}
          onChange={(v) => setSide(v as "bid" | "ask")}
          fullWidth
        />

        {isBuy ? (
          <>
            <AvailableRow>
              <AvailableLabel>사용 가능</AvailableLabel>
              <AvailableValue>{formatKRW(cash)} KRW</AvailableValue>
            </AvailableRow>

            <NumberField
              value={buyAmount}
              onChange={setBuyAmount}
              min={0}
              max={isLive ? orderPreset : cash}
              step={1000}
              label="주문 금액"
              suffix="KRW"
              placeholder="0"
            />

            <ChipsRow>
              {isLive
                ? ORDER_PRESETS.map((amt) => (
                    <Chip key={amt} type="button" onClick={() => setBuyAmount(amt)}>
                      {formatKRW(amt)}
                    </Chip>
                  ))
                : PERCENT_CHIPS.map((pct) => (
                    <Chip key={pct} type="button" onClick={() => handleChipBuy(pct)}>
                      {pct}%
                    </Chip>
                  ))}
            </ChipsRow>
          </>
        ) : (
          <>
            <AvailableRow>
              <AvailableLabel>보유 수량</AvailableLabel>
              <AvailableValue>
                {formatQuantity(holdingQty)} {base}
              </AvailableValue>
            </AvailableRow>

            <NumberField
              value={sellVolume}
              onChange={setSellVolume}
              min={0}
              max={holdingQty}
              step={0.0001}
              label="매도 수량"
              suffix={base}
              placeholder="0"
            />

            <ChipsRow>
              {PERCENT_CHIPS.map((pct) => (
                <Chip key={pct} type="button" onClick={() => handleChipSell(pct)}>
                  {pct}%
                </Chip>
              ))}
            </ChipsRow>
          </>
        )}

        <Button
          variant={isBuy ? "primary" : "danger"}
          fullWidth
          size="lg"
          disabled={buttonDisabled}
          onClick={handleTrade}
        >
          {loading ? "처리 중..." : isLive ? `실거래 ${buttonLabel}` : buttonLabel}
        </Button>
      </Wrapper>

      <Sheet open={confirmOpen} onClose={() => setConfirmOpen(false)} title="실거래 주문 확인">
        <ConfirmText>
          {isBuy ? (
            <>
              <b>{base}</b> 를 <Strong>{formatKRW(buyAmount)}</Strong> 어치 <Strong>실제 매수</Strong>
              합니다.
            </>
          ) : (
            <>
              <b>{base}</b> <Strong>{formatQuantity(sellVolume)} {base}</Strong> 를{" "}
              <Strong>실제 매도</Strong>합니다.
            </>
          )}
          <br />
          실제 자금이 사용되며 되돌릴 수 없습니다.
        </ConfirmText>
        <Button
          variant={isBuy ? "primary" : "danger"}
          fullWidth
          size="lg"
          disabled={loading}
          onClick={() => void placeOrder()}
        >
          {loading ? "처리 중..." : `${buttonLabel} 확정`}
        </Button>
      </Sheet>
    </GlassCard>
  );
}
