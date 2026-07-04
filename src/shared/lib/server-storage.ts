'use client';

/**
 * zustand persist용 서버 스토리지 어댑터.
 *
 * localStorage 대신 /api/state (세션 스코프, SQLite)를 사용한다.
 * - 비로그인 상태: getItem이 null을 돌려주고 스토어는 기본값으로 동작.
 * - 최초 1회 마이그레이션: 서버에 데이터가 없고 예전 localStorage 키가 있으면
 *   그 값을 서버로 올린 뒤 사용한다.
 * - setItem은 짧게 디바운스해 연속 조작(슬라이더 등)의 쓰기 폭주를 막는다.
 */

import type { StateStorage } from 'zustand/middleware';

export function serverStateStorage(key: string, legacyLocalStorageKey?: string): StateStorage {
  let writeTimer: ReturnType<typeof setTimeout> | null = null;
  let pendingValue: string | null = null;

  const flush = async () => {
    if (pendingValue === null) return;
    const value = pendingValue;
    pendingValue = null;
    try {
      await fetch('/api/state', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      });
    } catch {
      // Offline / logged out — the next write retries.
    }
  };

  return {
    getItem: async () => {
      try {
        const res = await fetch(`/api/state?key=${encodeURIComponent(key)}`);
        if (!res.ok) return null; // 401(비로그인) 등 — 기본값 사용
        const data = (await res.json()) as { value: string | null };
        if (data.value !== null) return data.value;

        // One-time migration from the old localStorage persistence.
        if (legacyLocalStorageKey) {
          const legacy = localStorage.getItem(legacyLocalStorageKey);
          if (legacy) {
            void fetch('/api/state', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ key, value: legacy }),
            }).then(() => localStorage.removeItem(legacyLocalStorageKey));
            return legacy;
          }
        }
        return null;
      } catch {
        return null;
      }
    },

    setItem: (_name, value) => {
      pendingValue = value;
      if (writeTimer) clearTimeout(writeTimer);
      writeTimer = setTimeout(() => {
        writeTimer = null;
        void flush();
      }, 400);
    },

    removeItem: async () => {
      try {
        await fetch(`/api/state?key=${encodeURIComponent(key)}`, { method: 'DELETE' });
      } catch {
        // ignore
      }
    },
  };
}
