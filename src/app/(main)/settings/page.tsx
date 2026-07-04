'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styled from '@emotion/styled';
import { signOut, useSession } from '@/shared/lib/auth-client';
import { formatKRW } from '@/shared/lib/format';
import {
  Screen,
  AppHeader,
  GlassCard,
  SectionHeader,
  SegmentedControl,
  Switch,
  Button,
  Badge,
  Icon,
  IconButton,
  Sheet,
} from '@/shared/ui';
import { useBotStore } from '@/stores/botStore';
import { useSettingsStore, ORDER_PRESETS } from '@/stores/settingsStore';
import { useUiStore } from '@/stores/uiStore';

interface LiveStatus {
  configured: boolean;
  maxOrderKRW: number;
  dailyCapKRW: number;
  dailySpent: number;
  dailyRemaining: number;
}

interface EngineStatus {
  running: boolean;
  lastTickAt: number | null;
  lastError: string | null;
  mode: 'idle' | 'live';
  activeBots: number;
  ordersPlaced: number;
}

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(6)};
  padding-bottom: ${({ theme }) => theme.space(6)};
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space(4)};
`;

const RowText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const RowTitle = styled.span`
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.color.text.high};
`;

const RowDesc = styled.span`
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.color.text.low};
  line-height: 1.45;
`;

const KeyValue = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.color.text.mid};
  padding: ${({ theme }) => theme.space(1)} 0;
`;

const KeyValueStrong = styled.span`
  font-family: ${({ theme }) => theme.font.mono};
  color: ${({ theme }) => theme.color.text.high};
`;

const Guide = styled.div`
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.color.text.mid};
  line-height: 1.6;

  code {
    font-family: ${({ theme }) => theme.font.mono};
    background: ${({ theme }) => theme.color.glass.surface};
    border: 1px solid ${({ theme }) => theme.color.glass.border};
    border-radius: 6px;
    padding: 1px 5px;
    color: ${({ theme }) => theme.color.accent.primary};
  }
`;

const WarnBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(3)};
  padding: ${({ theme }) => theme.space(4)};
  background: ${({ theme }) => theme.color.market.downSoft};
  border: 1px solid ${({ theme }) => theme.color.market.down}55;
  border-radius: ${({ theme }) => theme.radius.md};
`;

const WarnTitle = styled.span`
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  color: ${({ theme }) => theme.color.market.down};
`;

const WarnText = styled.span`
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.color.text.mid};
  line-height: 1.6;
`;

export default function SettingsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const tradingMode = useSettingsStore((s) => s.tradingMode);
  const orderPreset = useSettingsStore((s) => s.orderPreset);
  const liveAutoBuy = useSettingsStore((s) => s.liveAutoBuy);
  const setTradingMode = useSettingsStore((s) => s.setTradingMode);
  const setOrderPreset = useSettingsStore((s) => s.setOrderPreset);
  const setLiveAutoBuy = useSettingsStore((s) => s.setLiveAutoBuy);

  const bots = useBotStore((s) => s.bots);

  const [status, setStatus] = useState<LiveStatus | null>(null);
  const [engine, setEngine] = useState<EngineStatus | null>(null);
  const [now, setNow] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isLive = tradingMode === 'live';

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/upbit/status');
      if (res.ok) setStatus((await res.json()) as LiveStatus);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus, tradingMode]);

  // 24/7 server-engine heartbeat (poll while this screen is open).
  useEffect(() => {
    let stopped = false;
    const poll = async () => {
      try {
        const res = await fetch('/api/engine/status');
        if (!stopped && res.ok) {
          setEngine((await res.json()) as EngineStatus);
          setNow(Date.now());
        }
      } catch {
        /* ignore */
      }
    };
    void poll();
    const t = setInterval(poll, 5000);
    return () => {
      stopped = true;
      clearInterval(t);
    };
  }, []);

  const requestLive = () => {
    if (!status?.configured) {
      useUiStore.getState().showToast('먼저 .env.local 에 Upbit API 키를 설정하세요.', 'danger');
      return;
    }
    setConfirmOpen(true);
  };

  const confirmLive = () => {
    setTradingMode('live');
    setConfirmOpen(false);
    useUiStore.getState().showToast('실거래(LIVE) 모드로 전환되었습니다.', 'info');
  };

  const handleModeToggle = (next: boolean) => {
    if (next) requestLive();
    else {
      setTradingMode('test');
      useUiStore.getState().showToast('모의거래(TEST) 모드로 전환되었습니다.', 'success');
    }
  };

  const killSwitch = () => {
    bots.forEach((b) => useBotStore.getState().setStatus(b.id, 'stopped'));
    setTradingMode('test');
    useUiStore.getState().showToast('긴급 정지: 모든 봇 정지 + 모의거래 전환', 'danger');
  };

  const runningBots = bots.filter((b) => b.status === 'running').length;

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/login';
  };

  return (
    <>
      <AppHeader
        title="설정"
        left={
          <IconButton label="뒤로" onClick={() => router.back()} variant="ghost">
            <Icon name="back" size={20} />
          </IconButton>
        }
      />

      <Screen>
        <Stack>
          {/* Trading mode */}
          <div>
            <SectionHeader title="거래 모드" />
            <GlassCard padding={4} glow={isLive ? 'none' : 'none'}>
              <Row>
                <RowText>
                  <RowTitle>
                    실거래(LIVE) 모드{' '}
                    <Badge tone={isLive ? 'down' : 'up'}>{isLive ? 'ON' : 'OFF'}</Badge>
                  </RowTitle>
                  <RowDesc>
                    {isLive
                      ? '실제 자금으로 업비트에 주문합니다.'
                      : '모의 데이터로 안전하게 연습합니다.'}
                  </RowDesc>
                </RowText>
                <Switch checked={isLive} onChange={handleModeToggle} />
              </Row>
            </GlassCard>
          </div>

          {/* Upbit connection status */}
          <div>
            <SectionHeader title="업비트 연결" />
            <GlassCard padding={4}>
              <KeyValue>
                <span>API 키</span>
                <Badge tone={status?.configured ? 'up' : 'neutral'}>
                  {status?.configured ? '설정됨' : '미설정'}
                </Badge>
              </KeyValue>
              {status && (
                <>
                  <KeyValue>
                    <span>1회 주문 한도</span>
                    <KeyValueStrong>{formatKRW(status.maxOrderKRW)}</KeyValueStrong>
                  </KeyValue>
                  <KeyValue>
                    <span>오늘 남은 매수 한도</span>
                    <KeyValueStrong>
                      {formatKRW(status.dailyRemaining)} / {formatKRW(status.dailyCapKRW)}
                    </KeyValueStrong>
                  </KeyValue>
                </>
              )}
              {!status?.configured && (
                <Guide style={{ marginTop: 12 }}>
                  업비트{' '}
                  <a
                    href="https://upbit.com/mypage/open_api_management"
                    target="_blank"
                    rel="noreferrer"
                    style={{ textDecoration: 'underline' }}
                  >
                    Open API 관리
                  </a>
                  에서 <b>자산조회·주문</b> 권한으로 키를 발급한 뒤, 프로젝트 루트{' '}
                  <code>.env.local</code> 에 <code>UPBIT_ACCESS_KEY</code> /{' '}
                  <code>UPBIT_SECRET_KEY</code> 를 직접 입력하고 서버를 재시작하세요. (키는 서버에만
                  저장되며 브라우저로 전송되지 않습니다.)
                </Guide>
              )}
            </GlassCard>
          </div>

          {/* Order amount preset */}
          <div>
            <SectionHeader title="소액 주문 금액" />
            <GlassCard padding={4}>
              <RowDesc style={{ marginBottom: 12 }}>
                실거래 1회 주문 금액입니다. 봇 자동매수도 이 금액으로 제한됩니다.
              </RowDesc>
              <SegmentedControl
                fullWidth
                value={String(orderPreset)}
                onChange={(v) => setOrderPreset(Number(v))}
                options={ORDER_PRESETS.map((p) => ({
                  label: formatKRW(p),
                  value: String(p),
                }))}
              />
            </GlassCard>
          </div>

          {/* 24/7 server engine */}
          <div>
            <SectionHeader title="서버 엔진 (24시간 무인)" />
            <GlassCard padding={4}>
              <KeyValue>
                <span>상태</span>
                <Badge tone={engine?.mode === 'live' ? 'up' : 'neutral'}>
                  {engine === null ? '확인 중' : engine.mode === 'live' ? '무인 매매 중' : '대기'}
                </Badge>
              </KeyValue>
              <KeyValue>
                <span>마지막 체크</span>
                <KeyValueStrong>
                  {engine?.lastTickAt
                    ? `${Math.max(0, Math.round((now - engine.lastTickAt) / 1000))}초 전`
                    : '-'}
                </KeyValueStrong>
              </KeyValue>
              <KeyValue>
                <span>실행 봇 / 누적 주문</span>
                <KeyValueStrong>
                  {engine?.activeBots ?? 0}개 / {engine?.ordersPlaced ?? 0}건
                </KeyValueStrong>
              </KeyValue>
              {engine?.lastError && (
                <RowDesc style={{ marginTop: 8 }}>최근 오류: {engine.lastError}</RowDesc>
              )}
              <RowDesc style={{ marginTop: 8 }}>
                실거래(LIVE) 모드에서는 브라우저를 꺼도 <b>서버가 봇을 계속 실행</b>합니다. 이
                컴퓨터(서버)의 전원과 dev/서버 프로세스는 켜져 있어야 합니다.
              </RowDesc>
            </GlassCard>
          </div>

          {/* Live safety */}
          <div>
            <SectionHeader title="안전장치" />
            <GlassCard padding={4}>
              <Row>
                <RowText>
                  <RowTitle>봇 자동매수 허용</RowTitle>
                  <RowDesc>
                    OFF면 실거래 봇은 <b>매도(손절/익절) 신호만</b> 실행합니다. 신규 진입(매수)은
                    하지 않아 자본을 보호합니다.
                  </RowDesc>
                </RowText>
                <Switch checked={liveAutoBuy} onChange={setLiveAutoBuy} />
              </Row>
            </GlassCard>
          </div>

          {/* Account */}
          <div>
            <SectionHeader title="계정" />
            <GlassCard padding={4}>
              <Row>
                <RowText>
                  <RowTitle>로그인 계정</RowTitle>
                  <RowDesc>{session?.user.email ?? '-'}</RowDesc>
                </RowText>
                <Button variant="secondary" size="sm" onClick={() => void handleLogout()}>
                  로그아웃
                </Button>
              </Row>
            </GlassCard>
          </div>

          {/* Kill switch */}
          <div>
            <SectionHeader title="긴급 정지" />
            <WarnBox>
              <WarnTitle>킬스위치</WarnTitle>
              <WarnText>
                실행 중인 봇 {runningBots}개를 즉시 정지하고 모의거래(TEST) 모드로 되돌립니다.
                시장이 급변할 때 사용하세요.
              </WarnText>
              <Button variant="danger" size="lg" fullWidth onClick={killSwitch}>
                모든 봇 정지 + 안전 모드
              </Button>
            </WarnBox>
          </div>
        </Stack>
      </Screen>

      {/* Live confirmation */}
      <Sheet open={confirmOpen} onClose={() => setConfirmOpen(false)} title="실거래 전환 확인">
        <WarnBox style={{ marginBottom: 16 }}>
          <WarnTitle>실제 돈이 사용됩니다</WarnTitle>
          <WarnText>
            지금부터 매수/매도는 업비트 계정의 실제 자금으로 체결됩니다. 1회 최대{' '}
            {formatKRW(status?.maxOrderKRW ?? 20000)}, 하루 최대{' '}
            {formatKRW(status?.dailyCapKRW ?? 50000)}로 제한되지만, 손실이 발생할 수 있습니다. 정말
            전환할까요?
          </WarnText>
        </WarnBox>
        <Button variant="danger" size="lg" fullWidth onClick={confirmLive}>
          이해했습니다. 실거래 시작
        </Button>
      </Sheet>
    </>
  );
}
