'use client';

import React from 'react';
import styled from '@emotion/styled';
import { SEED_MARKET_BY_CODE } from '@/shared/config/markets';
import { formatKRW } from '@/shared/lib/format';
import { SectionHeader } from '@/shared/ui';
import { usePositions, usePortfolioTotals } from '@/stores/portfolioStore';

// ── Styled ────────────────────────────────────────────────────────

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(3)};
`;

const AllocationItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(1)};
`;

const ItemHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ItemLabel = styled.span`
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  color: ${({ theme }) => theme.color.text.mid};
`;

const ItemValue = styled.span`
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.color.text.high};
`;

const TrackOuter = styled.div`
  height: 6px;
  border-radius: ${({ theme }) => theme.radius.pill};
  background: ${({ theme }) => theme.color.glass.surfaceStrong};
  overflow: hidden;
`;

const TrackFill = styled.div<{ width: number; color: string }>`
  height: 100%;
  width: ${({ width }) => width}%;
  background: ${({ color }) => color};
  border-radius: ${({ theme }) => theme.radius.pill};
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
`;

// ── Helpers ───────────────────────────────────────────────────────

// Cycle through accent colors for coin bars
const ACCENT_COLORS = [
  'linear-gradient(90deg, #7C5CFF, #39E5FF)',
  'linear-gradient(90deg, #C5FF4A, #39E5FF)',
  'linear-gradient(90deg, #39E5FF, #7C5CFF)',
  'linear-gradient(90deg, #C5FF4A, #7C5CFF)',
];

// ── Component ─────────────────────────────────────────────────────

export function AllocationSection() {
  const positions = usePositions();
  const { valuation, cash } = usePortfolioTotals();

  if (valuation <= 0) return null;

  const cashPct = (cash / valuation) * 100;

  return (
    <Container>
      <SectionHeader title="자산 배분" />

      {/* Cash row */}
      <AllocationItem>
        <ItemHeader>
          <ItemLabel>현금 (KRW)</ItemLabel>
          <ItemValue>
            {formatKRW(cash, { compact: true })} ({cashPct.toFixed(1)}%)
          </ItemValue>
        </ItemHeader>
        <TrackOuter>
          <TrackFill width={cashPct} color="rgba(255,255,255,0.25)" />
        </TrackOuter>
      </AllocationItem>

      {/* Coin rows */}
      {positions.map((pos, idx) => {
        const pct = (pos.valuation / valuation) * 100;
        const market = SEED_MARKET_BY_CODE[pos.market];
        const label = market?.koreanName ?? pos.base;
        const color =
          ACCENT_COLORS[idx % ACCENT_COLORS.length] ?? ACCENT_COLORS[0] ?? 'rgba(124,92,255,1)';

        return (
          <AllocationItem key={pos.market}>
            <ItemHeader>
              <ItemLabel>
                {label} ({pos.base})
              </ItemLabel>
              <ItemValue>
                {formatKRW(pos.valuation, { compact: true })} ({pct.toFixed(1)}%)
              </ItemValue>
            </ItemHeader>
            <TrackOuter>
              <TrackFill width={pct} color={color} />
            </TrackOuter>
          </AllocationItem>
        );
      })}
    </Container>
  );
}
