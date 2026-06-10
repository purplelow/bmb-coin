'use client';

import styled from '@emotion/styled';

interface CoinIconProps {
  symbol: string;
  size?: number;
}

const Container = styled.div<{ size: number }>`
  width: ${({ size }) => size}px;
  height: ${({ size }) => size}px;
  border-radius: ${({ theme }) => theme.radius.circle};
  background: ${({ theme }) => theme.gradient.brand};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-family: ${({ theme }) => theme.font.family};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  color: ${({ theme }) => theme.color.text.inverse};
  font-size: ${({ size }) => Math.max(9, Math.round(size * 0.35))}px;
  letter-spacing: -0.01em;
  text-transform: uppercase;
  user-select: none;
`;

function getInitials(symbol: string): string {
  const clean = symbol.replace(/^KRW-/, '').replace(/^BTC-/, '');
  if (clean.length <= 2) return clean;
  return clean.slice(0, 2);
}

export function CoinIcon({ symbol, size = 36 }: CoinIconProps) {
  const initials = getInitials(symbol);
  return <Container size={size}>{initials}</Container>;
}
