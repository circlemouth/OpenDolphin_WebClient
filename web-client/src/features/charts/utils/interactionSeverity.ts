import type { DrugInteractionEntry } from '@/features/charts/types/orca';

type Severity = NonNullable<DrugInteractionEntry['severity']>;

const CRITICAL_KEYWORDS = ['ショック', '呼吸停止', '死亡', '禁忌', 'アナフィラキシー'];
const WARNING_KEYWORDS = ['注意', '重篤', '危険', '併用注意'];

const includesKeyword = (text: string, keywords: string[]) =>
  keywords.some((keyword) => text.includes(keyword));

export const determineInteractionSeverity = (entry: DrugInteractionEntry): Severity => {
  const description = entry.symptomDescription ?? '';
  const normalized = description.toLowerCase();
  const original = description;

  if (includesKeyword(original, CRITICAL_KEYWORDS) || includesKeyword(normalized, CRITICAL_KEYWORDS.map((keyword) => keyword.toLowerCase()))) {
    return 'critical';
  }

  if (includesKeyword(original, WARNING_KEYWORDS) || includesKeyword(normalized, WARNING_KEYWORDS.map((keyword) => keyword.toLowerCase()))) {
    return 'warning';
  }

  if (entry.symptomCode && /^9[5-9]/.test(entry.symptomCode)) {
    return 'warning';
  }

  return 'info';
};

export const shouldBlockOrderBySeverity = (severity: Severity) => severity === 'critical';
