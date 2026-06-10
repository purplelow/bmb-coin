'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styled from '@emotion/styled';
import { css } from '@emotion/react';
import { Icon } from './Icon';
import type { IconName } from './Icon';

interface NavTab {
  href: string;
  label: string;
  icon: IconName;
}

const TABS: NavTab[] = [
  { href: '/dashboard', label: '대시보드', icon: 'home' },
  { href: '/market', label: '마켓', icon: 'market' },
  { href: '/bots', label: '봇', icon: 'bot' },
  { href: '/portfolio', label: '자산', icon: 'wallet' },
];

const Nav = styled.nav`
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: ${({ theme }) => theme.layout.appMaxWidth};
  height: ${({ theme }) => theme.layout.bottomNavHeight};
  z-index: ${({ theme }) => theme.zIndex.bottomNav};

  background: ${({ theme }) => theme.color.glass.surface};
  backdrop-filter: ${({ theme }) => theme.blur.glass};
  -webkit-backdrop-filter: ${({ theme }) => theme.blur.glass};
  border-top: 1px solid ${({ theme }) => theme.color.glass.border};

  display: flex;
  align-items: stretch;
  padding-bottom: env(safe-area-inset-bottom, 0px);
`;

const TabLink = styled(Link, {
  // `active` is a styling-only prop — don't leak it onto the <a> element.
  shouldForwardProp: (prop) => prop !== 'active',
})<{ active: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;
  transition:
    color ${({ theme }) => theme.motion.fast},
    transform ${({ theme }) => theme.motion.fast};
  position: relative;
  padding: 8px 4px;

  ${({ active, theme }) =>
    active
      ? css`
          color: ${theme.color.accent.primary};
          &::before {
            content: '';
            position: absolute;
            top: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 32px;
            height: 2px;
            border-radius: 0 0 2px 2px;
            background: ${theme.color.accent.primary};
            box-shadow: 0 0 10px ${theme.color.accent.primarySoft};
          }
        `
      : css`
          color: ${theme.color.text.low};
          &:hover {
            color: ${theme.color.text.mid};
          }
        `}

  &:active {
    transform: scale(0.92);
  }
`;

const IconWrapper = styled.span<{ active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: ${({ theme }) => theme.radius.md};
  transition:
    background ${({ theme }) => theme.motion.fast},
    box-shadow ${({ theme }) => theme.motion.fast};

  ${({ active, theme }) =>
    active &&
    css`
      background: ${theme.color.accent.primarySoft};
      box-shadow: 0 0 12px ${theme.color.accent.primarySoft};
    `}
`;

const TabLabel = styled.span`
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  line-height: 1;
  letter-spacing: -0.01em;
`;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <Nav>
      {TABS.map((tab) => {
        const active =
          tab.href === '/market'
            ? pathname.startsWith('/market')
            : pathname === tab.href;

        return (
          <TabLink key={tab.href} href={tab.href} active={active}>
            <IconWrapper active={active}>
              <Icon name={tab.icon} size={20} />
            </IconWrapper>
            <TabLabel>{tab.label}</TabLabel>
          </TabLink>
        );
      })}
    </Nav>
  );
}
