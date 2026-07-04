'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import styled from '@emotion/styled';
import { BotSection } from '@/features/dashboard/components/BotSection';
import { MarketSection } from '@/features/dashboard/components/MarketSection';
import { PortfolioHero } from '@/features/dashboard/components/PortfolioHero';
import { StatRow } from '@/features/dashboard/components/StatRow';
import { Screen, AppHeader, IconButton, Icon } from '@/shared/ui';

const GreetingBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const GreetingTitle = styled.span`
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.color.text.high};
`;

const GreetingSubtitle = styled.span`
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.color.text.low};
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(1)};
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(5)};
  padding-top: ${({ theme }) => theme.space(4)};
`;

export default function DashboardPage() {
  const router = useRouter();
  return (
    <>
      <AppHeader
        title={
          <GreetingBlock>
            <GreetingTitle>좋은 하루예요 👋</GreetingTitle>
            <GreetingSubtitle>오늘의 포트폴리오를 확인하세요</GreetingSubtitle>
          </GreetingBlock>
        }
        right={
          <HeaderActions>
            <IconButton label="알림" variant="ghost" size={40}>
              <Icon name="bell" size={20} />
            </IconButton>
            <IconButton
              label="설정"
              variant="ghost"
              size={40}
              onClick={() => router.push('/settings')}
            >
              <Icon name="settings" size={20} />
            </IconButton>
          </HeaderActions>
        }
      />

      <Screen>
        <Content>
          <PortfolioHero />
          <StatRow />
          <BotSection />
          <MarketSection />
        </Content>
      </Screen>
    </>
  );
}
