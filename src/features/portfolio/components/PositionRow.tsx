'use client';

import React from 'react';
import styled from '@emotion/styled';
import { SEED_MARKET_BY_CODE } from '@/shared/config/markets';
import { formatKRW, formatQuantity } from '@/shared/lib/format';
import { CoinIcon, ListRow, ValueChange } from '@/shared/ui';
import type { Position } from '@/types/domain';

// ── Styled ────────────────────────────────────────────────────────

const RightBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
`;

const ValuationText = styled.span`
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.color.text.high};
`;

const QuantityText = styled.span`
  font-family: ${({ theme }) => theme.font.mono};
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.color.text.low};
`;

// ── Component ─────────────────────────────────────────────────────

interface PositionRowProps {
  position: Position;
}

export function PositionRow({ position }: PositionRowProps) {
  const market = SEED_MARKET_BY_CODE[position.market];
  const koreanName = market?.koreanName ?? position.base;

  return (
    <ListRow
      left={<CoinIcon symbol={position.market} size={40} />}
      title={koreanName}
      subtitle={position.base}
      right={
        <RightBlock>
          <ValuationText>{formatKRW(position.valuation)}</ValuationText>
          <QuantityText>
            {formatQuantity(position.quantity)} {position.base}
          </QuantityText>
          <ValueChange rate={position.profitRate} showArrow size="sm" />
        </RightBlock>
      }
    />
  );
}
