'use client';

import React from 'react';
import { css } from '@emotion/react';
import styled from '@emotion/styled';

interface GlassCardProps {
  padding?: number;
  glow?: 'none' | 'primary' | 'secondary';
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

const Card = styled.div<{
  padding: number;
  glow: 'none' | 'primary' | 'secondary';
  clickable: boolean;
}>`
  background: ${({ theme }) => theme.color.glass.surface};
  border: 1px solid ${({ theme }) => theme.color.glass.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  backdrop-filter: ${({ theme }) => theme.blur.glass};
  -webkit-backdrop-filter: ${({ theme }) => theme.blur.glass};
  padding: ${({ padding, theme }) => theme.space(padding)};
  transition:
    box-shadow ${({ theme }) => theme.motion.base},
    border-color ${({ theme }) => theme.motion.base},
    transform ${({ theme }) => theme.motion.fast};

  ${({ glow, theme }) => {
    if (glow === 'primary') {
      return css`
        box-shadow: ${theme.shadow.glowPrimary};
        border-color: ${theme.color.accent.primarySoft};
      `;
    }
    if (glow === 'secondary') {
      return css`
        box-shadow: ${theme.shadow.glowSecondary};
        border-color: ${theme.color.accent.secondarySoft};
      `;
    }
    return css`
      box-shadow: ${theme.shadow.card};
    `;
  }}

  ${({ clickable, theme }) =>
    clickable &&
    css`
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      &:hover {
        border-color: ${theme.color.glass.borderStrong};
        background: ${theme.color.glass.surfaceStrong};
        transform: translateY(-1px);
        box-shadow: ${theme.shadow.raised};
      }
      &:active {
        transform: translateY(0);
      }
    `}
`;

export function GlassCard({
  padding = 5,
  glow = 'none',
  onClick,
  className,
  children,
}: GlassCardProps) {
  return (
    <Card
      padding={padding}
      glow={glow}
      clickable={!!onClick}
      onClick={onClick}
      className={className}
    >
      {children}
    </Card>
  );
}
