'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styled from '@emotion/styled';
import { MarketRow } from '@/features/market/components/MarketRow';
import { AppHeader, TextField, SegmentedControl, EmptyState, Icon, Button } from '@/shared/ui';
import { useMarkets , useMarketStore } from '@/stores/marketStore';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { useSettingsStore } from '@/stores/settingsStore';

const TAB_OPTIONS = [
  { label: '원화', value: 'krw' },
  { label: '보유', value: 'holding' },
  { label: '관심', value: 'watchlist' },
];

/** 한 번에 그리는 행 수 — "더보기"로 이만큼씩 늘린다. */
const PAGE_SIZE = 30;

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

const LoadMoreWrapper = styled.div`
  padding: ${({ theme }) => theme.space(4)} ${({ theme }) => theme.layout.pagePadding};
`;

export default function MarketPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('krw');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // 탭/검색이 바뀌면 처음 분량부터 다시.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [tab, query]);

  const openDetail = useCallback(
    (code: string) => router.push(`/market/${code}`),
    [router],
  );

  const markets = useMarkets();
  const tickers = useMarketStore((s) => s.tickers);
  const candles = useMarketStore((s) => s.candles);
  const balances = usePortfolioStore((s) => s.balances);
  const watchlist = useSettingsStore((s) => s.watchlist);

  // 보유 탭: 잔고(주문 잠김 포함)가 있는 코인만.
  const heldBases = new Set(
    balances.filter((b) => b.currency !== 'KRW' && b.balance + b.locked > 0).map((b) => b.currency),
  );

  const filtered = markets.filter((m) => {
    if (tab === 'holding' && !heldBases.has(m.base)) return false;
    if (tab === 'watchlist' && !watchlist.includes(m.code)) return false;
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

      {filtered.length === 0 ? (
        query ? (
          <EmptyState
            title="검색 결과 없음"
            description={`"${query}"에 해당하는 코인이 없습니다.`}
            icon={<Icon name="search" size={40} />}
          />
        ) : tab === 'holding' ? (
          <EmptyState
            title="보유 중인 코인이 없습니다"
            description="코인을 매수하면 여기에 표시됩니다."
            icon={<Icon name="wallet" size={40} />}
          />
        ) : tab === 'watchlist' ? (
          <EmptyState
            title="관심 코인이 없습니다"
            description="코인 상세 화면에서 별표를 눌러 추가해 보세요."
            icon={<Icon name="star" size={40} />}
          />
        ) : (
          <EmptyState
            title="마켓 정보 없음"
            description="마켓 목록을 불러오는 중이거나 연결에 실패했습니다."
            icon={<Icon name="coin" size={40} />}
          />
        )
      ) : (
        <>
          <ListWrapper>
            {filtered.slice(0, visibleCount).map((market, idx) => (
              <React.Fragment key={market.code}>
                <MarketRow
                  market={market}
                  ticker={tickers[market.code]}
                  candles={candles[market.code]}
                  onClick={openDetail}
                />
                {idx < Math.min(filtered.length, visibleCount) - 1 && <Divider />}
              </React.Fragment>
            ))}
          </ListWrapper>
          {filtered.length > visibleCount && (
            <LoadMoreWrapper>
              <Button
                variant="secondary"
                size="md"
                fullWidth
                onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
              >
                더보기 ({filtered.length - visibleCount}개 남음)
              </Button>
            </LoadMoreWrapper>
          )}
        </>
      )}
    </>
  );
}
