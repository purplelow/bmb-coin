'use client';

import React from 'react';
import styled from '@emotion/styled';
import { formatPrice } from '@/shared/lib/format';
import { CoinIcon, Sparkline, ValueChange } from '@/shared/ui';
import type { Market, Ticker, Candle } from '@/types/domain';

interface MarketRowProps {
  market: Market;
  ticker: Ticker | undefined;
  candles: Candle[] | undefined;
  /** 마켓 코드를 넘겨받는 안정된 콜백 — memo가 깨지지 않도록 참조를 유지할 것. */
  onClick: (code: string) => void;
}

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(3)};
  padding: ${({ theme }) => theme.space(3)} ${({ theme }) => theme.layout.pagePadding};
  cursor: pointer;
  transition: background ${({ theme }) => theme.motion.fast};
  -webkit-tap-highlight-color: transparent;

  &:hover {
    background: ${({ theme }) => theme.color.glass.surface};
  }

  &:active {
    background: ${({ theme }) => theme.color.glass.surfaceStrong};
  }
`;

const Content = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

const Name = styled.span`
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  color: ${({ theme }) => theme.color.text.high};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Code = styled.span`
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.color.text.mid};
`;

const RightSlot = styled.div`
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
`;

const PriceText = styled.span`
  font-family: ${({ theme }) => theme.font.mono};
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.color.text.high};
`;

const SparklineWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

// memo: 시세가 갱신된 행만 다시 그린다 — 목록이 길어질수록(전체 KRW 마켓)
// 페이지 리렌더 비용이 커서 필수. ticker/candles는 마켓별 참조가 유지된다.
export const MarketRow = React.memo(function MarketRow({
  market,
  ticker,
  candles,
  onClick,
}: MarketRowProps) {
  const closes = candles?.map((c) => c.close) ?? [];
  const tradePrice = ticker?.tradePrice ?? 0;
  const signedChangeRate = ticker?.signedChangeRate ?? 0;

  const sparkColor =
    signedChangeRate > 0 ? '#2FE6A8' : signedChangeRate < 0 ? '#FF5B73' : '#98A0B3';

  return (
    <Row onClick={() => onClick(market.code)}>
      <CoinIcon symbol={market.base} size={40} />
      <Content>
        <Name>{market.koreanName}</Name>
        <Code>{market.base}</Code>
      </Content>
      {closes.length >= 2 && (
        <SparklineWrapper>
          <Sparkline data={closes} width={64} height={28} color={sparkColor} fill />
        </SparklineWrapper>
      )}
      <RightSlot>
        <PriceText>{formatPrice(tradePrice)}</PriceText>
        <ValueChange rate={signedChangeRate} size="sm" />
      </RightSlot>
    </Row>
  );
});
