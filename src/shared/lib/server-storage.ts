'use client';

/**
 * zustand persist용 스토리지 어댑터 — 로그인 여부에 따라 이원화.
 *
 * - 로그인 상태: /api/state (세션 스코프, SQLite)에 저장 → 기기 간 동기화.
 * - 비로그인 상태(401): localStorage로 폴백 → 예전처럼 모의거래를 계정 없이
 *   자유롭게 쓰고, 봇/설정도 브라우저에 유지된다.
 * - 로그인 후 서버에 데이터가 없으면 localStorage 값을 1회 서버로 이전한다.
 * - setItem은 짧게 디바운스해 연속 조작(슬라이더 등)의 쓰기 폭주를 막는다.
 */

import type { StateStorage } from 'zustand/middleware';

export function serverStateStorage(key: string, localStorageKey: string): StateStorage {
  let writeTimer: ReturnType<typeof setTimeout> | null = null;
  let pendingValue: string | null = null;

  const flush = async () => {
    if (pendingValue === null) return;
    const value = pendingValue;
    pendingValue = null;
    try {
      const res = await fetch('/api/state', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      });
      if (res.status === 401) {
        // 비로그인 — 브라우저에 저장 (로그인하면 1회 이전됨).
        localStorage.setItem(localStorageKey, value);
      }
    } catch {
      // 네트워크 오류 — 최소한 로컬에는 남긴다.
      try {
        localStorage.setItem(localStorageKey, value);
      } catch {
        /* storage full/blocked — drop */
      }
    }
  };

  return {
    getItem: async () => {
      try {
        const res = await fetch(`/api/state?key=${encodeURIComponent(key)}`);
        if (res.status === 401) {
          // 비로그인 — 로컬 값 사용.
          return localStorage.getItem(localStorageKey);
        }
        if (!res.ok) return null;
        const data = (await res.json()) as { value: string | null };
        if (data.value !== null) return data.value;

        // 로그인됐지만 서버가 비어 있음 → 로컬 데이터 1회 이전.
        const legacy = localStorage.getItem(localStorageKey);
        if (legacy) {
          void fetch('/api/state', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, value: legacy }),
          }).then((r) => {
            if (r.ok) localStorage.removeItem(localStorageKey);
          });
          return legacy;
        }
        return null;
      } catch {
        // 서버 접근 불가 — 로컬 폴백.
        try {
          return localStorage.getItem(localStorageKey);
        } catch {
          return null;
        }
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
        localStorage.removeItem(localStorageKey);
        await fetch(`/api/state?key=${encodeURIComponent(key)}`, { method: 'DELETE' });
      } catch {
        // ignore
      }
    },
  };
}
