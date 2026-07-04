'use client';

import React from 'react';
import styled from '@emotion/styled';
import { GlassCard, CoinIcon, Badge, ValueChange } from '@/shared/ui';
import type { Bot } from '@/types/domain';

interface BotMiniCardProps {
  bot: Bot;
}

const Card = styled(GlassCard)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(3)};
`;

const Info = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

const BotName = styled.span`
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.color.text.high};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const MarketLabel = styled.span`
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.color.text.low};
`;

const Right = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: ${({ theme }) => theme.space(1)};
  flex-shrink: 0;
`;

function statusLabel(status: Bot['status']): string {
  switch (status) {
    case 'running':
      return '실행 중';
    case 'paused':
      return '일시정지';
    case 'stopped':
      return '정지';
  }
}

function statusTone(status: Bot['status']): 'primary' | 'warning' | 'neutral' {
  switch (status) {
    case 'running':
      return 'primary';
    case 'paused':
      return 'warning';
    case 'stopped':
      return 'neutral';
  }
}

export function BotMiniCard({ bot }: BotMiniCardProps) {
  return (
    <Card padding={4}>
      <CoinIcon symbol={bot.market} size={36} />
      <Info>
        <BotName>{bot.name}</BotName>
        <MarketLabel>{bot.market}</MarketLabel>
      </Info>
      <Right>
        <Badge tone={statusTone(bot.status)}>{statusLabel(bot.status)}</Badge>
        <ValueChange rate={bot.stats.returnRate} showArrow size="sm" />
      </Right>
    </Card>
  );
}
