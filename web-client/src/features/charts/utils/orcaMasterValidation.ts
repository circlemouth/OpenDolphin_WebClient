import type { OrcaMasterAuditMeta } from '@/types/orca';

export type OrcaCodeType =
  | 'yakko'
  | 'youhou'
  | 'materialCategory'
  | 'kensa'
  | 'payerCode'
  | 'zip';

export const ORCA_CODE_REGEX: Record<OrcaCodeType, RegExp> = {
  yakko: /^\d{3}(\d{2})?$/, // 3 桁 or 5 桁
  youhou: /^\d{2,4}$/,
  materialCategory: /^[A-Za-z0-9]{2}$/,
  kensa: /^\d{4}$/,
  payerCode: /^\d{8}$/,
  zip: /^\d{7}$/,
};

export const ORCA_VALIDATION_MESSAGES: Record<OrcaCodeType, string> = {
  yakko: '薬効コードは 3 桁または 5 桁の数字で入力してください',
  youhou: '用法コードは 2〜4 桁の数字で入力してください',
  materialCategory: '材料カテゴリは半角英数字 2 桁で入力してください（例: A1）',
  kensa: '検査分類コードは 4 桁の数字で入力してください',
  payerCode: '保険者番号は 8 桁の数字で、先頭 2 桁を都道府県コードに合わせてください',
  zip: '郵便番号はハイフンなしの数字 7 桁で入力してください',
};

export const maskOrcaInput = (value: string, type: OrcaCodeType): string => {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) return '';

  if (type === 'materialCategory') {
    return trimmed.replace(/[^0-9A-Za-z]/g, '').toUpperCase().slice(0, 2);
  }

  const digitsOnly = trimmed.replace(/\D/g, '');
  switch (type) {
    case 'yakko':
      return digitsOnly.slice(0, 5);
    case 'youhou':
      return digitsOnly.slice(0, 4);
    case 'kensa':
      return digitsOnly.slice(0, 4);
    case 'payerCode':
      return digitsOnly.slice(0, 8);
    case 'zip':
      return digitsOnly.slice(0, 7);
    default:
      return digitsOnly;
  }
};

export class OrcaValidationError extends Error {
  readonly userMessage: string;

  readonly meta: OrcaMasterAuditMeta & { validationError: true; missingMaster: false };

  constructor(type: OrcaCodeType, rawValue: string, meta?: Partial<OrcaMasterAuditMeta>) {
    const message = ORCA_VALIDATION_MESSAGES[type];
    super(message);
    this.name = 'OrcaValidationError';
    this.userMessage = message;
    this.meta = {
      dataSource: meta?.dataSource,
      runId: meta?.runId,
      snapshotVersion: meta?.snapshotVersion,
      cacheHit: meta?.cacheHit ?? false,
      fallbackUsed: meta?.fallbackUsed ?? false,
      missingMaster: false,
      validationError: true,
    };
    // rawValue を付帯情報として保持（監査用）
    (this.meta as unknown as Record<string, unknown>).rawValue = rawValue;
  }
}

export const validateOrcaCode = (
  type: OrcaCodeType,
  rawValue: string,
  meta?: Partial<OrcaMasterAuditMeta>,
): { ok: boolean; normalized: string; error?: OrcaValidationError } => {
  const normalized = maskOrcaInput(rawValue, type);
  const pattern = ORCA_CODE_REGEX[type];
  const ok = Boolean(normalized) && pattern.test(normalized);

  if (ok) {
    return { ok: true, normalized };
  }

  return {
    ok: false,
    normalized,
    error: new OrcaValidationError(type, rawValue, meta),
  };
};

// TODO: 各 UI 入力フィールド（薬効/用法/材料カテゴリ/検査分類/保険者番号/郵便番号）の onChange で maskOrcaInput を適用し、
// validateOrcaCode の userMessage を 422 表示に利用する。監査送信時は meta.validationError=true を透過させる。
