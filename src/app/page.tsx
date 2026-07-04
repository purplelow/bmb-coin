'use client';

import { useRouter } from 'next/navigation';
import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import { FeatureCard } from '@/features/onboarding/components/FeatureCard';
import { HeroCoin } from '@/features/onboarding/components/HeroCoin';
import { Button, Badge } from '@/shared/ui';

// ── Animations ────────────────────────────────────────────────────────────────

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
`;

// ── Layout ─────────────────────────────────────────────────────────────────────

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
  padding: ${({ theme }) => theme.space(10)} ${({ theme }) => theme.layout.pagePadding}
    ${({ theme }) => theme.space(10)};
  gap: 0;
  overflow: hidden;
`;

// ── Section wrappers with staggered fade-up ────────────────────────────────────

const Anim = styled.div<{ delay?: number }>`
  animation: ${fadeUp} 0.7s ${({ theme }) => theme.motion.spring} both;
  animation-delay: ${({ delay = 0 }) => delay}ms;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

// ── Wordmark ───────────────────────────────────────────────────────────────────

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

// ── Tagline ────────────────────────────────────────────────────────────────────

const Tagline = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  color: ${({ theme }) => theme.color.text.mid};
  text-align: center;
  line-height: 1.6;
  max-width: 300px;
`;

// ── Feature grid ──────────────────────────────────────────────────────────────

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.space(3)};
  width: 100%;
`;

// ── Test mode badge row ────────────────────────────────────────────────────────

const TestModeRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.space(2)};
  padding: ${({ theme }) => theme.space(2)} ${({ theme }) => theme.space(4)};
  background: ${({ theme }) => theme.color.status.warning}1a;
  border: 1px solid ${({ theme }) => theme.color.status.warning}40;
  border-radius: ${({ theme }) => theme.radius.pill};
`;

const TestModeText = styled.span`
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.color.status.warning};
  letter-spacing: 0.04em;
`;

const TestModeDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: ${({ theme }) => theme.radius.circle};
  background: ${({ theme }) => theme.color.status.warning};
  display: inline-block;
  box-shadow: 0 0 6px ${({ theme }) => theme.color.status.warning};
`;

// ── CTA section ───────────────────────────────────────────────────────────────

const CtaWrapper = styled.div`
  width: 100%;
  padding: ${({ theme }) => theme.space(2)} 0 0;
`;

const CtaFootnote = styled.p`
  margin: ${({ theme }) => theme.space(3)} 0 0;
  text-align: center;
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.color.text.low};
`;

// ── Spacers ───────────────────────────────────────────────────────────────────

const Spacer = styled.div<{ size: number }>`
  height: ${({ theme, size }) => theme.space(size)};
  flex-shrink: 0;
`;

// ── Separator line ────────────────────────────────────────────────────────────

const Sep = styled.div`
  width: 40px;
  height: 2px;
  border-radius: ${({ theme }) => theme.radius.pill};
  background: ${({ theme }) => theme.color.glass.border};
`;

// ── Data ──────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: 'bot' as const,
    title: '자동매매 봇',
    description: '전략 기반 봇이 24/7 매매를 대신',
    accentColor: 'primary' as const,
  },
  {
    icon: 'spark' as const,
    title: '실시간 시뮬레이션',
    description: '모의시장에서 전략을 안전하게 검증',
    accentColor: 'secondary' as const,
  },
  {
    icon: 'wallet' as const,
    title: '모의 포트폴리오',
    description: '손익 추적과 잔고를 한눈에 확인',
    accentColor: 'tertiary' as const,
  },
];

// ── Page component ────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();

  function handleStart() {
    // Landing → login. (Already-authenticated visitors are bounced from
    // /login to /dashboard by the middleware, so one target covers both.)
    router.push('/login');
  }

  return (
    <PageRoot>
      <Shell>
        {/* Wordmark */}
        <Anim delay={0} style={{ alignItems: 'center' }}>
          <Wordmark>
            KoinLab
            <WordmarkSub>BMB-LAB</WordmarkSub>
          </Wordmark>
        </Anim>

        <Spacer size={8} />

        {/* Hero coin */}
        <Anim delay={120} style={{ alignItems: 'center' }}>
          <HeroCoin />
        </Anim>

        <Spacer size={7} />

        {/* Tagline */}
        <Anim delay={220} style={{ alignItems: 'center' }}>
          <Tagline>
            지표 기반 코인 자동매매
            <br />
            모의투자로 안전하게
          </Tagline>
        </Anim>

        <Spacer size={7} />
        <Anim delay={280} style={{ alignItems: 'center' }}>
          <Sep />
        </Anim>
        <Spacer size={7} />

        {/* Feature highlights */}
        <Anim delay={340}>
          <FeatureGrid>
            {FEATURES.map((f) => (
              <FeatureCard
                key={f.icon}
                icon={f.icon}
                title={f.title}
                description={f.description}
                accentColor={f.accentColor}
              />
            ))}
          </FeatureGrid>
        </Anim>

        <Spacer size={8} />

        {/* Test mode notice */}
        <Anim delay={420} style={{ alignItems: 'center' }}>
          <TestModeRow>
            <TestModeDot />
            <TestModeText>TEST MODE &middot; 모의거래</TestModeText>
            <Badge tone="warning">PAPER</Badge>
          </TestModeRow>
        </Anim>

        <Spacer size={8} />

        {/* CTA button */}
        <Anim delay={500}>
          <CtaWrapper>
            <Button variant="primary" size="lg" fullWidth onClick={handleStart}>
              시작하기
            </Button>
            <CtaFootnote>실제 자산을 사용하지 않는 안전한 모의투자입니다</CtaFootnote>
          </CtaWrapper>
        </Anim>
      </Shell>
    </PageRoot>
  );
}
