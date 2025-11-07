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

export type BeanPropertyValue =
  | { type: 'string'; value: string }
  | { type: 'int'; value: string }
  | { type: 'long'; value: string }
  | { type: 'boolean'; value: string }
  | { type: 'array'; value: string[] }
  | { type: 'null' }
  | { type: 'raw'; raw: string };

export interface BeanParseResult {
  properties: Record<string, BeanPropertyValue>;
  order: string[];
  warnings: string[];
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

const encodeBase64 = (input: string) => {
  const bufferLike = (globalThis as {
    Buffer?: { from: (input: string, encoding: string) => { toString: (encoding: string) => string } };
  }).Buffer;

  if (bufferLike) {
    return bufferLike.from(input, 'utf-8').toString('base64');
  }

  if (typeof globalThis.btoa === 'function') {
    return globalThis.btoa(input);
  }

  throw new Error('Base64 エンコードに対応していない環境です。');
};

const extractStrings = (body: string) => {
  const matches = Array.from(body.matchAll(/<string>([\s\S]*?)<\/string>/g));
  return matches.map((match) => decodeHtmlEntities(match[1] ?? ''));
};

const parseBeanProperties = (xml: string): BeanParseResult => {
  const properties: Record<string, BeanPropertyValue> = {};
  const warnings: string[] = [];
  const order: string[] = [];
  const propertyPattern = /<void\s+property="([^"]+)">([\s\S]*?)<\/void>/g;
  let match: RegExpExecArray | null;

  while ((match = propertyPattern.exec(xml)) !== null) {
    const [, key, body] = match;
    if (!key) {
      continue;
    }

    order.push(key);

    if (body.includes('<array')) {
      const values = extractStrings(body);
      properties[key] = { type: 'array', value: values.length > 0 ? values : [] };
      continue;
    }

    if (body.includes('<string')) {
      const [value] = extractStrings(body);
      properties[key] = { type: 'string', value: value ?? '' };
      continue;
    }

    if (body.includes('<int')) {
      const intMatch = body.match(/<int>(.*?)<\/int>/);
      properties[key] = { type: 'int', value: intMatch?.[1] ?? '' };
      continue;
    }

    if (body.includes('<long')) {
      const longMatch = body.match(/<long>(.*?)<\/long>/);
      properties[key] = { type: 'long', value: longMatch?.[1] ?? '' };
      continue;
    }

    if (body.includes('<boolean')) {
      const boolMatch = body.match(/<boolean>(.*?)<\/boolean>/);
      properties[key] = { type: 'boolean', value: boolMatch?.[1] ?? '' };
      continue;
    }

    if (body.includes('<null')) {
      properties[key] = { type: 'null' };
      continue;
    }

    const trimmed = body.replace(/\s+/g, ' ').trim();
    warnings.push(`未対応のプロパティ形式を検出: ${key} => ${trimmed.slice(0, 80)}`);
    properties[key] = { type: 'raw', raw: body };
  }

  return { properties, warnings, order };
};

const buildInsuranceLabel = (props: Record<string, BeanPropertyValue>) => {
  const parts = [
    props.insuranceClass?.type === 'string' ? props.insuranceClass.value : undefined,
    props.insuranceClassCode?.type === 'string' ? `(${props.insuranceClassCode.value})` : null,
    props.insuranceNumber?.type === 'string' ? `保険者番号: ${props.insuranceNumber.value}` : null,
  ].filter((entry): entry is string => Boolean(entry));

  const identification = [props.clientGroup, props.clientNumber]
    .map((entry) => (entry?.type === 'string' ? entry.value : null))
    .filter((entry): entry is string => Boolean(entry))
    .join('');

  if (identification) {
    parts.push(`記号番号: ${identification}`);
  }

  if (props.startDate?.type === 'string') {
    parts.push(`開始日: ${props.startDate.value}`);
  }

  if (props.expiredDate?.type === 'string') {
    parts.push(`期限: ${props.expiredDate.value}`);
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

    const guid = properties.GUID?.type === 'string' ? properties.GUID.value : undefined;
    const classCode =
      properties.insuranceClassCode?.type === 'string' ? properties.insuranceClassCode.value : undefined;
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
      className:
        properties.insuranceClass?.type === 'string' ? (properties.insuranceClass.value as string | undefined) : undefined,
      guid,
      number: properties.insuranceNumber?.type === 'string' ? properties.insuranceNumber.value : undefined,
      clientGroup: properties.clientGroup?.type === 'string' ? properties.clientGroup.value : undefined,
      clientNumber: properties.clientNumber?.type === 'string' ? properties.clientNumber.value : undefined,
      startDate: properties.startDate?.type === 'string' ? properties.startDate.value : undefined,
      expiredDate: properties.expiredDate?.type === 'string' ? properties.expiredDate.value : undefined,
    };
  } catch (error) {
    console.error('健康保険情報の解析に失敗しました', error);
    return buildFallbackInsurance(beanBytes, 'XML デコードに失敗しました', options.fallbackLabel);
  }
};

const indent = (content: string, spaces = 4) => {
  const padding = ' '.repeat(spaces);
  return content
    .split('\n')
    .map((line) => (line.length > 0 ? `${padding}${line}` : line))
    .join('\n');
};

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const buildPropertyBody = (property: BeanPropertyValue): string => {
  switch (property.type) {
    case 'string':
      return `<string>${escapeXml(property.value)}</string>`;
    case 'int':
      return `<int>${escapeXml(property.value)}</int>`;
    case 'long':
      return `<long>${escapeXml(property.value)}</long>`;
    case 'boolean':
      return `<boolean>${escapeXml(property.value)}</boolean>`;
    case 'null':
      return '<null/>';
    case 'array': {
      const values = property.value ?? [];
      const items = values
        .map(
          (item, index) =>
            `    <void index="${index}">\n      <string>${escapeXml(item)}</string>\n    </void>`,
        )
        .join('\n');
      return `<array class="java.lang.String" length="${values.length}">\n${items}\n  </array>`;
    }
    case 'raw':
      return property.raw;
    default:
      return '';
  }
};

export const decodeHealthInsuranceBean = (beanBytes: string): BeanParseResult => {
  const xml = decodeBase64(beanBytes);
  return parseBeanProperties(xml);
};

export const encodeHealthInsuranceBean = (
  properties: Record<string, BeanPropertyValue>,
  order: string[],
): string => {
  const entries = order.map((key) => {
    const property = properties[key];
    if (!property) {
      return null;
    }
    const body = buildPropertyBody(property);
    const wrapped = `<void property="${key}">\n${indent(body, 2)}\n </void>`;
    return wrapped;
  });

  const trailing = Object.keys(properties)
    .filter((key) => !order.includes(key))
    .map((key) => {
      const property = properties[key];
      if (!property) {
        return null;
      }
      const body = buildPropertyBody(property);
      return `<void property="${key}">\n${indent(body, 2)}\n </void>`;
    });

  const propertyXml = [...entries, ...trailing]
    .filter((entry): entry is string => Boolean(entry))
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<java version="1.8.0_202" class="java.beans.XMLDecoder">\n <object class="open.dolphin.infomodel.PVTHealthInsuranceModel">\n${indent(propertyXml, 1)}\n </object>\n</java>`;

  return encodeBase64(xml);
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
