'use client';

/**
 * better-auth 클라이언트 — 로그인/가입/로그아웃/세션 훅.
 *
 * 사용법:
 *   await authClient.signUp.email({ email, password, name });
 *   await authClient.signIn.email({ email, password });
 *   await authClient.signIn.social({ provider: 'google' });
 *   await authClient.signOut();
 *   const { data: session } = authClient.useSession();
 */

import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient();

export const { useSession, signIn, signUp, signOut } = authClient;
