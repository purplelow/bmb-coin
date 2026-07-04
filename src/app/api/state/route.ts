import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db, schema } from '@/server/db';
import { requireSession } from '@/server/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Per-user JSON documents (bots, settings). Session-scoped. */
const ALLOWED_KEYS = new Set(['bots', 'settings']);

export async function GET(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const key = req.nextUrl.searchParams.get('key') ?? '';
  if (!ALLOWED_KEYS.has(key)) {
    return NextResponse.json({ error: 'unknown key' }, { status: 400 });
  }

  const rows = await db
    .select({ value: schema.userData.value })
    .from(schema.userData)
    .where(and(eq(schema.userData.userId, session.user.id), eq(schema.userData.key, key)))
    .limit(1);

  return NextResponse.json({ value: rows[0]?.value ?? null });
}

export async function PUT(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  let body: { key?: string; value?: string };
  try {
    body = (await req.json()) as { key?: string; value?: string };
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }

  const { key, value } = body;
  if (!key || !ALLOWED_KEYS.has(key) || typeof value !== 'string') {
    return NextResponse.json({ error: 'invalid key/value' }, { status: 400 });
  }
  // Sanity cap — these are small JSON documents, not blob storage.
  if (value.length > 256_000) {
    return NextResponse.json({ error: 'value too large' }, { status: 413 });
  }

  await db
    .insert(schema.userData)
    .values({ userId: session.user.id, key, value, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [schema.userData.userId, schema.userData.key],
      set: { value, updatedAt: new Date() },
    });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  const key = req.nextUrl.searchParams.get('key') ?? '';
  if (!ALLOWED_KEYS.has(key)) {
    return NextResponse.json({ error: 'unknown key' }, { status: 400 });
  }

  await db
    .delete(schema.userData)
    .where(and(eq(schema.userData.userId, session.user.id), eq(schema.userData.key, key)));

  return NextResponse.json({ ok: true });
}
