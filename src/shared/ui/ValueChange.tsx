'use client';

import styled from '@emotion/styled';
import { css } from '@emotion/react';
import { formatPercent } from '@/shared/lib/format';

interface ValueChangeProps {
  rate: number;
  showArrow?: boolean;
  size?: 'sm' | 'md';
}

type Tone = 'up' | 'down' | 'flat';

function getTone(rate: number): Tone {
  if (rate > 0) return 'up';
  if (rate < 0) return 'down';
  return 'flat';
}

const Wrapper = styled.span<{ tone: Tone; size: 'sm' | 'md' }>`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-family: ${({ theme }) => theme.font.family};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  line-height: 1;

  ${({ size, theme }) =>
    size === 'sm'
      ? css`font-size: ${theme.font.size.xs};`
      : css`font-size: ${theme.font.size.sm};`}

  ${({ tone, theme }) => {
    switch (tone) {
      case 'up':
        return css`color: ${theme.color.market.up};`;
      case 'down':
        return css`color: ${theme.color.market.down};`;
      case 'flat':
      default:
        return css`color: ${theme.color.market.flat};`;
    }
  }}
`;

const Arrow = styled.span<{ size: 'sm' | 'md' }>`
  display: inline-flex;
  align-items: center;
  font-size: ${({ size }) => (size === 'sm' ? '10px' : '12px')};
  line-height: 1;
`;

export function ValueChange({ rate, showArrow = true, size = 'md' }: ValueChangeProps) {
  const tone = getTone(rate);
  const text = formatPercent(rate, { signed: true });

  return (
    <Wrapper tone={tone} size={size}>
      {showArrow && tone === 'up' && <Arrow size={size}>▲</Arrow>}
      {showArrow && tone === 'down' && <Arrow size={size}>▼</Arrow>}
      {text}
    </Wrapper>
  );
}
