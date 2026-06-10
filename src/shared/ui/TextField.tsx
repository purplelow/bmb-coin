'use client';

import React from 'react';
import styled from '@emotion/styled';

// ── TextField ────────────────────────────────────────────────────────────────

interface TextFieldProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label?: string;
  type?: string;
  suffix?: React.ReactNode;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
}

const FieldWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
`;

const Label = styled.label`
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  color: ${({ theme }) => theme.color.text.mid};
`;

const InputRow = styled.div`
  display: flex;
  align-items: center;
  background: ${({ theme }) => theme.color.bg.sunken};
  border: 1px solid ${({ theme }) => theme.color.glass.border};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: 0 14px;
  gap: 8px;
  transition:
    border-color ${({ theme }) => theme.motion.fast},
    box-shadow ${({ theme }) => theme.motion.fast};

  &:focus-within {
    border-color: ${({ theme }) => theme.color.glass.borderStrong};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.color.accent.primarySoft};
  }
`;

const StyledInput = styled.input`
  flex: 1;
  height: 44px;
  background: transparent;
  border: none;
  outline: none;
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.md};
  color: ${({ theme }) => theme.color.text.high};

  &::placeholder {
    color: ${({ theme }) => theme.color.text.low};
  }

  &:-webkit-autofill {
    -webkit-box-shadow: 0 0 0 1000px ${({ theme }) => theme.color.bg.sunken} inset;
    -webkit-text-fill-color: ${({ theme }) => theme.color.text.high};
  }
`;

const Suffix = styled.span`
  font-family: ${({ theme }) => theme.font.family};
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.color.text.low};
  flex-shrink: 0;
`;

export function TextField({
  value,
  onChange,
  placeholder,
  label,
  type = 'text',
  suffix,
  inputMode,
}: TextFieldProps) {
  return (
    <FieldWrapper>
      {label && <Label>{label}</Label>}
      <InputRow>
        <StyledInput
          type={type}
          value={value}
          placeholder={placeholder}
          inputMode={inputMode}
          onChange={(e) => onChange(e.target.value)}
        />
        {suffix && <Suffix>{suffix}</Suffix>}
      </InputRow>
    </FieldWrapper>
  );
}

// ── NumberField ──────────────────────────────────────────────────────────────

interface NumberFieldProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: React.ReactNode;
  label?: string;
  placeholder?: string;
}

const StyledNumberInput = styled.input`
  flex: 1;
  height: 44px;
  background: transparent;
  border: none;
  outline: none;
  font-family: ${({ theme }) => theme.font.mono};
  font-size: ${({ theme }) => theme.font.size.md};
  color: ${({ theme }) => theme.color.text.high};

  &::placeholder {
    color: ${({ theme }) => theme.color.text.low};
    font-family: ${({ theme }) => theme.font.family};
  }

  /* Remove browser number spinners */
  -moz-appearance: textfield;
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`;

export function NumberField({
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
  label,
  placeholder,
}: NumberFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseFloat(e.target.value);
    if (!isNaN(raw)) {
      let clamped = raw;
      if (min !== undefined) clamped = Math.max(min, clamped);
      if (max !== undefined) clamped = Math.min(max, clamped);
      onChange(clamped);
    }
  };

  return (
    <FieldWrapper>
      {label && <Label>{label}</Label>}
      <InputRow>
        <StyledNumberInput
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
          inputMode="numeric"
          onChange={handleChange}
        />
        {suffix && <Suffix>{suffix}</Suffix>}
      </InputRow>
    </FieldWrapper>
  );
}
