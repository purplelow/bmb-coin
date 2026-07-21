'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styled from '@emotion/styled';
import { AuthShell } from '@/features/auth/components/AuthShell';
import { signIn, signUp } from '@/shared/lib/auth-client';
import { Button, Divider, GlassCard, TextField } from '@/shared/ui';
import { useUiStore } from '@/stores/uiStore';

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(4)};
`;

const HelperText = styled.p`
  margin: ${({ theme }) => theme.space(1.5)} 0 0;
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.color.text.low};
`;

const SocialStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(3)};
  margin-top: ${({ theme }) => theme.space(5)};
`;

const FooterText = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.color.text.mid};
  text-align: center;
`;

const FooterLink = styled(Link)`
  color: ${({ theme }) => theme.color.accent.primary};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const SOCIAL_LABELS: Record<string, string> = {
  google: 'Google로 계속하기',
  kakao: '카카오로 계속하기',
};

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [socialProviders, setSocialProviders] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth-config');
        if (!res.ok) return;
        const data = (await res.json()) as { social?: string[] };
        if (!cancelled) setSocialProviders(data.social ?? []);
      } catch {
        /* ignore — social section just stays hidden */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!name.trim()) {
      useUiStore.getState().showToast('이름을 입력해주세요.', 'danger');
      return;
    }
    if (!email.includes('@')) {
      useUiStore.getState().showToast('올바른 이메일 형식이 아닙니다.', 'danger');
      return;
    }
    if (password.length < 8) {
      useUiStore.getState().showToast('비밀번호는 8자 이상이어야 합니다.', 'danger');
      return;
    }
    if (password !== confirmPassword) {
      useUiStore.getState().showToast('비밀번호가 일치하지 않습니다.', 'danger');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await signUp.email({ email, password, name });
      if (error) {
        useUiStore.getState().showToast(error?.message ?? '회원가입에 실패했습니다.', 'danger');
        return;
      }
      useUiStore.getState().showToast('가입 완료! 자동으로 로그인됩니다.', 'success');
      // Full reload on purpose — stores must rehydrate with the session cookie.
      window.location.href = '/dashboard';
    } finally {
      setSubmitting(false);
    }
  };

  const handleSocial = async (provider: string) => {
    await signIn.social({ provider: provider as 'google' | 'kakao', callbackURL: '/dashboard' });
  };

  return (
    <AuthShell
      footer={
        <FooterText>
          이미 계정이 있으신가요? <FooterLink href="/login">로그인</FooterLink>
        </FooterText>
      }
    >
      <GlassCard padding={6} glow="primary">
        <Form onSubmit={handleSubmit}>
          <TextField label="이름" placeholder="홍길동" value={name} onChange={setName} />
          <TextField
            label="이메일"
            type="email"
            inputMode="email"
            placeholder="you@example.com"
            value={email}
            onChange={setEmail}
          />
          <div>
            <TextField
              label="비밀번호"
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={setPassword}
            />
            <HelperText>8자 이상 입력해주세요.</HelperText>
          </div>
          <TextField
            label="비밀번호 확인"
            type="password"
            placeholder="비밀번호 확인"
            value={confirmPassword}
            onChange={setConfirmPassword}
          />
          <Button type="submit" variant="primary" size="lg" fullWidth disabled={submitting}>
            {submitting ? '가입 중...' : '회원가입'}
          </Button>
        </Form>

        {socialProviders.length > 0 && (
          <SocialStack>
            <Divider />
            {socialProviders.includes('google') && (
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                onClick={() => void handleSocial('google')}
              >
                {SOCIAL_LABELS.google}
              </Button>
            )}
            {socialProviders.includes('kakao') && (
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                onClick={() => void handleSocial('kakao')}
              >
                {SOCIAL_LABELS.kakao}
              </Button>
            )}
          </SocialStack>
        )}
      </GlassCard>
    </AuthShell>
  );
}
