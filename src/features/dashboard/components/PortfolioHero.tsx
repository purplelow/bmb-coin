"use client";

import React from "react";
import styled from "@emotion/styled";
import { GlassCard, Sparkline, ValueChange } from "@/shared/ui";
import { usePortfolioTotals } from "@/stores/portfolioStore";
import { useMarketStore } from "@/stores/marketStore";
import { formatKRW } from "@/shared/lib/format";

const HeroCard = styled(GlassCard)`
  position: relative;
  overflow: hidden;
`;

const GlowOrb = styled.div`
  position: absolute;
  top: -40px;
  right: -40px;
  width: 160px;
  height: 160px;
  border-radius: ${({ theme }) => theme.radius.circle};
  background: ${({ theme }) => theme.color.accent.secondarySoft};
  filter: ${({ theme }) => theme.blur.strong};
  pointer-events: none;
`;

const Inner = styled.div`
  position: relative;
  z-index: 1;
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

const LeftBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(2)};
`;

const Label = styled.span`
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  color: ${({ theme }) => theme.color.text.low};
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

const TotalValuation = styled.span`
  font-family: ${({ theme }) => theme.font.mono};
  font-size: ${({ theme }) => theme.font.size["3xl"]};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  color: ${({ theme }) => theme.color.text.high};
  line-height: 1;
  letter-spacing: -0.02em;
`;

const PnlRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
`;

const PnlLabel = styled.span`
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.color.text.low};
`;

const SparklineWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: ${({ theme }) => theme.space(1)};
`;

const SparklineLabel = styled.span`
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.color.text.low};
`;

export function PortfolioHero() {
  const { valuation, pnl, pnlRate } = usePortfolioTotals();

  // Use BTC candle close prices as a visual proxy for the portfolio sparkline
  const btcCandles = useMarketStore((s) => s.candles["KRW-BTC"]);
  const sparkData: number[] =
    btcCandles && btcCandles.length > 1
      ? btcCandles.slice(-30).map((c) => c.close)
      : [];

  const sparkColor = pnlRate >= 0 ? "#2FE6A8" : "#FF5B73";

  return (
    <HeroCard glow="secondary" padding={5}>
      <GlowOrb />
      <Inner>
        <TopRow>
          <LeftBlock>
            <Label>총 자산</Label>
            <TotalValuation>{formatKRW(valuation)}</TotalValuation>
            <PnlRow>
              <PnlLabel>오늘 손익</PnlLabel>
              <ValueChange rate={pnlRate} showArrow size="md" />
              <PnlLabel style={{ opacity: 0.7 }}>
                {pnl >= 0 ? "+" : ""}
                {formatKRW(pnl, { compact: true })}
              </PnlLabel>
            </PnlRow>
          </LeftBlock>

          <SparklineWrapper>
            <SparklineLabel>BTC 추세</SparklineLabel>
            {sparkData.length >= 2 ? (
              <Sparkline
                data={sparkData}
                width={100}
                height={48}
                color={sparkColor}
                fill
              />
            ) : (
              <svg width={100} height={48} />
            )}
          </SparklineWrapper>
        </TopRow>
      </Inner>
    </HeroCard>
  );
}
