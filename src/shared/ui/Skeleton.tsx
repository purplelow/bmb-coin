'use client';

import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  className?: string;
}

const shimmer = keyframes`
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
`;

const SkeletonBlock = styled.span<{
  w: string;
  h: string;
  br: string;
}>`
  display: block;
  width: ${({ w }) => w};
  height: ${({ h }) => h};
  border-radius: ${({ br }) => br};
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.04) 25%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(255, 255, 255, 0.04) 75%
  );
  background-size: 800px 100%;
  animation: ${shimmer} 1.6s ease-in-out infinite;
`;

export function Skeleton({
  width = '100%',
  height = '16px',
  borderRadius = '8px',
  className,
}: SkeletonProps) {
  const w = typeof width === 'number' ? `${width}px` : width;
  const h = typeof height === 'number' ? `${height}px` : height;

  return <SkeletonBlock w={w} h={h} br={borderRadius} className={className} />;
}
