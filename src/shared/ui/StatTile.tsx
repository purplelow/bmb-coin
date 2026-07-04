'use client';

import React from 'react';
import { css } from '@emotion/react';
import styled from '@emotion/styled';

interface StatTileProps {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: 'up' | 'down' | 'neutral';
}

const Tile = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(1)};
`;

const Label = styled.span`
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  color: ${({ theme }) => theme.color.text.low};
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const Value = styled.span<{ tone: 'up' | 'down' | 'neutral' }>`
  font-family: ${({ theme }) => theme.font.mono};
  font-size: ${({ theme }) => theme.font.size.lg};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  line-height: 1.1;
  white-space: nowrap;
  letter-spacing: -0.01em;

  ${({ tone, theme }) => {
    switch (tone) {
      case 'up':
        return css`
          color: ${theme.color.market.up};
        `;
      case 'down':
        return css`
          color: ${theme.color.market.down};
        `;
      default:
        return css`
          color: ${theme.color.text.high};
        `;
    }
  }}
`;

const Sub = styled.span`
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.color.text.mid};
`;

export function StatTile({ label, value, sub, tone = 'neutral' }: StatTileProps) {
  return (
    <Tile>
      <Label>{label}</Label>
      <Value tone={tone}>{value}</Value>
      {sub && <Sub>{sub}</Sub>}
    </Tile>
  );
}
