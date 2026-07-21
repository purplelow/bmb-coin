#!/usr/bin/env bash
# KoinLab 24시간 운영: 빌드 → Cloudflare 임시 터널 → caffeinate + prod 서버.
#
# 터널은 quick tunnel(계정/도메인 불필요) — 주소가 재시작마다 바뀐다.
# 현재 주소는 시작 로그와 .tunnel/url.txt 에서 확인.
# cloudflared가 없으면 터널 없이 로컬 전용으로 시작한다 (brew install cloudflared).
set -euo pipefail

cd "$(dirname "$0")/.."

PORT="${PORT:-3000}"
TUNNEL_DIR=".tunnel"
TUNNEL_LOG="$TUNNEL_DIR/cloudflared.log"

pnpm build

TUNNEL_PID=""
cleanup() {
  if [ -n "$TUNNEL_PID" ]; then
    kill "$TUNNEL_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

if command -v cloudflared >/dev/null 2>&1; then
  mkdir -p "$TUNNEL_DIR"
  : > "$TUNNEL_LOG"
  cloudflared tunnel --url "http://localhost:$PORT" --logfile "$TUNNEL_LOG" >/dev/null 2>&1 &
  TUNNEL_PID=$!

  URL=""
  for _ in $(seq 1 30); do
    URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' "$TUNNEL_LOG" 2>/dev/null | head -1 || true)
    [ -n "$URL" ] && break
    sleep 1
  done

  if [ -n "$URL" ]; then
    printf '%s\n' "$URL" > "$TUNNEL_DIR/url.txt"
    echo ""
    echo "════════════════════════════════════════════════════════"
    echo "  KoinLab 외부 접속 주소:"
    echo "  $URL"
    echo ""
    echo "  (재시작하면 주소가 바뀝니다 — cat .tunnel/url.txt)"
    echo "════════════════════════════════════════════════════════"
    echo ""
  else
    echo "⚠ 터널 주소를 얻지 못했습니다 — $TUNNEL_LOG 확인. 로컬 전용으로 계속합니다."
  fi
else
  echo "⚠ cloudflared 미설치 — 터널 없이 로컬 전용으로 시작합니다 (brew install cloudflared)."
fi

caffeinate -is pnpm start
