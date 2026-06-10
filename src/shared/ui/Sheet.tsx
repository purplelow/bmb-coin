'use client';

import React, { useEffect } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { IconButton } from './Button';
import { Icon } from './Icon';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
}

// Keep translateX(-50%) in every frame so the centering isn't clobbered by
// the animated transform (the panel is positioned with left: 50%).
const slideUp = keyframes`
  from { transform: translateX(-50%) translateY(100%); }
  to   { transform: translateX(-50%) translateY(0); }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

const slideDown = keyframes`
  from { transform: translateX(-50%) translateY(0); }
  to   { transform: translateX(-50%) translateY(100%); }
`;

const Backdrop = styled.div<{ closing: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  z-index: ${({ theme }) => theme.zIndex.overlay};
  animation: ${fadeIn} ${({ theme }) => theme.motion.base} forwards;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
`;

const Panel = styled.div`
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: ${({ theme }) => theme.layout.appMaxWidth};
  background: ${({ theme }) => theme.color.bg.raised};
  border-top-left-radius: ${({ theme }) => theme.radius.xl};
  border-top-right-radius: ${({ theme }) => theme.radius.xl};
  border: 1px solid ${({ theme }) => theme.color.glass.border};
  border-bottom: none;
  z-index: ${({ theme }) => theme.zIndex.modal};
  animation: ${slideUp} ${({ theme }) => theme.motion.spring} forwards;
  max-height: 88dvh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const Handle = styled.div`
  width: 36px;
  height: 4px;
  border-radius: ${({ theme }) => theme.radius.pill};
  background: ${({ theme }) => theme.color.glass.borderStrong};
  margin: 12px auto 0;
  flex-shrink: 0;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.space(4)} ${({ theme }) => theme.space(5)};
  flex-shrink: 0;
`;

const Title = styled.h2`
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.lg};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.color.text.high};
  margin: 0;
`;

const Body = styled.div`
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  flex: 1;
  padding: 0 ${({ theme }) => theme.space(5)} ${({ theme }) => theme.space(8)};
`;

export function Sheet({ open, onClose, title, children }: SheetProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <Backdrop closing={false} onClick={onClose} />
      <Panel role="dialog" aria-modal="true" aria-label={title}>
        <Handle />
        {(title != null) && (
          <Header>
            <Title>{title}</Title>
            <IconButton label="닫기" onClick={onClose} size={36}>
              <Icon name="close" size={18} />
            </IconButton>
          </Header>
        )}
        <Body>{children}</Body>
      </Panel>
    </>
  );
}
