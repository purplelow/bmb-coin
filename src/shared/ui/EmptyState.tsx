'use client';

import React from 'react';
import styled from '@emotion/styled';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: ${({ theme }) => theme.space(10)} ${({ theme }) => theme.space(6)};
  gap: ${({ theme }) => theme.space(3)};
`;

const IconSlot = styled.div`
  color: ${({ theme }) => theme.color.text.low};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: ${({ theme }) => theme.space(1)};
`;

const Title = styled.p`
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.color.text.mid};
  margin: 0;
`;

const Description = styled.p`
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.color.text.low};
  margin: 0;
  max-width: 260px;
  line-height: 1.5;
`;

const ActionSlot = styled.div`
  margin-top: ${({ theme }) => theme.space(2)};
`;

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <Wrapper>
      {icon && <IconSlot>{icon}</IconSlot>}
      <Title>{title}</Title>
      {description && <Description>{description}</Description>}
      {action && <ActionSlot>{action}</ActionSlot>}
    </Wrapper>
  );
}
