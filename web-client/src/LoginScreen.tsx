import { useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '');

const toHex = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

const hashPasswordMd5 = async (password: string) => {
  try {
    if (globalThis.crypto?.subtle) {
      const digest = await globalThis.crypto.subtle.digest('MD5', new TextEncoder().encode(password));
      return toHex(digest);
    }
  } catch (error) {
    console.warn('MD5 ハッシュ化に失敗しました。CryptoJS を利用します。', error);
  }

  return CryptoJS.MD5(password).toString(CryptoJS.enc.Hex);
};

const createClientUuid = (seed?: string) => {
  if (seed?.trim()) {
    return seed.trim();
  }
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return uuidv4();
};

const formatEndpoint = (facilityId: string, userId: string) =>
  `${API_BASE_URL}/user/${facilityId}:${userId}`;

const normalize = (value: string) => value.trim();

type LoginFormValues = {
  facilityId: string;
  userId: string;
  password: string;
  clientUuid: string;
};

type FieldKey = keyof LoginFormValues;

type LoginStatus = 'idle' | 'loading' | 'success' | 'error';

interface UserResourceResponse {
  facilityId?: string;
  userId?: string;
  displayName?: string;
  commonName?: string;
}

export const LoginScreen = () => {
  const [values, setValues] = useState<LoginFormValues>({
    facilityId: '',
    userId: '',
    password: '',
    clientUuid: '',
  });
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [status, setStatus] = useState<LoginStatus>('idle');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserResourceResponse | null>(null);

  const isLoading = status === 'loading';
  const isSuccess = status === 'success';

  const handleChange = (key: FieldKey) => (event: ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const validate = (form: LoginFormValues) => {
    const next: Partial<Record<FieldKey, string>> = {};
    if (!normalize(form.facilityId)) {
      next.facilityId = '施設IDを入力してください。';
    }
    if (!normalize(form.userId)) {
      next.userId = 'ユーザーIDを入力してください。';
    }
    if (!form.password) {
      next.password = 'パスワードを入力してください。';
    }
    return next;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    setProfile(null);

    const normalizedValues: LoginFormValues = {
      facilityId: normalize(values.facilityId),
      userId: normalize(values.userId),
      password: values.password,
      clientUuid: values.clientUuid,
    };

    const nextErrors = validate(normalizedValues);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setStatus('error');
      return;
    }

    setErrors({});
    setStatus('loading');

    try {
      const result = await performLogin(normalizedValues);
      setProfile(result);
      setFeedback('ログインに成功しました。');
      setStatus('success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'ログインに失敗しました。';
      setFeedback(message);
      setStatus('error');
    }
  };

  const buttonLabel = useMemo(() => {
    if (isLoading) {
      return 'ログイン中…';
    }
    if (isSuccess) {
      return '再ログイン';
    }
    return 'ログイン';
  }, [isLoading, isSuccess]);

  return (
    <main className="login-shell">
      <section className="login-card" aria-labelledby="login-heading">
        <header className="login-card__header">
          <h1 id="login-heading">OpenDolphin Web ログイン</h1>
          <p>
            施設ID・ユーザーID・パスワードを入力し、認証ヘッダーを用いた既存APIでサインインします。クライアントUUIDを指定しない場合は自動生成されます。
          </p>
        </header>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <label className="field">
            <span>施設ID</span>
            <input
              type="text"
              autoComplete="organization"
              value={values.facilityId}
              onChange={handleChange('facilityId')}
              placeholder="例: 0001"
            />
            {errors.facilityId ? <span className="field-error">{errors.facilityId}</span> : null}
          </label>

          <label className="field">
            <span>ユーザーID</span>
            <input
              type="text"
              autoComplete="username"
              value={values.userId}
              onChange={handleChange('userId')}
              placeholder="例: doctor01"
            />
            {errors.userId ? <span className="field-error">{errors.userId}</span> : null}
          </label>

          <label className="field">
            <span>パスワード</span>
            <input
              type="password"
              autoComplete="current-password"
              value={values.password}
              onChange={handleChange('password')}
              placeholder="パスワード"
            />
            {errors.password ? <span className="field-error">{errors.password}</span> : null}
          </label>

          <label className="field">
            <span>クライアントUUID (任意)</span>
            <input
              type="text"
              value={values.clientUuid}
              onChange={handleChange('clientUuid')}
              placeholder="未指定の場合、自動生成されます"
            />
          </label>

          <div className="login-form__actions">
            <button type="submit" disabled={isLoading}>
              {buttonLabel}
            </button>
          </div>

          {feedback ? (
            <div className={`status-message ${isSuccess ? 'is-success' : 'is-error'}`} role="status">
              {feedback}
              {isSuccess && profile ? (
                <p className="status-message__detail">
                  サインインユーザー: {profile.displayName ?? profile.commonName ?? `${profile.facilityId}:${profile.userId}`}
                </p>
              ) : null}
            </div>
          ) : null}
        </form>
      </section>
    </main>
  );
};

type LoginResult = {
  facilityId: string;
  userId: string;
  displayName?: string;
  commonName?: string;
};

const performLogin = async (payload: LoginFormValues): Promise<LoginResult> => {
  const passwordMd5 = await hashPasswordMd5(payload.password);
  const clientUuid = createClientUuid(payload.clientUuid);

  const headers = new Headers({
    userName: `${payload.facilityId}:${payload.userId}`,
    password: passwordMd5,
    clientUUID: clientUuid,
  });

  const response = await fetch(formatEndpoint(payload.facilityId, payload.userId), {
    method: 'GET',
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `ステータスコード ${response.status}`);
  }

  const data = (await response.json()) as UserResourceResponse;
  return {
    facilityId: data.facilityId ?? payload.facilityId,
    userId: data.userId ?? payload.userId,
    displayName: data.displayName,
    commonName: data.commonName,
  };
};
