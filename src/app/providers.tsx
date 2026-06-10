'use client';

import { ThemeProvider } from '@emotion/react';
import EmotionRegistry from '@/shared/styles/EmotionRegistry';
import { GlobalStyles } from '@/shared/styles/GlobalStyles';
import { theme } from '@/shared/styles/theme';
import AppBootstrap from '@/stores/AppBootstrap';

/** Wraps the app in the Emotion SSR cache, theme, global styles, and the
 * client-side bootstrap that starts the market simulator + trading engine. */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <EmotionRegistry>
      <ThemeProvider theme={theme}>
        <GlobalStyles />
        <AppBootstrap />
        {children}
      </ThemeProvider>
    </EmotionRegistry>
  );
}
