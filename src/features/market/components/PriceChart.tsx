'use client';

import React, { useId } from 'react';
import styled from '@emotion/styled';
import { formatPrice } from '@/shared/lib/format';
import type { Candle } from '@/types/domain';

interface PriceChartProps {
  candles: Candle[];
  width?: number;
  height?: number;
}

const ChartRoot = styled.div`
  width: 100%;
  position: relative;
`;

const Svg = styled.svg`
  width: 100%;
  display: block;
`;

const AxisLabel = styled.text`
  font-family: ${({ theme }) => theme.font.mono};
  font-size: 10px;
  fill: ${({ theme }) => theme.color.text.low};
`;

function buildLinePath(
  closes: number[],
  minV: number,
  maxV: number,
  w: number,
  h: number,
  padTop: number,
  padBottom: number,
): string {
  if (closes.length < 2) return '';
  const range = maxV - minV || 1;
  const points = closes.map((v, i) => {
    const x = (i / (closes.length - 1)) * w;
    const y = padTop + ((maxV - v) / range) * (h - padTop - padBottom);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });
  return 'M' + points.join('L');
}

export function PriceChart({ candles, width = 400, height = 200 }: PriceChartProps) {
  const id = useId();
  const gradUpId = `chart-up-${id}`;
  const gradDownId = `chart-down-${id}`;

  if (candles.length < 2) {
    return (
      <ChartRoot>
        <Svg viewBox={`0 0 ${width} ${height}`} />
      </ChartRoot>
    );
  }

  const closes = candles.map((c) => c.close);
  const minV = Math.min(...closes);
  const maxV = Math.max(...closes);
  const first = closes[0] ?? 0;
  const last = closes[closes.length - 1] ?? 0;
  const isUp = last >= first;

  const PAD_TOP = 20;
  const PAD_BOTTOM = 24;
  const PAD_LEFT = 0;
  const PAD_RIGHT = 0;

  const chartW = width - PAD_LEFT - PAD_RIGHT;
  const chartH = height;

  const linePath = buildLinePath(closes, minV, maxV, chartW, chartH, PAD_TOP, PAD_BOTTOM);
  const fillPath = `${linePath}L${chartW},${chartH - PAD_BOTTOM}L0,${chartH - PAD_BOTTOM}Z`;

  const upColor = '#2FE6A8';
  const downColor = '#FF5B73';
  const lineColor = isUp ? upColor : downColor;

  // Y label positions
  const range = maxV - minV || 1;
  const midV = (maxV + minV) / 2;
  const yForValue = (v: number) => PAD_TOP + ((maxV - v) / range) * (chartH - PAD_TOP - PAD_BOTTOM);

  const labelY = (v: number) => yForValue(v).toFixed(1);

  return (
    <ChartRoot>
      <Svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradUpId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={upColor} stopOpacity="0.28" />
            <stop offset="100%" stopColor={upColor} stopOpacity="0.01" />
          </linearGradient>
          <linearGradient id={gradDownId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={downColor} stopOpacity="0.28" />
            <stop offset="100%" stopColor={downColor} stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* Fill area */}
        <path d={fillPath} fill={`url(#${isUp ? gradUpId : gradDownId})`} />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={lineColor}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />

        {/* High label */}
        <AxisLabel
          x={chartW - 2}
          y={Number(labelY(maxV)) + 4}
          textAnchor="end"
          fill="#98A0B3"
          fontSize="10"
          fontFamily="SF Mono, JetBrains Mono, monospace"
        >
          {formatPrice(maxV)}
        </AxisLabel>

        {/* Low label */}
        <AxisLabel
          x={chartW - 2}
          y={Number(labelY(minV)) - 4}
          textAnchor="end"
          fill="#98A0B3"
          fontSize="10"
          fontFamily="SF Mono, JetBrains Mono, monospace"
        >
          {formatPrice(minV)}
        </AxisLabel>

        {/* Mid label */}
        <AxisLabel
          x={chartW - 2}
          y={Number(labelY(midV)) + 4}
          textAnchor="end"
          fill="#5A6378"
          fontSize="10"
          fontFamily="SF Mono, JetBrains Mono, monospace"
        >
          {formatPrice(midV)}
        </AxisLabel>
      </Svg>
    </ChartRoot>
  );
}
