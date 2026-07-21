import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // 24시간 prod 서버(.next)가 도는 동안 dev를 병행해도 캐시가 안 깨지도록
  // NEXT_DIST_DIR로 빌드 디렉토리를 분리할 수 있다. (예: NEXT_DIST_DIR=.next-dev pnpm dev)
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // Emotion's SWC transform: enables `css` prop, source maps, and component labels.
  compiler: {
    emotion: true,
  },
  // First-scaffold convenience; tighten once CI/lint is wired up.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
