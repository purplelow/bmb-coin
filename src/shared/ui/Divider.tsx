'use client';

import styled from '@emotion/styled';

interface DividerProps {
  spacing?: number;
}

const Line = styled.hr<{ spacing: number }>`
  border: none;
  border-top: 1px solid ${({ theme }) => theme.color.glass.border};
  margin: ${({ spacing, theme }) => theme.space(spacing)} 0;
  width: 100%;
`;

export function Divider({ spacing = 0 }: DividerProps) {
  return <Line spacing={spacing} />;
}
