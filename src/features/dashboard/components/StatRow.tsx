'use client';

import React from 'react';
import styled from '@emotion/styled';
import { formatKRW } from '@/shared/lib/format';
import { GlassCard, StatTile } from '@/shared/ui';
import { useBotStore } from '@/stores/botStore';
import { usePortfolioTotals } from '@/stores/portfolioStore';

const Row = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.space(3)};
`;

const TileCard = styled(GlassCard)`
  padding: ${({ theme }) => theme.space(4)};
`;

export function StatRow() {
  const { cash, pnl, pnlRate } = usePortfolioTotals();
  const runningBotCount = useBotStore((s) => s.bots.filter((b) => b.status === 'running').length);

  const pnlTone: 'up' | 'down' | 'neutral' = pnlRate > 0 ? 'up' : pnlRate < 0 ? 'down' : 'neutral';

  return (
    <Row>
      <TileCard padding={4}>
        <StatTile label="보유 현금" value={formatKRW(cash, { compact: true })} tone="neutral" />
      </TileCard>

      <TileCard padding={4}>
        <StatTile
          label="평가손익"
          value={(pnl >= 0 ? '+' : '') + formatKRW(pnl, { compact: true })}
          tone={pnlTone}
        />
      </TileCard>

      <TileCard padding={4}>
        <StatTile label="활성 봇" value={String(runningBotCount)} sub="개 실행 중" tone="neutral" />
      </TileCard>
    </Row>
  );
}
