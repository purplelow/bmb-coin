'use client';

import React, { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
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
  const mainRef = useRef<HTMLElement>(null);
  const pathname = usePathname();

  // window가 아니라 Main이 스크롤 컨테이너라서 Next의 라우트 스크롤 복원이
  // 닿지 않는다 — 페이지가 바뀌면 직접 맨 위로 되돌린다.
  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
  }, [pathname]);

  return (
    <AppFrame>
      <TestModeBanner />
      <Main ref={mainRef}>{children}</Main>
      <BottomNav />
    </AppFrame>
  );
}
