'use client';

import styled from '@emotion/styled';

interface SwitchProps {
  checked: boolean;
  onChange: (v: boolean) => void;
}

const Track = styled.button<{ checked: boolean }>`
  position: relative;
  width: 48px;
  height: 28px;
  border-radius: ${({ theme }) => theme.radius.pill};
  border: none;
  cursor: pointer;
  transition:
    background ${({ theme }) => theme.motion.base},
    box-shadow ${({ theme }) => theme.motion.base};
  -webkit-tap-highlight-color: transparent;
  flex-shrink: 0;

  background: ${({ checked, theme }) =>
    checked ? theme.color.accent.primary : theme.color.glass.surfaceStrong};

  ${({ checked, theme }) =>
    checked
      ? `box-shadow: 0 0 12px ${theme.color.accent.primarySoft};`
      : `box-shadow: none;`}

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.accent.primary};
    outline-offset: 2px;
  }

  &:active {
    opacity: 0.85;
  }
`;

const Thumb = styled.span<{ checked: boolean }>`
  position: absolute;
  top: 3px;
  left: ${({ checked }) => (checked ? '22px' : '3px')};
  width: 22px;
  height: 22px;
  border-radius: ${({ theme }) => theme.radius.circle};
  background: ${({ checked, theme }) =>
    checked ? theme.color.text.inverse : theme.color.text.mid};
  transition: left ${({ theme }) => theme.motion.spring};
  pointer-events: none;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
`;

export function Switch({ checked, onChange }: SwitchProps) {
  return (
    <Track
      type="button"
      role="switch"
      aria-checked={checked}
      checked={checked}
      onClick={() => onChange(!checked)}
    >
      <Thumb checked={checked} />
    </Track>
  );
}
