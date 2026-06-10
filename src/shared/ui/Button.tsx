'use client';

import React from 'react';
import styled from '@emotion/styled';
import { css } from '@emotion/react';

// ── Button ──────────────────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
  children?: React.ReactNode;
}

const sizeStyles = {
  sm: css`
    height: 34px;
    padding: 0 14px;
    font-size: 13px;
    border-radius: 10px;
    gap: 6px;
  `,
  md: css`
    height: 44px;
    padding: 0 20px;
    font-size: 15px;
    border-radius: 14px;
    gap: 8px;
  `,
  lg: css`
    height: 52px;
    padding: 0 28px;
    font-size: 16px;
    border-radius: 16px;
    gap: 10px;
  `,
};

const StyledButton = styled.button<{
  variant: ButtonVariant;
  size: ButtonSize;
  fullWidth: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: ${({ theme }) => theme.font.family};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  cursor: pointer;
  border: none;
  outline: none;
  transition:
    transform ${({ theme }) => theme.motion.fast},
    box-shadow ${({ theme }) => theme.motion.fast},
    background ${({ theme }) => theme.motion.fast},
    opacity ${({ theme }) => theme.motion.fast};
  width: ${({ fullWidth }) => (fullWidth ? '100%' : 'auto')};
  -webkit-tap-highlight-color: transparent;
  position: relative;
  overflow: hidden;

  ${({ size }) => sizeStyles[size]};

  ${({ variant, theme }) => {
    switch (variant) {
      case 'primary':
        return css`
          background: ${theme.color.accent.primary};
          color: ${theme.color.text.inverse};
          box-shadow: ${theme.shadow.glowPrimary};
          &:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 10px 36px rgba(197, 255, 74, 0.42);
          }
          &:active:not(:disabled) {
            transform: translateY(0);
            box-shadow: ${theme.shadow.glowPrimary};
          }
        `;
      case 'secondary':
        return css`
          background: ${theme.color.glass.surfaceStrong};
          color: ${theme.color.text.high};
          border: 1px solid ${theme.color.glass.border};
          backdrop-filter: ${theme.blur.glass};
          &:hover:not(:disabled) {
            background: ${theme.color.glass.highlight};
            border-color: ${theme.color.glass.borderStrong};
          }
          &:active:not(:disabled) {
            background: ${theme.color.glass.surface};
          }
        `;
      case 'ghost':
        return css`
          background: transparent;
          color: ${theme.color.text.mid};
          &:hover:not(:disabled) {
            background: ${theme.color.glass.surface};
            color: ${theme.color.text.high};
          }
          &:active:not(:disabled) {
            background: ${theme.color.glass.surfaceStrong};
          }
        `;
      case 'danger':
        return css`
          background: ${theme.color.status.danger};
          color: #fff;
          &:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 8px 24px rgba(255, 91, 115, 0.38);
          }
          &:active:not(:disabled) {
            transform: translateY(0);
          }
        `;
    }
  }}

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.accent.primary};
    outline-offset: 2px;
  }
`;

const IconSlot = styled.span`
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
`;

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  leftIcon,
  disabled = false,
  onClick,
  type = 'button',
  children,
}: ButtonProps) {
  return (
    <StyledButton
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      {leftIcon && <IconSlot>{leftIcon}</IconSlot>}
      {children}
    </StyledButton>
  );
}

// ── IconButton ───────────────────────────────────────────────────────────────

interface IconButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  label: string;
  variant?: 'ghost' | 'solid';
  size?: number;
}

const StyledIconButton = styled.button<{ variant: 'ghost' | 'solid'; btnSize: number }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${({ btnSize }) => btnSize}px;
  height: ${({ btnSize }) => btnSize}px;
  border: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  font-family: ${({ theme }) => theme.font.family};
  transition:
    background ${({ theme }) => theme.motion.fast},
    transform ${({ theme }) => theme.motion.fast};
  flex-shrink: 0;

  ${({ variant, theme }) =>
    variant === 'solid'
      ? css`
          background: ${theme.color.glass.surfaceStrong};
          border-radius: ${theme.radius.md};
          color: ${theme.color.text.high};
          border: 1px solid ${theme.color.glass.border};
          &:hover:not(:disabled) {
            background: ${theme.color.glass.highlight};
          }
        `
      : css`
          background: transparent;
          border-radius: ${theme.radius.pill};
          color: ${theme.color.text.mid};
          &:hover:not(:disabled) {
            background: ${theme.color.glass.surface};
            color: ${theme.color.text.high};
          }
        `}

  &:active:not(:disabled) {
    transform: scale(0.92);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.accent.primary};
    outline-offset: 2px;
  }
`;

export function IconButton({
  children,
  onClick,
  label,
  variant = 'ghost',
  size = 40,
}: IconButtonProps) {
  return (
    <StyledIconButton
      type="button"
      variant={variant}
      btnSize={size}
      onClick={onClick}
      aria-label={label}
    >
      {children}
    </StyledIconButton>
  );
}
