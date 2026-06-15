'use client';

import { Global, css, useTheme } from '@emotion/react';

/** App-wide CSS reset + base typography + page background. */
export function GlobalStyles() {
  const theme = useTheme();
  return (
    <Global
      styles={css`
        *,
        *::before,
        *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        html,
        body {
          height: 100%;
          /* The window NEVER scrolls — each route owns exactly one internal
             scroller (app shell <main>, onboarding root, sheet body). This is
             what prevents double scrollbars / nested wheel chaining. */
          overflow: hidden;
        }

        body {
          font-family: ${theme.font.family};
          font-size: ${theme.font.size.md};
          line-height: 1.4;
          color: ${theme.color.text.high};
          background: ${theme.color.bg.base};
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;
          overscroll-behavior: none;
        }

        button {
          font-family: inherit;
          cursor: pointer;
          border: none;
          background: none;
          color: inherit;
        }

        input,
        select,
        textarea {
          font-family: inherit;
          color: inherit;
        }

        a {
          color: inherit;
          text-decoration: none;
        }

        ul,
        ol {
          list-style: none;
        }

        /* Thin, subtle scrollbars to match the dark UI. */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-thumb {
          background: ${theme.color.glass.border};
          border-radius: ${theme.radius.pill};
        }

        :root {
          color-scheme: dark;
        }
      `}
    />
  );
}
