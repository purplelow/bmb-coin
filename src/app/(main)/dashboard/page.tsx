"use client";

import React from "react";
import styled from "@emotion/styled";
import { Screen, AppHeader, IconButton, Icon } from "@/shared/ui";
import { PortfolioHero } from "@/features/dashboard/components/PortfolioHero";
import { StatRow } from "@/features/dashboard/components/StatRow";
import { BotSection } from "@/features/dashboard/components/BotSection";
import { MarketSection } from "@/features/dashboard/components/MarketSection";

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

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(5)};
  padding-top: ${({ theme }) => theme.space(4)};
`;

export default function DashboardPage() {
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
          <IconButton label="알림" variant="ghost" size={40}>
            <Icon name="bell" size={20} />
          </IconButton>
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
