'use client';

import styled from '@emotion/styled';

interface SliderProps {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}

const Wrapper = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
`;

const Track = styled.div<{ pct: number }>`
  position: relative;
  width: 100%;
  height: 4px;
  border-radius: ${({ theme }) => theme.radius.pill};
  background: ${({ theme }) => theme.color.glass.surfaceStrong};

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    width: ${({ pct }) => pct}%;
    height: 100%;
    border-radius: ${({ theme }) => theme.radius.pill};
    background: ${({ theme }) => theme.gradient.brand};
    pointer-events: none;
  }
`;

const Input = styled.input`
  position: absolute;
  left: 0;
  width: 100%;
  height: 4px;
  opacity: 0;
  cursor: pointer;
  margin: 0;
  appearance: none;
  -webkit-appearance: none;
  z-index: 1;
`;

const Thumb = styled.div<{ pct: number }>`
  position: absolute;
  left: calc(${({ pct }) => pct}% - 11px);
  width: 22px;
  height: 22px;
  border-radius: ${({ theme }) => theme.radius.circle};
  background: ${({ theme }) => theme.color.accent.primary};
  box-shadow: 0 0 10px ${({ theme }) => theme.color.accent.primarySoft};
  pointer-events: none;
  transition: box-shadow ${({ theme }) => theme.motion.fast};
`;

export function Slider({ min, max, step, value, onChange }: SliderProps) {
  const pct = max === min ? 0 : ((value - min) / (max - min)) * 100;

  return (
    <Wrapper>
      <Track pct={pct}>
        <Thumb pct={pct} />
        <Input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
        />
      </Track>
    </Wrapper>
  );
}
