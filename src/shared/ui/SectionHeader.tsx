'use client';

import React from 'react';
import styled from '@emotion/styled';

interface SectionHeaderProps {
  title: string;
  action?: React.ReactNode;
}

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space(2)};
  margin-bottom: ${({ theme }) => theme.space(3)};
`;

const Title = styled.h3`
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.color.text.high};
  margin: 0;
`;

const ActionSlot = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 0;
`;

export function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <Row>
      <Title>{title}</Title>
      {action && <ActionSlot>{action}</ActionSlot>}
    </Row>
  );
}
