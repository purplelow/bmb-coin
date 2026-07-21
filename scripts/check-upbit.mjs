#!/usr/bin/env node
/**
 * Upbit Open API 키 검증 스크립트 — 앱을 띄우지 않고 키 상태를 점검한다.
 *
 *   pnpm upbit:check
 *
 * 확인 항목:
 *   1. .env.local 에 UPBIT_ACCESS_KEY / UPBIT_SECRET_KEY 존재 여부
 *   2. GET /v1/accounts      — 키 유효성 + 자산조회 권한 + 허용 IP (잔고 요약 출력)
 *   3. GET /v1/api_keys      — 키 만료일
 *   4. GET /v1/orders/chance — 주문 관련 권한 + 최소 주문 금액 (주문을 넣지는 않음)
 *
 * 주문을 실제로 전송하지 않으므로 아무리 돌려도 안전하다.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'https://api.upbit.com';

// ── .env.local 로드 (dotenv 없이) ─────────────────────────────────
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const accessKey = process.env.UPBIT_ACCESS_KEY;
const secretKey = process.env.UPBIT_SECRET_KEY;

const ok = (msg) => console.log(`  ✅ ${msg}`);
const bad = (msg) => console.log(`  ❌ ${msg}`);

if (!accessKey || !secretKey) {
  bad('UPBIT_ACCESS_KEY / UPBIT_SECRET_KEY 가 .env.local 에 비어 있습니다.');
  console.log('\n  업비트 PC웹 → 마이페이지 → Open API 관리에서 키를 발급하세요.');
  console.log('  권한: 자산조회 + 주문조회 + 주문하기 만 (입금/출금 금지)');
  console.log('  허용 IP: curl ifconfig.me 결과를 등록');
  process.exit(1);
}

function base64url(input) {
  return Buffer.from(input).toString('base64url');
}

function token(params) {
  const payload = { access_key: accessKey, nonce: crypto.randomUUID() };
  if (params && Object.keys(params).length > 0) {
    const query = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)]),
    ).toString();
    payload.query_hash = crypto.createHash('sha512').update(query, 'utf8').digest('hex');
    payload.query_hash_alg = 'SHA512';
  }
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify(payload));
  const sig = base64url(
    crypto.createHmac('sha256', secretKey).update(`${header}.${body}`).digest(),
  );
  return `${header}.${body}.${sig}`;
}

async function authGet(pathname, params) {
  const qs = params
    ? '?' +
      new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()
    : '';
  const res = await fetch(`${BASE}${pathname}${qs}`, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${token(params)}` },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${text}`);
  return JSON.parse(text);
}

console.log('\nUpbit Open API 키 점검\n');

let failed = false;

// 1. 자산조회 (키 유효성 + IP 허용 확인)
try {
  const accounts = await authGet('/v1/accounts');
  ok('키 유효 + 자산조회 권한 + IP 허용 확인');
  for (const a of accounts) {
    const bal = parseFloat(a.balance) + parseFloat(a.locked);
    if (bal > 0) console.log(`     ${a.currency}: ${bal.toLocaleString()}`);
  }
  if (accounts.every((a) => parseFloat(a.balance) + parseFloat(a.locked) === 0)) {
    console.log('     (잔고 없음 — 원화 입금 필요)');
  }
} catch (e) {
  failed = true;
  bad(`자산조회 실패: ${e.message}`);
  if (String(e.message).includes('no_authorization_ip')) {
    console.log('     → 허용 IP 불일치. curl ifconfig.me 결과를 업비트에 등록하세요.');
  }
}

// 2. 키 만료일
try {
  const keys = await authGet('/v1/api_keys');
  for (const k of keys) {
    const days = Math.round((new Date(k.expire_at) - Date.now()) / 86400000);
    const line = `키 만료: ${k.expire_at} (${days}일 남음)`;
    days < 30 ? bad(line + ' — 갱신 준비 필요') : ok(line);
  }
} catch (e) {
  console.log(`  ⚠️  만료일 조회 실패 (치명적 아님): ${e.message}`);
}

// 3. 주문 권한 (orders/chance 는 주문을 넣지 않음)
try {
  const chance = await authGet('/v1/orders/chance', { market: 'KRW-BTC' });
  ok(`주문 권한 확인 (KRW-BTC 최소 주문 ₩${Number(chance.market?.bid?.min_total ?? 5000).toLocaleString()}, 수수료 ${Number(chance.bid_fee) * 100}%)`);
} catch (e) {
  failed = true;
  bad(`주문 권한 확인 실패: ${e.message}`);
  console.log('     → 키 발급 시 "주문하기/주문조회" 권한이 빠졌을 수 있습니다.');
}

console.log(failed ? '\n점검 실패 — 위 항목을 해결한 뒤 다시 실행하세요.\n' : '\n모든 점검 통과 — 실거래 준비 완료. 서버 재시작 후 설정에서 LIVE ON.\n');
process.exit(failed ? 1 : 0);
