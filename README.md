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
pnpm dev        # http://localhost:3000
pnpm build      # 프로덕션 빌드
pnpm typecheck  # tsc --noEmit
```

`.env.example` 를 `.env.local` 로 복사해 사용합니다. 기본값은 테스트 모드입니다.

```bash
NEXT_PUBLIC_TRADING_MODE=test   # test | live
NEXT_PUBLIC_EXCHANGE=upbit
```

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

## 로드맵

- [ ] 실거래용 `UpbitExchangeAdapter` 구현 (REST + WebSocket + JWT)
- [ ] 백테스트 모드 / 전략 성과 리포트
- [ ] 추가 전략 (볼린저밴드, 그리드, DCA)
- [ ] 알림(가격/체결) · PWA 설치
