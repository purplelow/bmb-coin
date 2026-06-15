/**
 * UpbitTickerSocket — Upbit WebSocket 실시간 시세 스트림.
 *
 * 연결 실패 시 지수 백오프(1s→2s→4s→8s→16s)로 재연결하고,
 * 5회 연속 실패 후 onFatal 콜백을 호출하여 폴링 폴백을 유도합니다.
 * Upbit 아이들 종료(~120s)를 방지하기 위해 50초마다 PING을 전송합니다.
 */

import type { Ticker } from '@/types/domain';

const WS_URL = 'wss://api.upbit.com/websocket/v1';
const MAX_RETRIES = 5;
const PING_INTERVAL_MS = 50_000;
const BACKOFF_CAP_MS = 16_000;

interface UpbitTickerMsg {
  type: string;
  code: string;
  trade_price: number;
  prev_closing_price: number;
  change: 'RISE' | 'FALL' | 'EVEN';
  change_price: number;
  change_rate: number;
  signed_change_rate: number;
  high_price: number;
  low_price: number;
  acc_trade_price_24h: number;
  acc_trade_volume_24h: number;
  timestamp: number;
}

export class UpbitTickerSocket {
  private readonly markets: string[];
  private readonly onTicker: (t: Ticker) => void;
  private readonly onFatal?: () => void;

  private socket: WebSocket | null = null;
  private closed = false;
  private retryCount = 0;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  constructor(markets: string[], onTicker: (t: Ticker) => void, onFatal?: () => void) {
    this.markets = markets;
    this.onTicker = onTicker;
    this.onFatal = onFatal;
  }

  connect(): void {
    if (this.closed) return;

    const ws = new WebSocket(WS_URL);
    ws.binaryType = 'arraybuffer';
    this.socket = ws;

    ws.onopen = () => {
      if (this.closed) {
        ws.close();
        return;
      }
      // 연결 성공 — 재시도 카운터 초기화
      this.retryCount = 0;

      const ticket = 'koinlab-' + Math.random().toString(36).slice(2, 9);
      ws.send(
        JSON.stringify([
          { ticket },
          { type: 'ticker', codes: this.markets },
          { format: 'DEFAULT' },
        ]),
      );

      // PING 하트비트 시작
      this.startPing(ws);
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const raw = event.data as ArrayBuffer;
        const text = new TextDecoder().decode(raw);
        const msg = JSON.parse(text) as Partial<UpbitTickerMsg>;

        // trade_price 필드가 없으면 시세 프레임이 아님 (상태 메시지 등) — 무시
        if (msg.trade_price === undefined) return;

        const ticker: Ticker = {
          market: msg.code ?? '',
          tradePrice: msg.trade_price,
          prevClosingPrice: msg.prev_closing_price ?? 0,
          change: msg.change ?? 'EVEN',
          changePrice: msg.change_price ?? 0,
          changeRate: msg.change_rate ?? 0,
          signedChangeRate: msg.signed_change_rate ?? 0,
          highPrice: msg.high_price ?? 0,
          lowPrice: msg.low_price ?? 0,
          accTradePrice24h: msg.acc_trade_price_24h ?? 0,
          accTradeVolume24h: msg.acc_trade_volume_24h ?? 0,
          timestamp: msg.timestamp ?? Date.now(),
        };

        this.onTicker(ticker);
      } catch {
        // 파싱 오류 — 해당 메시지 무시
      }
    };

    ws.onclose = () => {
      this.stopPing();
      if (!this.closed) {
        this.scheduleReconnect();
      }
    };

    ws.onerror = () => {
      this.stopPing();
      // onerror 직후 onclose가 항상 발생하므로 재연결은 onclose에서 처리
    };
  }

  close(): void {
    this.closed = true;
    this.stopPing();
    if (this.retryTimer !== null) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    if (this.socket !== null) {
      this.socket.onclose = null;
      this.socket.onerror = null;
      this.socket.close();
      this.socket = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.closed) return;

    this.retryCount += 1;
    if (this.retryCount > MAX_RETRIES) {
      this.onFatal?.();
      return;
    }

    const delayMs = Math.min(Math.pow(2, this.retryCount - 1) * 1000, BACKOFF_CAP_MS);

    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      if (!this.closed) {
        this.connect();
      }
    }, delayMs);
  }

  private startPing(ws: WebSocket): void {
    this.stopPing();
    this.pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send('PING');
      }
    }, PING_INTERVAL_MS);
  }

  private stopPing(): void {
    if (this.pingInterval !== null) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
}
