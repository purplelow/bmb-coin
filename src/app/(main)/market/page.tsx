'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styled from '@emotion/styled';
import { MarketRow } from '@/features/market/components/MarketRow';
import { AppHeader, TextField, SegmentedControl, EmptyState, Icon } from '@/shared/ui';
import { useMarkets , useMarketStore } from '@/stores/marketStore';

const TAB_OPTIONS = [
  { label: '원화', value: 'krw' },
  { label: '보유', value: 'holding' },
  { label: '관심', value: 'watchlist' },
];

const SearchWrapper = styled.div`
  padding: ${({ theme }) => theme.space(3)} ${({ theme }) => theme.layout.pagePadding};
  padding-bottom: ${({ theme }) => theme.space(2)};
`;

const TabWrapper = styled.div`
  padding: 0 ${({ theme }) => theme.layout.pagePadding} ${({ theme }) => theme.space(2)};
`;

const ListWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const Divider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.color.glass.border};
  margin: 0 ${({ theme }) => theme.layout.pagePadding};
`;

export default function MarketPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('krw');

  const markets = useMarkets();
  const tickers = useMarketStore((s) => s.tickers);
  const candles = useMarketStore((s) => s.candles);

  const filtered = markets.filter((m) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      m.koreanName.toLowerCase().includes(q) ||
      m.englishName.toLowerCase().includes(q) ||
      m.code.toLowerCase().includes(q) ||
      m.base.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <AppHeader title="마켓" />

      <SearchWrapper>
        <TextField
          value={query}
          onChange={setQuery}
          placeholder="코인명, 심볼 검색"
          suffix={<Icon name="search" size={16} />}
        />
      </SearchWrapper>

      <TabWrapper>
        <SegmentedControl options={TAB_OPTIONS} value={tab} onChange={setTab} fullWidth />
      </TabWrapper>

      {tab !== 'krw' ? (
        <EmptyState
          title="준비 중"
          description="이 탭은 아직 지원되지 않습니다."
          icon={<Icon name="coin" size={40} />}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="검색 결과 없음"
          description={`"${query}"에 해당하는 코인이 없습니다.`}
          icon={<Icon name="search" size={40} />}
        />
      ) : (
        <ListWrapper>
          {filtered.map((market, idx) => (
            <React.Fragment key={market.code}>
              <MarketRow
                market={market}
                ticker={tickers[market.code]}
                candles={candles[market.code]}
                onClick={() => router.push(`/market/${market.code}`)}
              />
              {idx < filtered.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </ListWrapper>
      )}
    </>
  );
}
