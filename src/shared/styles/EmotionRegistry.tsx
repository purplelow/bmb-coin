'use client';

/**
 * SSR-safe Emotion cache for the Next.js App Router.
 *
 * Collects styles inserted during render and flushes them into the streamed
 * HTML via `useServerInsertedHTML`, so first paint is already styled (no FOUC).
 * Pattern from Emotion's official Next.js App Router guide.
 */

import { useState } from 'react';
import { useServerInsertedHTML } from 'next/navigation';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import type { EmotionCache, SerializedStyles } from '@emotion/utils';

export default function EmotionRegistry({ children }: { children: React.ReactNode }) {
  const [{ cache, flush }] = useState(() => {
    const cache: EmotionCache = createCache({ key: 'css' });
    cache.compat = true;
    const prevInsert = cache.insert;
    let inserted: string[] = [];
    cache.insert = (...args: Parameters<EmotionCache['insert']>) => {
      const serialized = args[1] as SerializedStyles;
      if (cache.inserted[serialized.name] === undefined) {
        inserted.push(serialized.name);
      }
      return prevInsert(...args);
    };
    const flush = () => {
      const prev = inserted;
      inserted = [];
      return prev;
    };
    return { cache, flush };
  });

  useServerInsertedHTML(() => {
    const names = flush();
    if (names.length === 0) return null;
    let styles = '';
    for (const name of names) {
      styles += cache.inserted[name];
    }
    return (
      <style
        data-emotion={`${cache.key} ${names.join(' ')}`}
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: styles }}
      />
    );
  });

  return <CacheProvider value={cache}>{children}</CacheProvider>;
}
