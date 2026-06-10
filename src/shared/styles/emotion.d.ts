import '@emotion/react';
import type { AppTheme } from './theme';

/**
 * Augments Emotion's `Theme` with our token shape so that
 * `({ theme }) => theme.color...` is fully typed in every styled component.
 */
declare module '@emotion/react' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface Theme extends AppTheme {}
}
