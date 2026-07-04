'use client';

import React from 'react';
import { css } from '@emotion/react';
import styled from '@emotion/styled';

export type BadgeTone = 'up' | 'down' | 'neutral' | 'primary' | 'secondary' | 'warning';

interface BadgeProps {
  tone?: BadgeTone;
  children?: React.ReactNode;
}

const StyledBadge = styled.span<{ tone: BadgeTone }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 3px 9px;
  border-radius: ${({ theme }) => theme.radius.pill};
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  line-height: 1;
  white-space: nowrap;

  ${({ tone, theme }) => {
    switch (tone) {
      case 'up':
        return css`
          background: ${theme.color.market.upSoft};
          color: ${theme.color.market.up};
        `;
      case 'down':
        return css`
          background: ${theme.color.market.downSoft};
          color: ${theme.color.market.down};
        `;
      case 'primary':
        return css`
          background: ${theme.color.accent.primarySoft};
          color: ${theme.color.accent.primary};
        `;
      case 'secondary':
        return css`
          background: ${theme.color.accent.secondarySoft};
          color: ${theme.color.accent.secondary};
        `;
      case 'warning':
        return css`
          background: rgba(255, 177, 61, 0.15);
          color: ${theme.color.status.warning};
        `;
      case 'neutral':
      default:
        return css`
          background: ${theme.color.glass.surfaceStrong};
          color: ${theme.color.text.mid};
          border: 1px solid ${theme.color.glass.border};
        `;
    }
  }}
`;

export function Badge({ tone = 'neutral', children }: BadgeProps) {
  return <StyledBadge tone={tone}>{children}</StyledBadge>;
}
