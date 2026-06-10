'use client';

import React from 'react';
import styled from '@emotion/styled';

interface ScreenProps {
  children?: React.ReactNode;
  className?: string;
}

const ScreenRoot = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100%;
  width: 100%;
  padding: ${({ theme }) => theme.layout.pagePadding};
  padding-bottom: ${({ theme }) => theme.space(8)};
`;

export function Screen({ children, className }: ScreenProps) {
  return <ScreenRoot className={className}>{children}</ScreenRoot>;
}
