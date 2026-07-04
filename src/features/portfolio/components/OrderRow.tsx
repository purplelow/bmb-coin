'use client';

import React from 'react';
import styled from '@emotion/styled';
import { SEED_MARKET_BY_CODE } from '@/shared/config/markets';
import { formatKRW, formatQuantity, formatDateTime } from '@/shared/lib/format';
import { Badge, ListRow } from '@/shared/ui';
import type { Order } from '@/types/domain';

// ── Styled ────────────────────────────────────────────────────────

const RightBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
`;

const AmountText = styled.span`
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.color.text.high};
`;

const MetaText = styled.span`
  font-family: ${({ theme }) => theme.font.mono};
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.color.text.low};
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
`;

// ── Component ─────────────────────────────────────────────────────

interface OrderRowProps {
  order: Order;
}

export function OrderRow({ order }: OrderRowProps) {
  const market = SEED_MARKET_BY_CODE[order.market];
  const koreanName = market?.koreanName ?? order.market;

  const isBuy = order.side === 'bid';
  const executedAmount = order.avgFillPrice * order.executedVolume;

  return (
    <ListRow
      title={
        <TitleRow>
          <Badge tone={isBuy ? 'up' : 'down'}>{isBuy ? '매수' : '매도'}</Badge>
          {koreanName}
        </TitleRow>
      }
      subtitle={formatDateTime(order.createdAt)}
      right={
        <RightBlock>
          <AmountText>{formatKRW(executedAmount)}</AmountText>
          <MetaText>
            {formatQuantity(order.executedVolume)} {market?.base ?? ''}
          </MetaText>
        </RightBlock>
      }
    />
  );
}
