/**
 * better-auth server instance — SERVER ONLY.
 *
 * - Email + password enabled (bcrypt-equivalent hashing built in).
 * - Social providers (Google/Kakao) activate automatically when their env
 *   keys are present; otherwise they're omitted and the UI hides the buttons.
 * - Signup cap: user creation beyond MAX_USERS (default 1) is rejected — the
 *   service is single-operator for now.
 */

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { APIError } from 'better-auth/api';
import { count } from 'drizzle-orm';
import { db, schema } from './db';

function maxUsers(): number {
  const v = Number(process.env.MAX_USERS);
  return Number.isFinite(v) && v > 0 ? v : 1;
}

const socialProviders: Record<string, { clientId: string; clientSecret: string }> = {};
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  socialProviders.google = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  };
}
if (process.env.KAKAO_CLIENT_ID && process.env.KAKAO_CLIENT_SECRET) {
  socialProviders.kakao = {
    clientId: process.env.KAKAO_CLIENT_ID,
    clientSecret: process.env.KAKAO_CLIENT_SECRET,
  };
}

export const enabledSocialProviders = Object.keys(socialProviders);

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'sqlite', schema }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  socialProviders,
  databaseHooks: {
    user: {
      create: {
        before: async (u) => {
          const rows = await db.select({ n: count() }).from(schema.user);
          const n = rows[0]?.n ?? 0;
          if (n >= maxUsers()) {
            throw new APIError('FORBIDDEN', {
              message: '현재는 신규 가입을 받지 않습니다. (운영자 전용)',
            });
          }
          return { data: u };
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
