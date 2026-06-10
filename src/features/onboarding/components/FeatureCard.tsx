'use client';

import styled from '@emotion/styled';
import { GlassCard, Icon } from '@/shared/ui';
import type { IconName } from '@/shared/ui';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface FeatureCardProps {
  icon: IconName;
  title: string;
  description: string;
  accentColor?: 'primary' | 'secondary' | 'tertiary';
}

// ── Styled ─────────────────────────────────────────────────────────────────────

const CardInner = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space(2)};
`;

const IconWrap = styled.div<{ accentColor: 'primary' | 'secondary' | 'tertiary' }>`
  width: 44px;
  height: 44px;
  border-radius: ${({ theme }) => theme.radius.md};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: ${({ accentColor, theme }) => {
    switch (accentColor) {
      case 'primary':   return theme.color.accent.primarySoft;
      case 'secondary': return theme.color.accent.secondarySoft;
      case 'tertiary':  return theme.color.accent.tertiarySoft;
    }
  }};
  color: ${({ accentColor, theme }) => {
    switch (accentColor) {
      case 'primary':   return theme.color.accent.primary;
      case 'secondary': return theme.color.accent.secondary;
      case 'tertiary':  return theme.color.accent.tertiary;
    }
  }};
`;

const CardTitle = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.color.text.high};
  line-height: 1.3;
`;

const CardDescription = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.regular};
  color: ${({ theme }) => theme.color.text.mid};
  line-height: 1.5;
`;

// ── Component ──────────────────────────────────────────────────────────────────

export function FeatureCard({
  icon,
  title,
  description,
  accentColor = 'primary',
}: FeatureCardProps) {
  return (
    <GlassCard padding={4}>
      <CardInner>
        <IconWrap accentColor={accentColor}>
          <Icon name={icon} size={20} />
        </IconWrap>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardInner>
    </GlassCard>
  );
}
