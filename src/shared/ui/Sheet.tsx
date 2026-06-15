'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styled from '@emotion/styled';
import { useTheme } from '@emotion/react';
import { IconButton } from './Button';
import { Icon } from './Icon';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
}

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  z-index: ${({ theme }) => theme.zIndex.overlay};
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
`;

const Panel = styled.div`
  position: fixed;
  bottom: 0;
  left: 50%;
  width: 100%;
  max-width: ${({ theme }) => theme.layout.appMaxWidth};
  max-height: 92dvh;
  background: ${({ theme }) => theme.color.bg.raised};
  border-top-left-radius: ${({ theme }) => theme.radius.xl};
  border-top-right-radius: ${({ theme }) => theme.radius.xl};
  border: 1px solid ${({ theme }) => theme.color.glass.border};
  border-bottom: none;
  z-index: ${({ theme }) => theme.zIndex.modal};
  overflow: hidden;
  display: flex;
  flex-direction: column;
  will-change: transform;
`;

/** Drag zone — the top bar (handle + title). Dragging it down dismisses the
 *  sheet; releasing under the threshold snaps it back. */
const Grabber = styled.div`
  flex-shrink: 0;
  cursor: grab;
  touch-action: none;
  user-select: none;

  &:active {
    cursor: grabbing;
  }
`;

const Handle = styled.div`
  width: 40px;
  height: 4px;
  border-radius: ${({ theme }) => theme.radius.pill};
  background: ${({ theme }) => theme.color.glass.borderStrong};
  margin: 10px auto 0;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.space(3)} ${({ theme }) => theme.space(5)}
    ${({ theme }) => theme.space(2)};
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
  overscroll-behavior: contain;
  flex: 1;
  min-height: 0;
  padding: ${({ theme }) => theme.space(2)} ${({ theme }) => theme.space(5)}
    calc(${({ theme }) => theme.space(8)} + env(safe-area-inset-bottom, 0px));
`;

export function Sheet({ open, onClose, title, children }: SheetProps) {
  const theme = useTheme();
  const [mounted, setMounted] = useState(false);
  const [entered, setEntered] = useState(false);
  const [closing, setClosing] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const startYRef = useRef(0);
  const heightRef = useRef(1);
  // Refs mirror drag state so the pointer handlers never read a stale closure.
  const dragYRef = useRef(0);
  const draggingRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setClosing(false);
    setDragY(0);
    setEntered(false);
    // Short timeout (not rAF — rAF is throttled in background/headless tabs):
    // paint at translateY(100%) first, then transition up to 0.
    const id = window.setTimeout(() => setEntered(true), 20);
    return () => window.clearTimeout(id);
  }, [open]);

  const requestClose = useCallback(() => {
    setClosing(true);
    window.setTimeout(onClose, 260);
  }, [onClose]);

  const onPointerDown = (e: React.PointerEvent) => {
    // Let buttons (e.g. the close icon) keep working — don't start a drag.
    if ((e.target as HTMLElement).closest('button')) return;
    startYRef.current = e.clientY;
    heightRef.current = panelRef.current?.offsetHeight ?? 1;
    draggingRef.current = true;
    dragYRef.current = 0;
    setDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Some browsers throw without an active pointer — drag still works.
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const dy = Math.max(0, e.clientY - startYRef.current);
    dragYRef.current = dy;
    setDragY(dy);
  };

  const onPointerUp = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragging(false);
    const threshold = Math.min(150, heightRef.current * 0.3);
    if (dragYRef.current > threshold) {
      requestClose();
    } else {
      dragYRef.current = 0;
      setDragY(0); // snap back
    }
  };

  if (!open || !mounted) return null;

  const translateY = closing || !entered ? '100%' : `${dragY}px`;
  const panelStyle: React.CSSProperties = {
    transform: `translateX(-50%) translateY(${translateY})`,
    transition: dragging ? 'none' : `transform ${theme.motion.spring}`,
  };
  const progress = Math.min(1, dragY / (heightRef.current || 1));
  const backdropStyle: React.CSSProperties = {
    opacity: closing || !entered ? 0 : 1 - progress * 0.75,
    transition: dragging ? 'none' : `opacity ${theme.motion.base}`,
  };

  return createPortal(
    <>
      <Backdrop style={backdropStyle} onClick={requestClose} />
      <Panel
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={panelStyle}
      >
        <Grabber
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <Handle />
          {title != null && (
            <Header>
              <Title>{title}</Title>
              <IconButton label="닫기" onClick={requestClose} size={36}>
                <Icon name="close" size={18} />
              </IconButton>
            </Header>
          )}
        </Grabber>
        <Body>{children}</Body>
      </Panel>
    </>,
    document.body,
  );
}
