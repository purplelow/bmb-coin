"use client";

import React from "react";
import styled from "@emotion/styled";
import { GlassCard, ProgressRing, ValueChange } from "@/shared/ui";
import { formatKRW } from "@/shared/lib/format";
import { usePortfolioTotals } from "@/stores/portfolioStore";

// ── Styled ────────────────────────────────────────────────────────

const HeroInner = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(4)};
`;

const TopRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space(3)};
`;

const ValuationBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(1)};
`;

const Label = styled.span`
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.regular};
  color: ${({ theme }) => theme.color.text.mid};
`;

const TotalValue = styled.span`
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size["3xl"]};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  color: ${({ theme }) => theme.color.text.high};
  letter-spacing: -0.02em;
  line-height: 1.1;
`;

const PnlRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  flex-wrap: wrap;
`;

const PnlValue = styled.span`
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  color: ${({ theme }) => theme.color.text.mid};
`;

const RingWrapper = styled.div`
  position: relative;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const RingLabel = styled.span`
  position: absolute;
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.color.text.mid};
  text-align: center;
  line-height: 1.2;
`;

// ── Component ─────────────────────────────────────────────────────

export function HeroCard() {
  const { valuation, cash, pnl, pnlRate } = usePortfolioTotals();

  // Fraction of total that is coin (non-cash)
  const coinValue = valuation > 0 ? valuation - cash : 0;
  const coinRatio = valuation > 0 ? coinValue / valuation : 0;

  const cashPct = valuation > 0 ? Math.round((cash / valuation) * 100) : 100;
  const coinPct = 100 - cashPct;

  return (
    <GlassCard padding={5} glow="secondary">
      <HeroInner>
        <TopRow>
          <ValuationBlock>
            <Label>총 자산</Label>
            <TotalValue>{formatKRW(valuation)}</TotalValue>
            <PnlRow>
              <PnlValue>평가손익 {formatKRW(pnl, { compact: true })}</PnlValue>
              <ValueChange rate={pnlRate} showArrow size="md" />
            </PnlRow>
          </ValuationBlock>

          <RingWrapper>
            <ProgressRing value={coinRatio} size={72} stroke={6} />
            <RingLabel>
              코인<br />{coinPct}%
            </RingLabel>
          </RingWrapper>
        </TopRow>

        <AllocationBar cashPct={cashPct} coinPct={coinPct} />
      </HeroInner>
    </GlassCard>
  );
}

// ── Allocation Bar sub-component ──────────────────────────────────

interface AllocationBarProps {
  cashPct: number;
  coinPct: number;
}

const BarWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(2)};
`;

const BarTrack = styled.div`
  height: 8px;
  border-radius: ${({ theme }) => theme.radius.pill};
  background: ${({ theme }) => theme.color.glass.surfaceStrong};
  overflow: hidden;
  display: flex;
`;

const BarSegment = styled.div<{ width: number; gradient: string }>`
  height: 100%;
  width: ${({ width }) => width}%;
  background: ${({ gradient }) => gradient};
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
`;

const BarLegend = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space(2)};
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(1)};
`;

const LegendDot = styled.div<{ color: string }>`
  width: 8px;
  height: 8px;
  border-radius: ${({ theme }) => theme.radius.circle};
  background: ${({ color }) => color};
  flex-shrink: 0;
`;

const LegendText = styled.span`
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.color.text.mid};
`;

function AllocationBar({ cashPct, coinPct }: AllocationBarProps) {
  return (
    <BarWrapper>
      <BarTrack>
        <BarSegment
          width={coinPct}
          gradient="linear-gradient(90deg, #7C5CFF 0%, #39E5FF 100%)"
        />
        <BarSegment
          width={cashPct}
          gradient="rgba(255,255,255,0.12)"
        />
      </BarTrack>
      <BarLegend>
        <LegendItem>
          <LegendDot color="#7C5CFF" />
          <LegendText>코인 {coinPct}%</LegendText>
        </LegendItem>
        <LegendItem>
          <LegendDot color="rgba(255,255,255,0.25)" />
          <LegendText>현금 {cashPct}%</LegendText>
        </LegendItem>
      </BarLegend>
    </BarWrapper>
  );
}
