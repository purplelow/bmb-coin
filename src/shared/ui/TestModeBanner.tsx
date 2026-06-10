'use client';

import styled from '@emotion/styled';
import { isTestMode } from '@/shared/config';

const Banner = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.space(2)} ${({ theme }) => theme.space(4)};
  background: ${({ theme }) => theme.color.accent.primarySoft};
  border-bottom: 1px solid ${({ theme }) => theme.color.accent.primary}33;
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.color.accent.primary};
  letter-spacing: 0.02em;
  text-align: center;
  user-select: none;
  flex-shrink: 0;
`;

export function TestModeBanner() {
  if (!isTestMode) return null;
  return <Banner>TEST MODE · 모의거래 (실제 자금 없음)</Banner>;
}
