'use client';

import React from 'react';
import styled from '@emotion/styled';

interface AppFrameProps {
  children?: React.ReactNode;
}

const Outer = styled.div`
  /* Exact viewport height (not min-height): the frame never grows with
     content, so the window never scrolls — <main> is the single scroller. */
  height: 100dvh;
  width: 100%;
  display: flex;
  justify-content: center;
  background: ${({ theme }) => theme.color.bg.base};
`;

const Inner = styled.div`
  position: relative;
  width: 100%;
  max-width: ${({ theme }) => theme.layout.appMaxWidth};
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &::before {
    content: '';
    position: fixed;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: ${({ theme }) => theme.layout.appMaxWidth};
    height: 100dvh;
    background: ${({ theme }) => theme.gradient.pageGlow};
    pointer-events: none;
    z-index: 0;
  }
`;

export function AppFrame({ children }: AppFrameProps) {
  return (
    <Outer>
      <Inner>{children}</Inner>
    </Outer>
  );
}
