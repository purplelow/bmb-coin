'use client';

import styled from '@emotion/styled';
import { useTradingMode } from '@/stores/settingsStore';

const Banner = styled.div<{ live: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.space(2)} ${({ theme }) => theme.space(4)};
  background: ${({ theme, live }) =>
    live ? theme.color.market.downSoft : theme.color.accent.primarySoft};
  border-bottom: 1px solid
    ${({ theme, live }) => (live ? theme.color.market.down : theme.color.accent.primary)}33;
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme, live }) => (live ? theme.color.market.down : theme.color.accent.primary)};
  letter-spacing: 0.02em;
  text-align: center;
  user-select: none;
  flex-shrink: 0;
`;

/** Mode-aware status bar. Lime in test mode, red in live (real-money) mode. */
export function TestModeBanner() {
  const mode = useTradingMode();
  const live = mode === 'live';
  return (
    <Banner live={live}>
      {live ? 'LIVE · 실거래 (실제 자금 사용 중)' : 'TEST MODE · 모의거래 (실제 자금 없음)'}
    </Banner>
  );
}
