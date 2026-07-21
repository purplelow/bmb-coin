# KoinLab 세션 핸드오프 (맥북 → 맥 미니)

> 이 문서는 맥북에서 진행한 Claude Code 세션의 전체 맥락 요약입니다.
> 맥 미니에서 새 세션을 시작할 때 "HANDOFF.md 읽고 이어서 진행해줘"라고 하면 됩니다.
> (2026-06-15 기준. 완료되면 이 파일은 지워도 됩니다.)

## 프로젝트 정체

- **KoinLab** (BMB-LAB, 형제 제품 QuantLab=주식) — 업비트 KRW 마켓 코인 자동매매 앱, 운영자 1인 전용
- Next.js 15 App Router · React 19 · TS strict · Zustand 5 · Emotion 11 · pnpm · better-auth + Drizzle/SQLite
- GitHub: `purplelow/bmb-coin` · 다크/글래스/네온 모바일 UI (440px 셸)

## 아키텍처 한 장

- **모드 2개**: 테스트(모의) = 브라우저 시뮬레이터+클라이언트 엔진 / 라이브(실거래) = **서버가 전담**
- **서버 엔진** `src/server/engine/runner.ts` — instrumentation.ts가 서버 부팅 시 기동, 20초 틱.
  DB에서 봇/설정 읽음 → 손절/익절 먼저 → 전략(MA cross/RSI) 신호 → 서버에서 직접 업비트 주문.
  클라이언트 엔진은 테스트 모드 전용(이중 체결 방지). 하트비트: /api/engine/status + 설정 화면 카드
- **안전장치(서버 강제)**: 1회 ₩100,000 / 일 ₩500,000 하드캡(env), 봇 자동매수 기본 OFF(매도만),
  기본 주문 금액(프리셋 5k/10k/20k + 직접 입력, 봇별 주문 금액이 우선), 킬스위치, 주문 API 세션 필수
- **인증**: better-auth, MAX_USERS=1 (첫 가입자=운영자, 현재 **가입자 0명 — 슬롯 비어 있음**).
  로그인은 옵션 — 비로그인 = 모의거래 전체 + localStorage 저장, 로그인 = DB 저장 + 실거래
- **DB**: 루트 `koinlab.db` (SQLite, gitignore). user/session/account/verification + userData(봇·설정 JSON)
- **비밀**: `.env.local` (gitignore) — 업비트 키(아직 빈칸), BETTER_AUTH_SECRET, 한도 env

## 실거래 진행 상황 (사용자 체크리스트)

- [x] 케이뱅크 계좌
- [x] 업비트 가입 + KYC + 계좌연동
- [ ] 원화 입금 (5~10만원 권장; 봇 한도상 그 이상 불필요)
- [ ] **Open API 키 발급** — PC웹, 권한: 자산조회+주문조회+주문하기 **만** (입금/출금 금지),
      허용 IP: **58.143.169.44** (맥북/미니가 같은 집 네트워크면 동일; `curl ifconfig.me`로 재확인)
- [ ] 키를 `.env.local`의 UPBIT_ACCESS_KEY / UPBIT_SECRET_KEY에 입력 → `pnpm upbit:check`로 검증 → 서버 재시작
- [ ] 앱에서 회원가입(첫 계정) → 설정에서 LIVE ON → 봇 생성 → (선택) 자동매수 허용 ON
- 24시간 운영: `pnpm trade:24h` (빌드+caffeinate+prod 서버)

## 미니로 옮길 파일 (git에 없는 것들 — AirDrop/USB로만)

1. `.env.local` — BETTER_AUTH_SECRET 등 (없으면 `openssl rand -base64 32`로 새로 만들어도 됨.
   단, 새로 만들면 기존 세션 쿠키 무효 — 가입 전이라 무해)
2. `koinlab.db` — 가입 전이면 생략 가능 (스키마는 `pnpm drizzle-kit push`로 재생성)

## 반드시 아는 함정 (이 세션에서 실제로 밟은 것)

1. **dev 서버 켜둔 채 `pnpm build` 금지** — `.next` 캐시 깨져 하이드레이션 사망. 복구: 서버 중지 → `rm -rf .next`
2. **MarketSimulator는 sim-clock** (틱당 1캔들). 벽시계로 돌리면 지표가 안 움직여 봇이 거래 안 함
3. **서브에이전트(팀원)에게 git 명령 금지** 명시할 것 — 과거 `git checkout`으로 미커밋 작업 날린 사고 있음
4. eslint-plugin-react-hooks는 **v5 고정** (eslint-config-next@15와 정합). pnpm이라 next의 eslint 플러그인들 직접 설치돼 있음
5. 봇 P&L: 봇이 직접 사지 않은 포지션 매도 시 원가는 avgBuyPrice×qty 폴백 (0 아님)

## 현재 git 상태 (이 문서 작성 시점)

- 마지막 커밋: `cb9c1aa` feat: 인증(운영자 1인) + DB 영속화 + 24시간 무인 매매 서버 엔진
- **미커밋 변경 ~7파일**: 로그인 옵션화(미들웨어 축소, 인트로 CTA→대시보드, localStorage 폴백,
  설정 로그인/로그아웃 분기) + `trade:24h` 스크립트 + README/HANDOFF — 푸시 전 커밋 필요

## 명령어

```bash
pnpm dev          # 개발
pnpm trade:24h    # 24시간 운영 (빌드+Cloudflare 터널+caffeinate+start)
pnpm tunnel       # 터널만 따로 (외부 접속용 임시 URL)
pnpm lint / typecheck / format
```

- 외부 접속: quick tunnel(무료, 계정 불필요) — **재시작마다 URL 바뀜**, 현재 주소는 `cat .tunnel/url.txt`
- 영구 주소 원하면: Cloudflare 계정+도메인 필요 (named tunnel) — 아직 안 함
