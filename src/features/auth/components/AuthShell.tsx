'use client';

import React from 'react';
import styled from '@emotion/styled';

// ── Layout ─────────────────────────────────────────────────────────────────
// Shared shell for /login and /signup. Mirrors the onboarding page's
// PageRoot/Shell/Wordmark visual language (dark, glassmorphic, neon).

const PageRoot = styled.div`
  /* The window is locked (body overflow hidden) — this root is the page's
     own scroll container. */
  height: 100dvh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  background: ${({ theme }) => theme.color.bg.base};

  /* Page-level violet glow at top */
  &::before {
    content: '';
    position: fixed;
    inset: 0;
    background: ${({ theme }) => theme.gradient.pageGlow};
    pointer-events: none;
    z-index: 0;
  }
`;

const Shell = styled.div`
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: ${({ theme }) => theme.layout.appMaxWidth};
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.space(10)} ${({ theme }) => theme.layout.pagePadding};
  gap: 0;
`;

const WordmarkWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.space(9)};
`;

const Wordmark = styled.h1`
  margin: 0;
  font-size: ${({ theme }) => theme.font.size['4xl']};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  letter-spacing: -1px;
  line-height: 1;
  text-align: center;
  background: ${({ theme }) => theme.gradient.brand};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  user-select: none;
`;

const WordmarkSub = styled.span`
  display: block;
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.color.text.low};
  margin-top: ${({ theme }) => theme.space(1)};
  -webkit-text-fill-color: initial;
  background: none;
  user-select: none;
`;

const CardSlot = styled.div`
  width: 100%;
`;

const FooterSlot = styled.div`
  width: 100%;
  margin-top: ${({ theme }) => theme.space(6)};
  display: flex;
  justify-content: center;
`;

interface AuthShellProps {
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthShell({ children, footer }: AuthShellProps) {
  return (
    <PageRoot>
      <Shell>
        <WordmarkWrap>
          <Wordmark>
            KoinLab
            <WordmarkSub>BMB-LAB</WordmarkSub>
          </Wordmark>
        </WordmarkWrap>

        <CardSlot>{children}</CardSlot>

        {footer && <FooterSlot>{footer}</FooterSlot>}
      </Shell>
    </PageRoot>
  );
}
