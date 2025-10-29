import type { PatientVisitSummary } from '@/features/charts/types/patient-visit';

export interface ParsedHealthInsurance {
  id: string;
  label: string;
  description: string;
  classCode?: string;
  className?: string;
  guid?: string;
  number?: string;
  clientGroup?: string;
  clientNumber?: string;
  startDate?: string;
  expiredDate?: string;
}

const decodeBase64 = (input: string) => {
  const bufferLike = (globalThis as {
    Buffer?: { from: (input: string, encoding: string) => { toString: (encoding: string) => string } };
  }).Buffer;

  if (bufferLike) {
    return bufferLike.from(input, 'base64').toString('utf-8');
  }

  if (typeof globalThis.atob === 'function') {
    return globalThis.atob(input);
  }

  throw new Error('Base64 デコードに対応していない環境です。');
};

const decodeHtmlEntities = (value: string) =>
  value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#10;/g, '\n');

const extractStrings = (body: string) => {
  const matches = Array.from(body.matchAll(/<string>([\s\S]*?)<\/string>/g));
  return matches.map((match) => decodeHtmlEntities(match[1] ?? ''));
};

interface BeanParseResult {
  properties: Record<string, string | string[] | null>;
  warnings: string[];
}

const parseBeanProperties = (xml: string): BeanParseResult => {
  const properties: Record<string, string | string[] | null> = {};
  const warnings: string[] = [];
  const propertyPattern = /<void\s+property="([^"]+)">([\s\S]*?)<\/void>/g;
  let match: RegExpExecArray | null;

  while ((match = propertyPattern.exec(xml)) !== null) {
    const [, key, body] = match;
    if (!key) {
      continue;
    }

    if (body.includes('<array')) {
      const values = extractStrings(body);
      properties[key] = values.length > 0 ? values : null;
      continue;
    }

    if (body.includes('<string')) {
      const [value] = extractStrings(body);
      properties[key] = value ?? '';
      continue;
    }

    if (body.includes('<int')) {
      const intMatch = body.match(/<int>(.*?)<\/int>/);
      properties[key] = intMatch?.[1] ?? '';
      continue;
    }

    if (body.includes('<long')) {
      const longMatch = body.match(/<long>(.*?)<\/long>/);
      properties[key] = longMatch?.[1] ?? '';
      continue;
    }

    if (body.includes('<boolean')) {
      const boolMatch = body.match(/<boolean>(.*?)<\/boolean>/);
      properties[key] = boolMatch?.[1] ?? '';
      continue;
    }

    if (body.includes('<null')) {
      properties[key] = null;
      continue;
    }

    const trimmed = body.replace(/\s+/g, ' ').trim();
    warnings.push(`未対応のプロパティ形式を検出: ${key} => ${trimmed.slice(0, 80)}`);
  }

  return { properties, warnings };
};

const buildInsuranceLabel = (props: Record<string, string | string[] | null>) => {
  const parts = [
    props.insuranceClass as string | undefined,
    props.insuranceClassCode ? `(${props.insuranceClassCode})` : null,
    props.insuranceNumber ? `保険者番号: ${props.insuranceNumber}` : null,
  ].filter((entry): entry is string => Boolean(entry));

  const identification = [props.clientGroup, props.clientNumber]
    .filter((entry): entry is string => Boolean(entry))
    .join('');

  if (identification) {
    parts.push(`記号番号: ${identification}`);
  }

  if (props.startDate) {
    parts.push(`開始日: ${props.startDate}`);
  }

  if (props.expiredDate) {
    parts.push(`期限: ${props.expiredDate}`);
  }

  return parts.length > 0 ? parts.join(' / ') : '保険情報未登録';
};

export interface ParseHealthInsuranceOptions {
  onWarning?: (message: string) => void;
  fallbackLabel?: string;
}

const buildFallbackInsurance = (beanBytes: string, reason: string, label?: string): ParsedHealthInsurance => {
  const fallbackLabel = label ?? '保険情報（解析失敗）';
  const identifier = `bean:${beanBytes.slice(0, 12)}`;
  return {
    id: identifier,
    label: fallbackLabel,
    description: `${fallbackLabel} - ${reason}`,
  };
};

export const parseHealthInsuranceBean = (
  beanBytes: string,
  options: ParseHealthInsuranceOptions = {},
): ParsedHealthInsurance | null => {
  try {
    const xml = decodeBase64(beanBytes);
    const { properties, warnings } = parseBeanProperties(xml);

    if (warnings.length > 0) {
      for (const warning of warnings) {
        if (options.onWarning) {
          options.onWarning(warning);
        } else {
          console.warn('健康保険情報の解析で警告が発生しました', warning);
        }
      }
    }

    const guid = (properties.GUID as string | undefined) ?? undefined;
    const classCode = (properties.insuranceClassCode as string | undefined) ?? undefined;
    const label = buildInsuranceLabel(properties);

    const id = guid ?? classCode ?? label;
    if (!id) {
      return buildFallbackInsurance(beanBytes, 'ID を特定できませんでした', options.fallbackLabel);
    }

    return {
      id,
      label,
      description: label,
      classCode,
      className: (properties.insuranceClass as string | undefined) ?? undefined,
      guid,
      number: (properties.insuranceNumber as string | undefined) ?? undefined,
      clientGroup: (properties.clientGroup as string | undefined) ?? undefined,
      clientNumber: (properties.clientNumber as string | undefined) ?? undefined,
      startDate: (properties.startDate as string | undefined) ?? undefined,
      expiredDate: (properties.expiredDate as string | undefined) ?? undefined,
    };
  } catch (error) {
    console.error('健康保険情報の解析に失敗しました', error);
    return buildFallbackInsurance(beanBytes, 'XML デコードに失敗しました', options.fallbackLabel);
  }
};

export const extractInsuranceOptions = (visit: PatientVisitSummary | null): ParsedHealthInsurance[] => {
  if (!visit?.raw?.patientModel?.healthInsurances || visit.raw.patientModel.healthInsurances.length === 0) {
    return [];
  }

  const results: ParsedHealthInsurance[] = [];
  for (const entry of visit.raw.patientModel.healthInsurances) {
    if (!entry?.beanBytes) {
      continue;
    }
    const parsed = parseHealthInsuranceBean(entry.beanBytes);
    if (parsed) {
      results.push(parsed);
    }
  }

  return results;
};
