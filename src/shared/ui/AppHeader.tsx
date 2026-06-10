'use client';

import React from 'react';
import styled from '@emotion/styled';

interface AppHeaderProps {
  title?: React.ReactNode;
  left?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}

const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: ${({ theme }) => theme.zIndex.header};
  width: 100%;
  height: ${({ theme }) => theme.layout.headerHeight};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${({ theme }) => theme.layout.pagePadding};
  background: ${({ theme }) => theme.color.glass.surface};
  backdrop-filter: ${({ theme }) => theme.blur.glass};
  -webkit-backdrop-filter: ${({ theme }) => theme.blur.glass};
  border-bottom: 1px solid ${({ theme }) => theme.color.glass.border};
  gap: ${({ theme }) => theme.space(3)};
`;

const Side = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  min-width: 44px;
`;

const TitleSlot = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.color.text.high};
  text-align: center;
`;

export function AppHeader({ title, left, right, className }: AppHeaderProps) {
  return (
    <Header className={className}>
      <Side>{left}</Side>
      <TitleSlot>{title}</TitleSlot>
      <Side style={{ justifyContent: 'flex-end' }}>{right}</Side>
    </Header>
  );
}
