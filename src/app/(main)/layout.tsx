'use client';

import React from 'react';
import styled from '@emotion/styled';
import { AppFrame, TestModeBanner, BottomNav } from '@/shared/ui';

interface MainLayoutProps {
  children: React.ReactNode;
}

const Main = styled.main`
  flex: 1;
  /* min-height: 0 lets this flex item shrink to the frame, making it the one
     true scroll container regardless of content height. */
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
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
