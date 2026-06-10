'use client';

import React from 'react';
import styled from '@emotion/styled';
import { AppFrame, TestModeBanner, BottomNav } from '@/shared/ui';

interface MainLayoutProps {
  children: React.ReactNode;
}

const Main = styled.main`
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: ${({ theme }) => theme.layout.bottomNavHeight};
  position: relative;
  z-index: 1;
`;

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <AppFrame>
      <TestModeBanner />
      <Main>{children}</Main>
      <BottomNav />
    </AppFrame>
  );
}
