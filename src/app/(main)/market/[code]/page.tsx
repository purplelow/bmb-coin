"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import styled from "@emotion/styled";
import {
  AppHeader,
  IconButton,
  Icon,
  GlassCard,
  StatTile,
  ValueChange,
} from "@/shared/ui";
import { useMarketStore, useTicker } from "@/stores/marketStore";
import { formatPrice, formatKRW } from "@/shared/lib/format";
import { PriceChart } from "@/features/market/components/PriceChart";
import { TradePanel } from "@/features/market/components/TradePanel";

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(4)};
  padding-bottom: ${({ theme }) => theme.space(8)};
`;

const ChartCard = styled.div`
  background: ${({ theme }) => theme.color.glass.surface};
  border-top: 1px solid ${({ theme }) => theme.color.glass.border};
  border-bottom: 1px solid ${({ theme }) => theme.color.glass.border};
  padding: ${({ theme }) => theme.space(3)} 0;
`;

const ContentWrapper = styled.div`
  padding: 0 ${({ theme }) => theme.layout.pagePadding};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(4)};
`;

const HeaderTitleWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
`;

const HeaderCoinName = styled.span`
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.color.text.high};
  line-height: 1.2;
`;

const HeaderPrice = styled.span`
  font-family: ${({ theme }) => theme.font.mono};
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.color.text.mid};
  line-height: 1.2;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.space(3)};
`;

const SectionLabel = styled.h2`
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.color.text.mid};
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

export default function MarketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawCode = params?.code;
  const code = typeof rawCode === "string" ? rawCode : Array.isArray(rawCode) ? (rawCode[0] ?? "") : "";

  const candles = useMarketStore((s) => s.candles[code]);
  const loadCandles = useMarketStore((s) => s.loadCandles);
  const ticker = useTicker(code);

  useEffect(() => {
    if (code && !candles) {
      void loadCandles(code);
    }
  }, [code, candles, loadCandles]);

  const tradePrice = ticker?.tradePrice ?? 0;
  const signedChangeRate = ticker?.signedChangeRate ?? 0;
  const highPrice = ticker?.highPrice ?? 0;
  const lowPrice = ticker?.lowPrice ?? 0;
  const accTradePrice24h = ticker?.accTradePrice24h ?? 0;

  const base = code.replace("KRW-", "");

  // Derive Korean name from candles market or code
  const markets = useMarketStore((s) => s.markets);
  const marketInfo = markets.find((m) => m.code === code);
  const coinName = marketInfo?.koreanName ?? base;

  const chartCandles = candles ?? [];
  const highTone: "up" | "down" | "neutral" = highPrice > 0 ? "up" : "neutral";
  const lowTone: "up" | "down" | "neutral" = lowPrice > 0 ? "down" : "neutral";

  return (
    <>
      <AppHeader
        left={
          <IconButton label="뒤로가기" onClick={() => router.back()}>
            <Icon name="back" size={22} />
          </IconButton>
        }
        title={
          <HeaderTitleWrapper>
            <HeaderCoinName>{coinName}</HeaderCoinName>
            <HeaderPrice>
              {formatPrice(tradePrice)}{" "}
              <ValueChange rate={signedChangeRate} size="sm" />
            </HeaderPrice>
          </HeaderTitleWrapper>
        }
      />

      <PageWrapper>
        <ChartCard>
          <PriceChart candles={chartCandles} width={400} height={200} />
        </ChartCard>

        <ContentWrapper>
          <GlassCard padding={4}>
            <StatsGrid>
              <StatTile
                label="24H 고가"
                value={formatPrice(highPrice)}
                tone={highTone}
              />
              <StatTile
                label="24H 저가"
                value={formatPrice(lowPrice)}
                tone={lowTone}
              />
              <StatTile
                label="거래대금"
                value={formatKRW(accTradePrice24h, { compact: true })}
              />
            </StatsGrid>
          </GlassCard>

          <SectionLabel>주문</SectionLabel>
          <TradePanel market={code} />
        </ContentWrapper>
      </PageWrapper>
    </>
  );
}
