import type { BannerTone } from '../reception/components/ToneBanner';

export type ApiErrorKind = 'network' | 'http' | 'business' | 'unknown';

export type ApiErrorContext = {
  error?: unknown;
  httpStatus?: number;
  apiResult?: string;
  apiResultMessage?: string;
  outcome?: string;
};

export type ApiFailureBanner = {
  tone: BannerTone;
  message: string;
  kind: ApiErrorKind;
  detail?: string;
};

const toErrorMessage = (error: unknown): string | undefined => {
  if (!error) return undefined;
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  return undefined;
};

export const isNetworkError = (error: unknown): boolean => {
  if (!error) return false;
  if (error instanceof TypeError) return true;
  const message = toErrorMessage(error);
  if (!message) return false;
  return /failed to fetch|networkerror|network|connection|timeout|timed out|ネットワーク|接続|タイムアウト/i.test(message);
};

const isBusinessError = (context: ApiErrorContext): boolean => {
  const apiResult = context.apiResult;
  if (typeof apiResult === 'string' && /error|^e/i.test(apiResult)) return true;
  const outcome = context.outcome;
  if (typeof outcome === 'string' && /error/i.test(outcome)) return true;
  return false;
};

export const classifyApiError = (context: ApiErrorContext): ApiErrorKind => {
  if (context.httpStatus === 0 || isNetworkError(context.error)) return 'network';
  if (typeof context.httpStatus === 'number' && context.httpStatus >= 400) return 'http';
  if (isBusinessError(context)) return 'business';
  if (context.error) return 'unknown';
  return 'unknown';
};

const buildDetail = (kind: ApiErrorKind, context: ApiErrorContext): string | undefined => {
  const errorMessage = toErrorMessage(context.error);
  const apiResultMessage = context.apiResultMessage;
  const apiResult = context.apiResult;
  if (kind === 'network') return errorMessage;
  if (kind === 'http') {
    if (apiResultMessage) return apiResultMessage;
    if (apiResult) return `apiResult=${apiResult}`;
    return errorMessage;
  }
  if (kind === 'business') {
    if (apiResultMessage) return apiResultMessage;
    if (apiResult) return `apiResult=${apiResult}`;
    return errorMessage;
  }
  return errorMessage;
};

export const buildApiFailureBanner = (
  subject: string,
  context: ApiErrorContext,
  operation: string = '取得',
): ApiFailureBanner => {
  const kind = classifyApiError(context);
  const detail = buildDetail(kind, context);
  const tone: BannerTone = kind === 'business' ? 'warning' : 'error';
  const base = `${subject}の${operation}に失敗しました。`;
  const label =
    kind === 'network'
      ? 'ネットワーク障害'
      : kind === 'http'
        ? context.httpStatus
          ? `HTTP ${context.httpStatus}`
          : 'サーバー応答エラー'
        : kind === 'business'
          ? '業務エラー'
          : '不明なエラー';
  const message = `${base}${label ? `（${label}${detail ? ` / ${detail}` : ''}）` : detail ? `（${detail}）` : ''}`;
  return { tone, message, kind, detail };
};
