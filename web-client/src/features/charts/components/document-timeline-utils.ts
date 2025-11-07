import { isAxiosError } from 'axios';

import type {
  TimelineEventCategory,
  TimelineEventCategoryMeta,
} from '@/features/charts/utils/timeline-events';

export type TimelineStatusTone = 'info' | 'warning' | 'danger' | 'neutral';

export const formatDateTime = (value?: string | null): string => {
  if (!value) {
    return '---';
  }
  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const getStatusTone = (status?: string | null): TimelineStatusTone => {
  if (!status) {
    return 'neutral';
  }
  const normalized = status.toUpperCase();
  if (normalized === 'F') {
    return 'info';
  }
  if (normalized === 'M') {
    return 'warning';
  }
  if (normalized === 'D') {
    return 'danger';
  }
  return 'neutral';
};

export const resolveErrorMessage = (error: unknown): string => {
  const fallbackMessage =
    'イベントの取得に失敗しました。画面右上の「更新」で再取得しても改善しない場合はシステム管理者にご連絡ください。';

  if (isAxiosError(error)) {
    const status = error.response?.status;
    const errorCode = error.code?.toUpperCase();

    if (status === 404) {
      return '対象のカルテ情報が見つかりません。削除済みか参照権限が変更された可能性があります。「更新」で再取得しても表示されない場合はシステム管理者にお問い合わせください。';
    }

    if (status === 401 || status === 403) {
      return 'カルテタイムラインを表示する権限がありません。再読み込み後も改善しない場合は、管理者に権限設定の確認を依頼してください。';
    }

    if (status === 408 || errorCode === 'ECONNABORTED' || errorCode === 'ETIMEDOUT') {
      return 'サーバーからの応答がタイムアウトしました。通信環境をご確認のうえ「更新」で再取得してください。繰り返し発生する場合はシステム管理者にご連絡ください。';
    }

    if (status === 429) {
      return 'アクセスが集中しています。少し時間をおいてから「更新」で再取得してください。改善しない場合はシステム管理者にお問い合わせください。';
    }

    if (status === 503) {
      return 'カルテ API がメンテナンス中の可能性があります。時間をおいて「更新」で再取得してください。復旧しない場合はシステム管理者に状況をご確認ください。';
    }

    if (typeof status === 'number' && status >= 500) {
      return 'サーバー側でエラーが発生しました。時間をおいて「更新」で再取得しても改善しない場合、API が停止している可能性があります。システム管理者へご連絡ください。';
    }

    if (!error.response) {
      return 'サーバーに接続できません。ネットワーク状態を確認し、「更新」で再取得してください。復旧しない場合はシステム管理者にお問い合わせください。';
    }

    if (typeof status === 'number' && status >= 400) {
      return '表示条件が正しくありません。検索条件を確認のうえ「更新」で再取得してください。繰り返し発生する場合はシステム管理者にお問い合わせください。';
    }
  }

  if (error instanceof Error) {
    if (/timeout|タイムアウト/i.test(error.message)) {
      return 'サーバーからの応答がタイムアウトしました。通信環境をご確認のうえ「更新」で再取得してください。繰り返し発生する場合はシステム管理者にご連絡ください。';
    }
  }

  return fallbackMessage;
};

export const deriveActiveCategories = (
  prev: TimelineEventCategory[],
  categoriesMeta: TimelineEventCategoryMeta[],
): TimelineEventCategory[] | null => {
  const availableList = categoriesMeta.map((category) => category.id);
  const availableSet = new Set(availableList);
  const filtered = prev.filter((id) => availableSet.has(id));
  const next = filtered.length > 0 ? filtered : availableList;
  if (prev.length === next.length && prev.every((value, index) => value === next[index])) {
    return null;
  }
  return next;
};
