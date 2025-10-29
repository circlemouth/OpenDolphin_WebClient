import { useEffect } from 'react';
import { useLocation, useNavigate, type Location } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';

import { Button, Stack, SurfaceCard, TextField } from '@/components';
import { useAuth } from '@/libs/auth';

const loginSchema = z.object({
  facilityId: z.string().min(1, '施設IDを入力してください'),
  userId: z.string().min(1, 'ユーザーIDを入力してください'),
  password: z.string().min(1, 'パスワードを入力してください'),
  clientUuid: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

interface LocationState {
  from?: Location;
}

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      facilityId: '',
      userId: '',
      password: '',
      clientUuid: undefined,
    },
  });

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: () => {
      const state = location.state as LocationState | undefined;
      const redirectTo = state?.from?.pathname && state.from.pathname !== '/login' ? state.from.pathname : '/patients';
      navigate(redirectTo, { replace: true });
    },
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/patients', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = handleSubmit((values) => {
    mutation.mutate({
      facilityId: values.facilityId,
      userId: values.userId,
      password: values.password,
      clientUuid: values.clientUuid,
    });
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f2f7ff 0%, #dfe7ff 100%)',
        padding: '2rem',
      }}
    >
      <SurfaceCard as="section" aria-labelledby="login-heading" style={{ maxWidth: 420, width: '100%' }}>
        <Stack gap={24}>
          <header>
            <Stack gap={8}>
              <h1
                id="login-heading"
                style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}
              >
                OpenDolphin Web ログイン
              </h1>
              <p style={{ margin: 0, color: '#475569', lineHeight: 1.6 }}>
                施設ID・ユーザーID・パスワードを入力してサインインしてください。クライアントUUIDを指定しない場合は自動生成されます。
              </p>
            </Stack>
          </header>

          <form onSubmit={onSubmit}>
            <Stack gap={20}>
              <TextField
                label="施設ID"
                placeholder="例: 0001"
                autoComplete="organization"
                errorMessage={errors.facilityId?.message}
                {...register('facilityId')}
              />

              <TextField
                label="ユーザーID"
                placeholder="例: doctor01"
                autoComplete="username"
                errorMessage={errors.userId?.message}
                {...register('userId')}
              />

              <TextField
                label="パスワード"
                type="password"
                placeholder="パスワード"
                autoComplete="current-password"
                errorMessage={errors.password?.message}
                {...register('password')}
              />

              <TextField
                label="クライアントUUID (任意)"
                placeholder="未入力の場合は自動で割り当て"
                errorMessage={errors.clientUuid?.message}
                {...register('clientUuid')}
              />

              {mutation.isError ? (
                <div role="alert" style={{ color: '#dc2626', fontSize: '0.9rem' }}>
                  ログインに失敗しました。資格情報を確認してください。
                </div>
              ) : null}

              <Button type="submit" isLoading={mutation.isPending} fullWidth>
                ログイン
              </Button>
            </Stack>
          </form>

          <footer style={{ fontSize: '0.85rem', color: '#64748b' }}>
            <p style={{ margin: 0 }}>
              認証情報はブラウザのセッションストレージに保存され、ログアウト操作で破棄されます。共有端末では必ずログアウトしてください。
            </p>
          </footer>
        </Stack>
      </SurfaceCard>
    </div>
  );
};
