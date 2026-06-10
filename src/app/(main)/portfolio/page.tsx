"use client";

import React from "react";
import styled from "@emotion/styled";
import {
  AppHeader,
  Screen,
  SectionHeader,
  EmptyState,
  Icon,
  GlassCard,
  Divider,
} from "@/shared/ui";
import { usePositions, usePortfolioStore } from "@/stores/portfolioStore";
import {
  HeroCard,
  PositionRow,
  AllocationSection,
  OrderRow,
} from "@/features/portfolio/components";

// ── Styled ────────────────────────────────────────────────────────

const PageContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(6)};
`;

const Section = styled.section`
  display: flex;
  flex-direction: column;
`;

const ListCard = styled(GlassCard)`
  padding: 0;
  overflow: hidden;
`;

// ── Page ─────────────────────────────────────────────────────────

export default function PortfolioPage() {
  const positions = usePositions();
  const orders = usePortfolioStore((s) => s.orders);

  return (
    <>
      <AppHeader title="내 자산" />
      <Screen>
        <PageContent>
          {/* Hero total value card */}
          <HeroCard />

          {/* Allocation bars */}
          <AllocationSection />

          {/* Positions section */}
          <Section>
            <SectionHeader title="보유 코인" />
            {positions.length === 0 ? (
              <EmptyState
                title="보유 코인 없음"
                description="봇이 매수를 실행하면 여기에 표시됩니다."
                icon={<Icon name="coin" size={36} />}
              />
            ) : (
              <ListCard>
                {positions.map((pos, idx) => (
                  <React.Fragment key={pos.market}>
                    <PositionRow position={pos} />
                    {idx < positions.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </ListCard>
            )}
          </Section>

          {/* Order history section */}
          <Section>
            <SectionHeader title="거래 내역" />
            {orders.length === 0 ? (
              <EmptyState
                title="거래 내역 없음"
                description="봇이 주문을 실행하면 여기에 표시됩니다."
                icon={<Icon name="market" size={36} />}
              />
            ) : (
              <ListCard>
                {orders.map((order, idx) => (
                  <React.Fragment key={order.id}>
                    <OrderRow order={order} />
                    {idx < orders.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </ListCard>
            )}
          </Section>
        </PageContent>
      </Screen>
    </>
  );
}
