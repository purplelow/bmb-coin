import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
