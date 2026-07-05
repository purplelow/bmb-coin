# KoinLab — 코인 자동매매 (Test Mode)

**BMB-LAB**의 코인 자동매매 모바일 웹앱 (형제 제품: QuantLab — 주식 자동매매).
지표 기반 자동매매를 제공하며, 현재는 **테스트 모드(모의거래)** 로 동작합니다 — 실제 자금 없이
시뮬레이션된 업비트 KRW 마켓에서 페이퍼 트레이딩을 합니다.

> ⚠️ **TEST MODE** — 모든 시세/체결/잔고는 시뮬레이션입니다. 실제 거래소 주문은 발생하지 않습니다.

## 기술 스택

| 영역 | 선택 | 비고 |
| --- | --- | --- |
| 프레임워크 | **Next.js 15 (App Router)** + React 19 | 서버/클라이언트 컴포넌트 |
| 언어 | **TypeScript** (strict, `noUncheckedIndexedAccess`) | |
| 상태관리 | **Zustand 5** | 슬라이스별 스토어 + persist |
| 스타일 | **Emotion 11** | SSR 레지스트리 + 디자인 토큰 테마 |
| 패키지 매니저 | **pnpm** | |

## 실행

```bash
pnpm install
pnpm dev           # http://localhost:3000
pnpm build         # 프로덕션 빌드
pnpm typecheck     # tsc --noEmit
pnpm lint          # ESLint 검사 (import 순서·미사용 import 포함)
pnpm lint:fix      # ESLint 자동 수정
pnpm format        # Prettier 포맷팅
pnpm format:check  # 포맷 검사만 (CI용)
```

`.env.example` 를 `.env.local` 로 복사해 사용합니다. 기본값은 테스트 모드입니다.

```bash
NEXT_PUBLIC_TRADING_MODE=test   # test | live (런타임 토글은 설정 화면에서)
NEXT_PUBLIC_EXCHANGE=upbit
```

## 실거래(LIVE) 모드 — 소액 자동매매

> ⚠️ 실제 자금이 사용됩니다. 정말 작게 시작하세요. 본 앱은 투자 자문을 제공하지 않습니다.

1. 업비트 [Open API 관리](https://upbit.com/mypage/open_api_management)에서 **자산조회 + 주문** 권한으로 키 발급 (가능하면 IP 화이트리스트 설정).
2. `.env.local` 에 키 입력 후 서버 재시작:
   ```bash
   UPBIT_ACCESS_KEY=...
   UPBIT_SECRET_KEY=...
   UPBIT_MAX_ORDER_KRW=20000   # 1회 주문 하드캡
   UPBIT_DAILY_CAP_KRW=50000   # 1일 누적 매수 하드캡
   ```
3. 앱 **설정** 화면에서 실거래(LIVE) 토글 ON → 확인창 → 시작.

**보안 구조:** 시크릿 키는 **서버 전용**(`NEXT_PUBLIC_` 미사용)이라 브라우저 번들에 절대 포함되지 않습니다.
브라우저는 우리 서버의 `/api/upbit/*` 라우트만 호출하고, 서버가 JWT로 서명해 업비트와 통신합니다
(`src/server/upbit/*`).

**안전장치(서버 강제):** 1회/1일 하드캡 · 실거래 주문 확인창 · 킬스위치(모든 봇 정지+안전모드) ·
봇 자동매수 기본 OFF(매도 신호만 실행, 자본 보호). 봇 매수 금액은 소액 프리셋(₩5k/10k/20k)으로 제한됩니다.

## 회원가입 / 인증

**better-auth + Drizzle + SQLite**(`koinlab.db`, gitignore) 기반. 현재는 **운영자 1인 전용** —
`MAX_USERS`(기본 1)를 초과하는 가입은 서버에서 거부됩니다.

- 이메일+비밀번호 로그인 기본. 카카오/구글은 `.env.local` 에 OAuth 키를 넣으면 자동 활성화.
- 앱 페이지는 미들웨어가, **자산/주문/상태 API는 세션 검증**(`requireSession`)이 보호합니다.
- 봇/설정은 localStorage가 아닌 **DB(user_data)** 에 세션 스코프로 저장됩니다 (기존 localStorage
  데이터는 최초 1회 자동 이전).
- 다인용 확장 시: `MAX_USERS` 상향 + 유저별 업비트 키 암호화 저장 설계가 선행돼야 합니다(현재 키는
  서버 env 1쌍 = 운영자 계정 전용).

## 폴더 구조 (feature-based)

```
src/
  app/                 # 라우팅만 담당 (얇게 유지)
    page.tsx           #   "/"          온보딩 (풀스크린)
    (main)/            #   하단 탭 셸 그룹
      layout.tsx       #     앱 셸 + BottomNav + 테스트 배너
      dashboard/       #     /dashboard  대시보드
      market/          #     /market     마켓 목록 + /market/[code] 상세·매매
      bots/            #     /bots        자동매매 봇
      portfolio/       #     /portfolio   내 자산
  features/            # 도메인 단위 모듈 (UI + 로직)
    onboarding/  dashboard/  market/  portfolio/
    trading/           #   strategies/ · engine/ · components/
  shared/
    ui/                # 디자인 시스템 (GlassCard, BottomNav, Sparkline …)
    styles/            # theme(토큰) · Emotion SSR 레지스트리 · 글로벌
    lib/               # indicators(SMA/EMA/RSI) · format · id
    config/            # 환경설정 · 시드 마켓 데이터
  services/
    exchange/          # ExchangeAdapter 인터페이스
      mock/            #   테스트 모드용 시뮬레이션 어댑터
      upbit/           #   실거래 어댑터 (스텁 — 추후 구현)
    simulation/        # 캔들/시세 시뮬레이터 (페이퍼 트레이딩)
  stores/              # Zustand: market · portfolio · bot · ui + AppBootstrap
  types/               # 도메인 모델 (업비트 스타일)
```

### 핵심 설계: 어댑터 패턴

앱의 모든 레이어(스토어·매매엔진)는 **`ExchangeAdapter` 인터페이스에만** 의존합니다
([src/services/exchange/types.ts](src/services/exchange/types.ts)).

- `MockExchangeAdapter` — 테스트 모드. 시뮬레이터 + 메모리상 페이퍼 계좌.
- `UpbitExchangeAdapter` — 실거래용 스텁. 동일 인터페이스를 구현하므로, 실제 연동 시
  `getExchangeAdapter()` 한 곳만 바뀝니다.

### 자동매매 흐름 (테스트 모드)

```
MarketSimulator ──tick──▶ ExchangeAdapter ──ticker──▶ TradingEngine
                                                          │ 캔들 평가 (지표 전략)
                                                          ▼
                                          매수/매도 페이퍼 주문 → 포트폴리오 갱신
                                                          ▼
                                              signal/order → Zustand 스토어 → UI
```

전략은 `src/features/trading/strategies` 에 플러그인처럼 정의됩니다.

- **이동평균 교차 (MA Cross)** — 골든/데드 크로스
- **RSI** — 과매도 매수 / 과매수 매도

## 개발 방식: Opus 팀장 + Sonnet 팀원

이 프로젝트는 Claude Code 멀티에이전트로 구축되었습니다.

- **Opus(팀장)** — 아키텍처/공유 계약(디자인 토큰·도메인 타입·어댑터 인터페이스·스토어 스펙)
  정의, 통합·검증 담당.
- **Sonnet(팀원)** — 계약에 맞춰 서로 겹치지 않는 파일 슬라이스(디자인 시스템 / 도메인 코어 /
  상태관리 / 화면)를 병렬 구현.

별도 설정 파일은 필요 없습니다. (원한다면 역할별 영구 서브에이전트를 `.claude/agents/` 에
정의해 재사용할 수 있습니다.)

## 24시간 무인 매매 (서버 엔진)

실거래(LIVE) 모드의 봇은 **브라우저가 아니라 Next 서버 프로세스 안에서** 실행됩니다
(`src/server/engine/runner.ts`, `src/instrumentation.ts`에서 부팅 시 자동 기동).
20초마다 DB의 봇/설정을 읽어 손절/익절 → 전략 신호 순으로 평가하고 서버에서 직접 주문합니다.
클라이언트 엔진은 테스트(모의) 모드 전용이라 이중 체결이 없습니다. 하트비트는 설정 화면의
"서버 엔진" 카드(/api/engine/status)에서 확인. **서버 프로세스(컴퓨터)는 켜져 있어야 합니다.**

24시간 운영은 dev가 아닌 프로덕션 서버로:

```bash
pnpm trade:24h   # 프로덕션 빌드 → 맥 잠자기 방지(caffeinate) → next start
```

(터미널을 닫으면 종료됩니다. 상시 운영이 길어지면 클라우드/미니서버 배포가 다음 단계.)

## 로드맵

- [x] 실거래용 `UpbitExchangeAdapter` (서버 라우트 + JWT) · 소액 하드캡 · 킬스위치
- [x] 실거래 WebSocket 실시간 시세 (자동 재연결, 실패 시 폴링 폴백)
- [x] 봇 손절/익절 (평균단가 대비 %, 전략 신호와 무관하게 즉시 시장가 매도)
- [x] 회원가입/로그인 (better-auth, 운영자 1인) · 봇/설정 DB 영속화 · API 세션 보호
- [x] 24시간 무인 매매 서버 엔진
- [ ] 백테스트 모드 / 전략 성과 리포트
- [ ] 추가 전략 (볼린저밴드, 그리드, DCA)
- [ ] 알림(가격/체결) · 클라우드 상시 배포
