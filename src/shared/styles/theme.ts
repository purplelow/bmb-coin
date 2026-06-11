/**
 * KoinLab (BMB-LAB) design tokens — dark, glassmorphic, neon-accent system.
 * Consumed via Emotion's <ThemeProvider>; access in any
 * styled component through `({ theme }) => theme.color.accent.primary`, etc.
 *
 * Treat this as the single source of visual truth. UI components must read from
 * the theme rather than hard-coding colors/spacing.
 */

export const theme = {
  color: {
    /** Page & surface backgrounds (darkest → raised). */
    bg: {
      base: '#06070D',
      sunken: '#04050A',
      raised: '#0C0E18',
      elevated: '#12152130',
    },
    /** Frosted-glass surfaces (use with backdrop-filter: blur). */
    glass: {
      surface: 'rgba(255, 255, 255, 0.045)',
      surfaceStrong: 'rgba(255, 255, 255, 0.07)',
      border: 'rgba(255, 255, 255, 0.09)',
      borderStrong: 'rgba(255, 255, 255, 0.16)',
      highlight: 'rgba(255, 255, 255, 0.12)',
    },
    /** Neon accents. */
    accent: {
      primary: '#C5FF4A', // neon lime — primary CTA / brand
      primarySoft: 'rgba(197, 255, 74, 0.14)',
      secondary: '#7C5CFF', // electric violet
      secondarySoft: 'rgba(124, 92, 255, 0.16)',
      tertiary: '#39E5FF', // cyan
      tertiarySoft: 'rgba(57, 229, 255, 0.16)',
    },
    /** Market semantics. */
    market: {
      up: '#2FE6A8',
      upSoft: 'rgba(47, 230, 168, 0.14)',
      down: '#FF5B73',
      downSoft: 'rgba(255, 91, 115, 0.14)',
      flat: '#98A0B3',
    },
    /** Status. */
    status: {
      warning: '#FFB13D',
      danger: '#FF5B73',
      success: '#2FE6A8',
      info: '#39E5FF',
    },
    /** Text. */
    text: {
      high: '#EEF1FB',
      mid: '#98A0B3',
      low: '#5A6378',
      inverse: '#06070D',
    },
  },

  gradient: {
    /** Hero / brand sweep. */
    brand: 'linear-gradient(135deg, #C5FF4A 0%, #39E5FF 100%)',
    violet: 'linear-gradient(135deg, #7C5CFF 0%, #39E5FF 100%)',
    /** Subtle top glow over the page background. */
    pageGlow:
      'radial-gradient(120% 80% at 50% -10%, rgba(124, 92, 255, 0.18) 0%, rgba(6, 7, 13, 0) 60%)',
    up: 'linear-gradient(180deg, rgba(47, 230, 168, 0.22) 0%, rgba(47, 230, 168, 0) 100%)',
    down: 'linear-gradient(180deg, rgba(255, 91, 115, 0.22) 0%, rgba(255, 91, 115, 0) 100%)',
  },

  /** 4px base spacing scale. Use `theme.space(3)` → "12px". */
  space: (n: number) => `${n * 4}px`,

  radius: {
    sm: '10px',
    md: '16px',
    lg: '22px',
    xl: '28px',
    pill: '999px',
    circle: '50%',
  },

  font: {
    family:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif",
    mono: "'SF Mono', 'JetBrains Mono', ui-monospace, 'Menlo', monospace",
    size: {
      xs: '11px',
      sm: '13px',
      md: '15px',
      lg: '17px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
      '4xl': '40px',
    },
    weight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },

  shadow: {
    card: '0 8px 30px rgba(0, 0, 0, 0.35)',
    raised: '0 16px 50px rgba(0, 0, 0, 0.45)',
    glowPrimary: '0 8px 28px rgba(197, 255, 74, 0.28)',
    glowSecondary: '0 8px 28px rgba(124, 92, 255, 0.32)',
  },

  blur: {
    glass: 'blur(18px)',
    strong: 'blur(28px)',
  },

  /** Mobile-first phone-shell width. */
  layout: {
    appMaxWidth: '440px',
    bottomNavHeight: '72px',
    headerHeight: '56px',
    pagePadding: '20px',
  },

  motion: {
    fast: '140ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '240ms cubic-bezier(0.4, 0, 0.2, 1)',
    spring: '420ms cubic-bezier(0.22, 1, 0.36, 1)',
  },

  zIndex: {
    base: 0,
    sticky: 10,
    bottomNav: 50,
    header: 50,
    overlay: 100,
    modal: 110,
    toast: 120,
  },
} as const;

export type AppTheme = typeof theme;
