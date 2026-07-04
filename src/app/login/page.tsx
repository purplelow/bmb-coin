'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styled from '@emotion/styled';
import { AuthShell } from '@/features/auth/components/AuthShell';
import { signIn } from '@/shared/lib/auth-client';
import { Button, Divider, GlassCard, TextField } from '@/shared/ui';
import { useUiStore } from '@/stores/uiStore';

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(4)};
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

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

    if (!email.trim() || !password.trim()) {
      useUiStore.getState().showToast('이메일과 비밀번호를 입력해주세요.', 'danger');
      return;
    }
    if (!email.includes('@')) {
      useUiStore.getState().showToast('올바른 이메일 형식이 아닙니다.', 'danger');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await signIn.email({ email, password });
      if (error) {
        useUiStore.getState().showToast(error?.message ?? '로그인에 실패했습니다.', 'danger');
        return;
      }
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
          계정이 없으신가요? <FooterLink href="/signup">회원가입</FooterLink>
        </FooterText>
      }
    >
      <GlassCard padding={6} glow="primary">
        <Form onSubmit={handleSubmit}>
          <TextField
            label="이메일"
            type="email"
            inputMode="email"
            placeholder="you@example.com"
            value={email}
            onChange={setEmail}
          />
          <TextField
            label="비밀번호"
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={setPassword}
          />
          <Button type="submit" variant="primary" size="lg" fullWidth disabled={submitting}>
            {submitting ? '로그인 중...' : '로그인'}
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
