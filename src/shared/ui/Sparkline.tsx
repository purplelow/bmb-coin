'use client';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: boolean;
}

function buildPath(data: number[], w: number, h: number): string {
  if (data.length < 2) return '';
  const minV = Math.min(...data);
  const maxV = Math.max(...data);
  const range = maxV - minV || 1;
  const pad = 2;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = pad + ((maxV - v) / range) * (h - pad * 2);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  return 'M' + points.join('L');
}

export function Sparkline({
  data,
  width = 80,
  height = 32,
  color = 'currentColor',
  fill = false,
}: SparklineProps) {
  if (data.length < 2) {
    return <svg width={width} height={height} />;
  }

  const linePath = buildPath(data, width, height);

  const fillPath = fill
    ? `${linePath}L${width},${height}L0,${height}Z`
    : null;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      aria-hidden="true"
    >
      {fillPath && (
        <path
          d={fillPath}
          fill={color}
          opacity={0.15}
        />
      )}
      <path
        d={linePath}
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
