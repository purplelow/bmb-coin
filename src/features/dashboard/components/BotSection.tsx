'use client';

import React from 'react';
import Link from 'next/link';
import styled from '@emotion/styled';
import { SectionHeader, EmptyState, Button, Icon } from '@/shared/ui';
import { useBotStore } from '@/stores/botStore';
import { BotMiniCard } from './BotMiniCard';

const BotList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(3)};
`;

const SeeAllLink = styled(Link)`
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  color: ${({ theme }) => theme.color.accent.primary};
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 2px;

  &:hover {
    opacity: 0.8;
  }
`;

export function BotSection() {
  const bots = useBotStore((s) => s.bots);
  const runningBots = bots.filter((b) => b.status === 'running');
  const displayBots = runningBots.slice(0, 3);

  return (
    <section>
      <SectionHeader
        title="내 자동매매 봇"
        action={
          runningBots.length > 0 ? (
            <SeeAllLink href="/bots">
              전체 보기
              <Icon name="chevronRight" size={14} />
            </SeeAllLink>
          ) : undefined
        }
      />

      {displayBots.length > 0 ? (
        <BotList>
          {displayBots.map((bot) => (
            <BotMiniCard key={bot.id} bot={bot} />
          ))}
        </BotList>
      ) : (
        <EmptyState
          title="실행 중인 봇이 없어요"
          description="자동매매 봇을 만들어 24시간 자동으로 거래해보세요."
          icon={<Icon name="bot" size={36} />}
          action={
            <Link href="/bots">
              <Button variant="primary" size="md">
                봇 만들기
              </Button>
            </Link>
          }
        />
      )}
    </section>
  );
}
