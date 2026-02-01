import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';

import { httpFetch, isLegacyHeaderAuthEnabled } from './libs/http/httpClient';
import { generateRunId, updateObservabilityMeta } from './libs/observability/observability';
import { consumeSessionExpiredNotice } from './libs/session/sessionExpiry';
import { logAuditEvent } from './libs/audit/auditLogger';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '');
const SYSTEM_ICON_URL = `${import.meta.env.BASE_URL}LogoImage/MainLogo.png`;



const hashPasswordMd5 = (password: string): string => {
  // Web Crypto API (SubtleCrypto) は MD5 をサポートしていないため、CryptoJS を使用
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

const normalizeRoles = (roles?: Array<string | { role?: string }>) => {
  if (!roles) return [];
  return roles
    .map((entry) => (typeof entry === 'string' ? entry : entry?.role))
    .filter((role): role is string => Boolean(role));
};

const inferRole = (userId: string, roles?: Array<string | { role?: string }>) => {
  const normalized = normalizeRoles(roles);
  if (normalized.length > 0) return normalized[0];
  const lowered = userId.toLowerCase();
  if (lowered.includes('admin')) return 'system_admin';
  if (lowered.includes('doctor')) return 'doctor';
  return 'reception';
};

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
  roles?: Array<string | { role?: string }>;
}

export type LoginResult = {
  facilityId: string;
  userId: string;
  displayName?: string;
  commonName?: string;
  clientUuid: string;
  runId: string;
  role: string;
  roles?: string[];
};

type LoginScreenProps = {
  onLoginSuccess?: (result: LoginResult) => void;
  initialFacilityId?: string;
  lockFacilityId?: boolean;
};

export const LoginScreen = ({ onLoginSuccess, initialFacilityId, lockFacilityId = false }: LoginScreenProps) => {
  const [values, setValues] = useState<LoginFormValues>(() => ({
    facilityId: initialFacilityId ?? '',
    userId: '',
    password: '',
    clientUuid: '',
  }));
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [status, setStatus] = useState<LoginStatus>('idle');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [profile, setProfile] = useState<LoginResult | null>(null);

  const isLoading = status === 'loading';
  const isSuccess = status === 'success';
  const normalizedFacilityId = normalize(values.facilityId);
  const normalizedUserId = normalize(values.userId);
  const canSubmit = Boolean(normalizedFacilityId && normalizedUserId && values.password && !isLoading);
  const shouldLockFacility = lockFacilityId && Boolean(normalizedFacilityId);

  useEffect(() => {
    const notice = consumeSessionExpiredNotice();
    if (notice?.message) {
      setFeedback(notice.message);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (!initialFacilityId) return;
    setValues((prev) =>
      prev.facilityId === initialFacilityId ? prev : { ...prev, facilityId: initialFacilityId },
    );
  }, [initialFacilityId]);

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

    const generatedClientUuid = createClientUuid();
    const normalizedValues: LoginFormValues = {
      facilityId: normalize(values.facilityId),
      userId: normalize(values.userId),
      password: values.password,
      clientUuid: generatedClientUuid,
    };
    setValues((prev) => ({ ...prev, clientUuid: generatedClientUuid }));

    const nextErrors = validate(normalizedValues);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setStatus('error');
      return;
    }

    setErrors({});
    setStatus('loading');

    const runId = generateRunId();
    updateObservabilityMeta({ runId, traceId: undefined });

    try {
      logAuditEvent({
        runId,
        source: 'auth',
        note: 'login attempt',
        payload: {
          action: 'login',
          screen: 'login',
          facilityId: normalizedValues.facilityId,
          userId: normalizedValues.userId,
        },
      });
      const result = await performLogin(normalizedValues, runId);
      setProfile(result);
      setFeedback('ログインに成功しました。');
      setStatus('success');
      logAuditEvent({
        runId: result.runId,
        source: 'auth',
        note: 'login success',
        payload: {
          action: 'login',
          screen: 'login',
          outcome: 'success',
          facilityId: result.facilityId,
          userId: result.userId,
          role: result.role,
          roles: result.roles,
        },
      });
      try {
        const urlFacilityId = normalize(initialFacilityId ?? '');
        const storedFacilityId = urlFacilityId || normalizedValues.facilityId;
        // サーバーからの result.userId は "facilityId:userId" 形式で返されるが、
        // httpClient.ts は devFacilityId と devUserId を結合するため、
        // ユーザー入力値 (normalizedValues) を保存しないと二重結合になる。
        // facilityId は URL 由来の値を優先して保存し、遷移先と整合させる。
        localStorage.setItem('devFacilityId', storedFacilityId);
        localStorage.setItem('devUserId', normalizedValues.userId);
        localStorage.setItem('devPasswordMd5', hashPasswordMd5(normalizedValues.password));
        localStorage.setItem('devClientUuid', result.clientUuid);
      } catch (storageError) {
        try {
          if (typeof sessionStorage !== 'undefined') {
            const urlFacilityId = normalize(initialFacilityId ?? '');
            const storedFacilityId = urlFacilityId || normalizedValues.facilityId;
            sessionStorage.setItem('devFacilityId', storedFacilityId);
            sessionStorage.setItem('devUserId', normalizedValues.userId);
            sessionStorage.setItem('devPasswordMd5', hashPasswordMd5(normalizedValues.password));
            sessionStorage.setItem('devClientUuid', result.clientUuid);
          }
        } catch {
          // ignore fallback failures
        }
        console.warn('認証情報の保存に失敗しましたが、ログイン処理は継続します。', storageError);
      }
      onLoginSuccess?.(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'ログインに失敗しました。';
      setFeedback(message);
      setStatus('error');
      logAuditEvent({
        runId,
        source: 'auth',
        note: 'login denied',
        payload: {
          action: 'login',
          screen: 'login',
          outcome: 'denied',
          facilityId: normalizedValues.facilityId,
          userId: normalizedValues.userId,
          reason: message,
        },
      });
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
          <div className="login-brand">
            <div className="login-brand__badge">
              <img src={SYSTEM_ICON_URL} alt="OpenDolphin システムアイコン" />
            </div>

          </div>

        </header>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {shouldLockFacility ? (
            <input type="hidden" name="facilityId" value={values.facilityId} />
          ) : (
            <label className="field">
              <span>施設ID</span>
              <input
                type="text"
                autoComplete="organization"
                value={values.facilityId}
                onChange={handleChange('facilityId')}
                placeholder="例: 0001"
                disabled={isLoading}
              />
              {errors.facilityId ? <span className="field-error">{errors.facilityId}</span> : null}
            </label>
          )}

          <label className="field">
            <span>ユーザーID</span>
            <input
              type="text"
              autoComplete="username"
              value={values.userId}
              onChange={handleChange('userId')}
              placeholder="例: doctor01"
              disabled={isLoading}
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
              disabled={isLoading}
            />
            {errors.password ? <span className="field-error">{errors.password}</span> : null}
          </label>

          <div className="login-form__actions">
            <button type="submit" disabled={!canSubmit}>
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
    </main >
  );
};

const performLogin = async (payload: LoginFormValues, runId: string): Promise<LoginResult> => {
  const passwordMd5 = hashPasswordMd5(payload.password);
  const clientUuid = createClientUuid(payload.clientUuid);
  const forceLegacyHeaderAuth = isLegacyHeaderAuthEnabled();
  const allowLegacyFallback = import.meta.env.VITE_ALLOW_LEGACY_HEADER_AUTH_FALLBACK === '1';

  const buildStandardHeaders = (): HeadersInit => {
    // Basic 認証ユーザー名は userId（施設IDはリクエストパスから解決）、パスワードは平文を使用する。
    const basicUser = payload.userId;
    const token = btoa(unescape(encodeURIComponent(`${basicUser}:${payload.password}`)));
    return {
      Authorization: `Basic ${token}`,
      'X-Run-Id': runId,
    };
  };

  const buildLegacyHeaders = (): HeadersInit => ({
    'X-Run-Id': runId,
    userName: `${payload.facilityId}:${payload.userId}`,
    password: passwordMd5,
    clientUUID: clientUuid,
  });

  const sendLogin = async (legacy: boolean) =>
    httpFetch(formatEndpoint(payload.facilityId, payload.userId), {
      method: 'GET',
      headers: legacy ? buildLegacyHeaders() : buildStandardHeaders(),
      credentials: 'include',
    });

  let response: Response;
  if (forceLegacyHeaderAuth && !allowLegacyFallback) {
    response = await sendLogin(true);
  } else {
    response = await sendLogin(false);
    if (!response.ok && (forceLegacyHeaderAuth || allowLegacyFallback)) {
      // 旧ヘッダ認証が必要な開発環境向けフォールバック
      response = await sendLogin(true);
    }
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `ステータスコード ${response.status}`);
  }

  const data = (await response.json()) as UserResourceResponse;
  const normalizedRoles = normalizeRoles(data.roles);
  const resolvedRole = inferRole(payload.userId, normalizedRoles);
  try {
    localStorage.setItem('devRole', resolvedRole);
  } catch {
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('devRole', resolvedRole);
      }
    } catch {
      // ignore fallback failures
    }
  }
  return {
    facilityId: data.facilityId ?? payload.facilityId,
    userId: data.userId ?? payload.userId,
    displayName: data.displayName,
    commonName: data.commonName,
    clientUuid,
    runId,
    role: resolvedRole,
    roles: normalizedRoles,
  };
};
