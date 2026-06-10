'use client';

import styled from '@emotion/styled';

interface Option {
  label: string;
  value: string;
}

interface SegmentedControlProps {
  options: Option[];
  value: string;
  onChange: (v: string) => void;
  fullWidth?: boolean;
}

const Track = styled.div<{ fullWidth: boolean }>`
  display: inline-flex;
  background: ${({ theme }) => theme.color.bg.sunken};
  border: 1px solid ${({ theme }) => theme.color.glass.border};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: 3px;
  gap: 2px;
  width: ${({ fullWidth }) => (fullWidth ? '100%' : 'auto')};
`;

const Segment = styled.button<{ active: boolean; fullWidth: boolean }>`
  flex: ${({ fullWidth }) => (fullWidth ? '1' : 'initial')};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 34px;
  padding: 0 14px;
  border: none;
  border-radius: 11px;
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  cursor: pointer;
  transition:
    background ${({ theme }) => theme.motion.fast},
    color ${({ theme }) => theme.motion.fast},
    box-shadow ${({ theme }) => theme.motion.fast};
  -webkit-tap-highlight-color: transparent;
  white-space: nowrap;

  ${({ active, theme }) =>
    active
      ? `
    background: ${theme.color.glass.surfaceStrong};
    color: ${theme.color.text.high};
    box-shadow: 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 ${theme.color.glass.highlight};
  `
      : `
    background: transparent;
    color: ${theme.color.text.low};
    &:hover {
      color: ${theme.color.text.mid};
    }
  `}

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.accent.primary};
    outline-offset: 1px;
  }
`;

export function SegmentedControl({
  options,
  value,
  onChange,
  fullWidth = false,
}: SegmentedControlProps) {
  return (
    <Track fullWidth={fullWidth}>
      {options.map((opt) => (
        <Segment
          key={opt.value}
          type="button"
          active={opt.value === value}
          fullWidth={fullWidth}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </Segment>
      ))}
    </Track>
  );
}
