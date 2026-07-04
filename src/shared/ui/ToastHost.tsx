'use client';

import { useEffect, useState } from 'react';
import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import { createPortal } from 'react-dom';
import { useUiStore } from '@/stores/uiStore';
import { Icon } from './Icon';

const slideIn = keyframes`
  from { transform: translateY(-8px); opacity: 0; }
  to   { transform: translateY(0); opacity: 1; }
`;

const Stack = styled.div`
  position: fixed;
  top: calc(${({ theme }) => theme.space(3)} + env(safe-area-inset-top, 0px));
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - ${({ theme }) => theme.space(8)});
  max-width: calc(${({ theme }) => theme.layout.appMaxWidth} - ${({ theme }) => theme.space(8)});
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(2)};
  z-index: ${({ theme }) => theme.zIndex.toast};
  pointer-events: none;
`;

const Item = styled.button<{ tone: 'success' | 'danger' | 'info' }>`
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  padding: ${({ theme }) => theme.space(3)} ${({ theme }) => theme.space(4)};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.color.bg.raised};
  border: 1px solid
    ${({ theme, tone }) =>
      tone === 'success'
        ? theme.color.market.up
        : tone === 'danger'
          ? theme.color.market.down
          : theme.color.accent.tertiary}55;
  box-shadow: ${({ theme }) => theme.shadow.card};
  backdrop-filter: ${({ theme }) => theme.blur.glass};
  -webkit-backdrop-filter: ${({ theme }) => theme.blur.glass};
  color: ${({ theme }) => theme.color.text.high};
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  text-align: left;
  animation: ${slideIn} ${({ theme }) => theme.motion.base};
`;

const IconWrap = styled.span<{ tone: 'success' | 'danger' | 'info' }>`
  display: inline-flex;
  flex-shrink: 0;
  color: ${({ theme, tone }) =>
    tone === 'success'
      ? theme.color.market.up
      : tone === 'danger'
        ? theme.color.market.down
        : theme.color.accent.tertiary};
`;

/** Renders uiStore toasts (top-center, portal). Click a toast to dismiss. */
export function ToastHost() {
  const toasts = useUiStore((s) => s.toasts);
  const dismissToast = useUiStore((s) => s.dismissToast);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted || toasts.length === 0) return null;

  return createPortal(
    <Stack role="status" aria-live="polite">
      {toasts.map((t) => (
        <Item key={t.id} tone={t.tone} type="button" onClick={() => dismissToast(t.id)}>
          <IconWrap tone={t.tone}>
            <Icon
              name={t.tone === 'danger' ? 'close' : t.tone === 'success' ? 'check' : 'bell'}
              size={16}
            />
          </IconWrap>
          {t.message}
        </Item>
      ))}
    </Stack>,
    document.body,
  );
}
