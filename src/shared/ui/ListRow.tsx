'use client';

import React from 'react';
import styled from '@emotion/styled';
import { css } from '@emotion/react';

interface ListRowProps {
  left?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
  onClick?: () => void;
}

const Row = styled.div<{ clickable: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(3)};
  padding: ${({ theme }) => theme.space(3)} ${({ theme }) => theme.space(5)};
  transition:
    background ${({ theme }) => theme.motion.fast};
  -webkit-tap-highlight-color: transparent;

  ${({ clickable, theme }) =>
    clickable &&
    css`
      cursor: pointer;
      &:hover {
        background: ${theme.color.glass.surface};
      }
      &:active {
        background: ${theme.color.glass.surfaceStrong};
      }
    `}
`;

const LeftSlot = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
`;

const Content = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

const Title = styled.span`
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  color: ${({ theme }) => theme.color.text.high};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Subtitle = styled.span`
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.color.text.mid};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const RightSlot = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
`;

export function ListRow({ left, title, subtitle, right, onClick }: ListRowProps) {
  return (
    <Row clickable={!!onClick} onClick={onClick}>
      {left && <LeftSlot>{left}</LeftSlot>}
      <Content>
        <Title>{title}</Title>
        {subtitle && <Subtitle>{subtitle}</Subtitle>}
      </Content>
      {right && <RightSlot>{right}</RightSlot>}
    </Row>
  );
}
