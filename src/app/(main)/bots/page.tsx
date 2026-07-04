'use client';

import React, { useState, useCallback } from 'react';
import styled from '@emotion/styled';
import { CreateBotForm } from '@/features/trading/components/CreateBotForm';
import { STRATEGY_DEFS } from '@/features/trading/strategies';
import { formatKRW, formatPrice, formatTime } from '@/shared/lib/format';
import {
  AppHeader,
  Screen,
  GlassCard,
  Badge,
  ValueChange,
  IconButton,
  Icon,
  Button,
  CoinIcon,
  SectionHeader,
  ListRow,
  EmptyState,
  Sheet,
} from '@/shared/ui';
import { useBotStore } from '@/stores/botStore';
import type { Bot, BotStatus, SignalEvent } from '@/types/domain';

// ── Styled ─────────────────────────────────────────────────────────

const PageRoot = styled(Screen)`
  padding-top: 0;
`;

const BotList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(4)};
  margin-bottom: ${({ theme }) => theme.space(6)};
`;

const BotCardInner = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(3)};
`;

const BotCardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(3)};
`;

const BotInfo = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(1)};
`;

const BotName = styled.span`
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.color.text.high};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const BotMeta = styled.span`
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.color.text.low};
`;

const BotControls = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(1)};
  flex-shrink: 0;
`;

const StatRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(4)};
  padding-top: ${({ theme }) => theme.space(2)};
  border-top: 1px solid ${({ theme }) => theme.color.glass.border};
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const StatLabel = styled.span`
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.color.text.low};
`;

const StatValue = styled.span`
  font-family: ${({ theme }) => theme.font.mono};
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  color: ${({ theme }) => theme.color.text.high};
`;

const SignalSection = styled.div`
  margin-top: ${({ theme }) => theme.space(2)};
`;

const SignalList = styled.div`
  background: ${({ theme }) => theme.color.glass.surface};
  border: 1px solid ${({ theme }) => theme.color.glass.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  overflow: hidden;
`;

const SignalRight = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
`;

const SignalTime = styled.span`
  font-family: ${({ theme }) => theme.font.mono};
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.color.text.low};
`;

const SignalReason = styled.span`
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.color.text.mid};
  max-width: 160px;
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Spacer = styled.div<{ h: number }>`
  height: ${({ h, theme }) => theme.space(h)};
`;

const RiskBadgeRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space(1)};
  margin-top: 2px;
`;

// ── Status helpers ─────────────────────────────────────────────────

type StatusTone = 'up' | 'warning' | 'neutral';

function getStatusTone(status: BotStatus): StatusTone {
  if (status === 'running') return 'up';
  if (status === 'paused') return 'warning';
  return 'neutral';
}

function getStatusLabel(status: BotStatus): string {
  if (status === 'running') return '실행중';
  if (status === 'paused') return '일시정지';
  return '정지';
}

// ── BotCard ────────────────────────────────────────────────────────

interface BotCardProps {
  bot: Bot;
  onToggle: (id: string, status: BotStatus) => void;
  onDelete: (id: string) => void;
}

function BotCard({ bot, onToggle, onDelete }: BotCardProps) {
  const stratDef = STRATEGY_DEFS[bot.strategy.type];

  const handleToggle = useCallback(() => {
    const next: BotStatus = bot.status === 'running' ? 'paused' : 'running';
    onToggle(bot.id, next);
  }, [bot.id, bot.status, onToggle]);

  const handleDelete = useCallback(() => {
    onDelete(bot.id);
  }, [bot.id, onDelete]);

  const isRunning = bot.status === 'running';

  return (
    <GlassCard padding={4}>
      <BotCardInner>
        <BotCardHeader>
          <CoinIcon symbol={bot.market} size={40} />
          <BotInfo>
            <BotName>{bot.name}</BotName>
            <BotMeta>
              {bot.market} · {stratDef.label}
            </BotMeta>
            {bot.risk !== undefined && (
              <RiskBadgeRow>
                {bot.risk.stopLossPct !== null && (
                  <Badge tone="down">손절 -{bot.risk.stopLossPct}%</Badge>
                )}
                {bot.risk.takeProfitPct !== null && (
                  <Badge tone="up">익절 +{bot.risk.takeProfitPct}%</Badge>
                )}
              </RiskBadgeRow>
            )}
          </BotInfo>
          <Badge tone={getStatusTone(bot.status)}>{getStatusLabel(bot.status)}</Badge>
          <BotControls>
            <IconButton
              label={isRunning ? '일시정지' : '실행'}
              onClick={handleToggle}
              variant="ghost"
              size={36}
            >
              <Icon name={isRunning ? 'pause' : 'play'} size={16} />
            </IconButton>
            <IconButton label="삭제" onClick={handleDelete} variant="ghost" size={36}>
              <Icon name="trash" size={16} />
            </IconButton>
          </BotControls>
        </BotCardHeader>
        <StatRow>
          <StatItem>
            <StatLabel>수익률</StatLabel>
            <ValueChange rate={bot.stats.returnRate} size="sm" />
          </StatItem>
          <StatItem>
            <StatLabel>거래</StatLabel>
            <StatValue>{bot.stats.trades}회</StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>실현손익</StatLabel>
            <StatValue>{formatKRW(bot.stats.realizedPnl, { compact: true })}</StatValue>
          </StatItem>
        </StatRow>
      </BotCardInner>
    </GlassCard>
  );
}

// ── SignalRow ──────────────────────────────────────────────────────

interface SignalRowProps {
  event: SignalEvent;
}

function SignalRow({ event }: SignalRowProps) {
  const isBuy = event.signal === 'buy';

  return (
    <ListRow
      left={<Badge tone={isBuy ? 'up' : 'down'}>{isBuy ? '매수' : '매도'}</Badge>}
      title={event.market}
      subtitle={event.reason}
      right={
        <SignalRight>
          <SignalTime>{formatTime(event.timestamp)}</SignalTime>
          <SignalReason>{formatPrice(event.price)}</SignalReason>
        </SignalRight>
      }
    />
  );
}

// ── Page ───────────────────────────────────────────────────────────

export default function BotsPage() {
  const [sheetOpen, setSheetOpen] = useState(false);

  const bots = useBotStore((s) => s.bots);
  const signals = useBotStore((s) => s.signals);
  const setStatus = useBotStore((s) => s.setStatus);
  const removeBot = useBotStore((s) => s.removeBot);

  const openSheet = useCallback(() => setSheetOpen(true), []);
  const closeSheet = useCallback(() => setSheetOpen(false), []);

  const handleToggle = useCallback(
    (id: string, status: BotStatus) => {
      setStatus(id, status);
    },
    [setStatus],
  );

  const handleDelete = useCallback(
    (id: string) => {
      removeBot(id);
    },
    [removeBot],
  );

  // Only show non-hold signals (buy/sell) in the log
  const visibleSignals = signals.filter((s) => s.signal !== 'hold');

  return (
    <>
      <AppHeader
        title="자동매매 봇"
        right={
          <IconButton label="봇 추가" onClick={openSheet} variant="ghost" size={40}>
            <Icon name="plus" size={20} />
          </IconButton>
        }
      />

      <PageRoot>
        {bots.length === 0 ? (
          <EmptyState
            title="등록된 봇이 없습니다"
            description="자동매매 봇을 만들어 24시간 자동으로 거래해 보세요."
            icon={<Icon name="bot" size={40} />}
            action={
              <Button variant="primary" size="md" onClick={openSheet}>
                봇 만들기
              </Button>
            }
          />
        ) : (
          <>
            <BotList>
              {bots.map((bot) => (
                <BotCard key={bot.id} bot={bot} onToggle={handleToggle} onDelete={handleDelete} />
              ))}
            </BotList>

            {visibleSignals.length > 0 && (
              <SignalSection>
                <SectionHeader title="신호 로그" />
                <SignalList>
                  {visibleSignals.map((event) => (
                    <SignalRow key={event.id} event={event} />
                  ))}
                </SignalList>
              </SignalSection>
            )}

            <Spacer h={4} />
          </>
        )}
      </PageRoot>

      <Sheet open={sheetOpen} onClose={closeSheet} title="새 봇 만들기">
        <CreateBotForm onClose={closeSheet} />
      </Sheet>
    </>
  );
}
