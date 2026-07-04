'use client';

import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';

// ── Animations ────────────────────────────────────────────────────────────────

const floatY = keyframes`
  0%, 100% { transform: translateY(0px) rotateX(12deg) rotateY(-8deg); }
  50%       { transform: translateY(-12px) rotateX(12deg) rotateY(-8deg); }
`;

const rotateSlow = keyframes`
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const rotateSlow2 = keyframes`
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(-360deg); }
`;

const pulseGlow = keyframes`
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50%       { opacity: 1;   transform: scale(1.12); }
`;

// ── Styled shells ─────────────────────────────────────────────────────────────

const CoinScene = styled.div`
  position: relative;
  width: 180px;
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  perspective: 600px;
`;

/** Outer ambient glow blobs */
const GlowBlob = styled.div<{ color: string; size: number; delay?: number }>`
  position: absolute;
  width: ${({ size }) => size}px;
  height: ${({ size }) => size}px;
  border-radius: ${({ theme }) => theme.radius.circle};
  background: ${({ color }) => color};
  filter: blur(34px);
  opacity: 0.55;
  animation: ${pulseGlow} 3.2s ease-in-out infinite;
  animation-delay: ${({ delay = 0 }) => delay}s;
  pointer-events: none;
`;

/** Rotating orbit ring */
const OrbitRing = styled.div<{ diameter: number; delay?: number; reverse?: boolean }>`
  position: absolute;
  width: ${({ diameter }) => diameter}px;
  height: ${({ diameter }) => diameter}px;
  border-radius: ${({ theme }) => theme.radius.circle};
  border: 1.5px solid transparent;
  border-top-color: rgba(197, 255, 74, 0.45);
  border-right-color: rgba(57, 229, 255, 0.25);
  animation: ${({ reverse }) => (reverse ? rotateSlow2 : rotateSlow)}
    ${({ delay = 0 }) => 5 + delay}s linear infinite;
  pointer-events: none;
`;

/** The coin disc itself */
const CoinDisc = styled.div`
  position: relative;
  width: 104px;
  height: 104px;
  border-radius: ${({ theme }) => theme.radius.circle};
  animation: ${floatY} 4s ease-in-out infinite;

  /* 3-D face: layered radial gradients */
  background:
    radial-gradient(circle at 38% 32%, rgba(255, 255, 255, 0.18) 0%, transparent 52%),
    radial-gradient(circle at 62% 68%, rgba(124, 92, 255, 0.28) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, #1c1f35 0%, #0c0e1e 60%, #06070d 100%);

  border: 1.5px solid rgba(197, 255, 74, 0.35);

  /* elevation shadow */
  box-shadow:
    0 0 0 2px rgba(197, 255, 74, 0.12),
    0 8px 40px rgba(124, 92, 255, 0.45),
    0 24px 60px rgba(0, 0, 0, 0.6),
    inset 0 1px 0 rgba(255, 255, 255, 0.14),
    inset 0 -2px 4px rgba(0, 0, 0, 0.5);

  display: flex;
  align-items: center;
  justify-content: center;
  transform-style: preserve-3d;
`;

const CoinInner = styled.div`
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: ${({ theme }) => theme.radius.circle};
  background: radial-gradient(
    circle at 40% 35%,
    rgba(197, 255, 74, 0.22) 0%,
    rgba(57, 229, 255, 0.1) 45%,
    transparent 70%
  );
  border: 1px solid rgba(197, 255, 74, 0.22);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CoinLabel = styled.span`
  font-family: ${({ theme }) => theme.font.mono};
  font-size: 18px;
  font-weight: ${({ theme }) => theme.font.weight.bold};
  letter-spacing: -0.5px;
  background: ${({ theme }) => theme.gradient.brand};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  user-select: none;
`;

// ── Component ─────────────────────────────────────────────────────────────────

export function HeroCoin() {
  return (
    <CoinScene aria-hidden="true">
      {/* Ambient glow blobs */}
      <GlowBlob
        color="rgba(124, 92, 255, 0.6)"
        size={110}
        delay={0}
        style={{ top: 20, left: 20 }}
      />
      <GlowBlob
        color="rgba(57, 229, 255, 0.45)"
        size={80}
        delay={1.4}
        style={{ bottom: 22, right: 24 }}
      />
      <GlowBlob
        color="rgba(197, 255, 74, 0.35)"
        size={60}
        delay={0.7}
        style={{ bottom: 30, left: 30 }}
      />

      {/* Orbit rings */}
      <OrbitRing diameter={162} delay={0} />
      <OrbitRing diameter={138} delay={1.2} reverse />

      {/* Coin disc */}
      <CoinDisc>
        <CoinInner>
          <CoinLabel>₿</CoinLabel>
        </CoinInner>
      </CoinDisc>
    </CoinScene>
  );
}
