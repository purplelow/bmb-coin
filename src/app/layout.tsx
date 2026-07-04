import { Providers } from './providers';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'KoinLab — 코인 자동매매',
  description: 'BMB-LAB · 지표 기반 코인 자동매매 · 모의거래(테스트) 모드',
};

export const viewport: Viewport = {
  themeColor: '#06070D',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
