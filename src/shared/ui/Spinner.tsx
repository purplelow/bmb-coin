'use client';

import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';

interface SpinnerProps {
  size?: number;
  color?: string;
}

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const Ring = styled.span<{ sz: number; c?: string }>`
  display: inline-block;
  width: ${({ sz }) => sz}px;
  height: ${({ sz }) => sz}px;
  border-radius: 50%;
  border: ${({ sz }) => Math.max(2, Math.round(sz * 0.1))}px solid
    ${({ c, theme }) => c ?? theme.color.glass.border};
  border-top-color: ${({ c, theme }) => c ?? theme.color.accent.primary};
  animation: ${spin} 0.7s linear infinite;
  flex-shrink: 0;
`;

export function Spinner({ size = 24, color }: SpinnerProps) {
  return <Ring sz={size} c={color} />;
}
