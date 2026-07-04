'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styled from '@emotion/styled';
import { formatPrice } from '@/shared/lib/format';
import { SectionHeader, GlassCard, ListRow, CoinIcon, ValueChange, Icon } from '@/shared/ui';
import { useMarkets, useMarketStore } from '@/stores/marketStore';

const Card = styled(GlassCard)`
  padding: 0;
  overflow: hidden;
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

const PriceBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
`;

const PriceText = styled.span`
  font-family: ${({ theme }) => theme.font.mono};
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.color.text.high};
`;

const Divider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.color.glass.border};
  margin: 0 ${({ theme }) => theme.space(5)};
`;

export function MarketSection() {
  const router = useRouter();
  const markets = useMarkets();
  const tickers = useMarketStore((s) => s.tickers);

  // Sort by absolute signed change rate descending, show top 5
  const sorted = [...markets]
    .filter((m) => tickers[m.code] !== undefined)
    .sort((a, b) => {
      const ta = tickers[a.code];
      const tb = tickers[b.code];
      const rateA = ta ? Math.abs(ta.signedChangeRate) : 0;
      const rateB = tb ? Math.abs(tb.signedChangeRate) : 0;
      return rateB - rateA;
    })
    .slice(0, 5);

  return (
    <section>
      <SectionHeader
        title="실시간 마켓"
        action={
          <SeeAllLink href="/market">
            전체 보기
            <Icon name="chevronRight" size={14} />
          </SeeAllLink>
        }
      />

      <Card>
        {sorted.map((market, idx) => {
          const ticker = tickers[market.code];
          const price = ticker ? formatPrice(ticker.tradePrice) : '—';
          const rate = ticker?.signedChangeRate ?? 0;

          return (
            <React.Fragment key={market.code}>
              {idx > 0 && <Divider />}
              <ListRow
                left={<CoinIcon symbol={market.code} size={36} />}
                title={market.koreanName}
                subtitle={market.base}
                right={
                  <PriceBlock>
                    <PriceText>₩{price}</PriceText>
                    <ValueChange rate={rate} showArrow size="sm" />
                  </PriceBlock>
                }
                onClick={() => router.push(`/market/${market.code}`)}
              />
            </React.Fragment>
          );
        })}
      </Card>
    </section>
  );
}
