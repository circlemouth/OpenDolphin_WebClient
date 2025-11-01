export type SafetyTone = 'danger' | 'warning' | 'info';

const dangerKeywords = [
  '禁忌',
  '重症',
  '危険',
  '緊急',
  'anaphylaxis',
  'shock',
  'severe',
  '致死',
];

const warningKeywords = [
  'アレルギー',
  '注意',
  '要注意',
  '慎重',
  'warning',
  'allergy',
  'caution',
];

const includesKeyword = (source: string, keyword: string) => {
  if (!source || !keyword) {
    return false;
  }
  const lowerSource = source.toLowerCase();
  const lowerKeyword = keyword.toLowerCase();
  return source.includes(keyword) || lowerSource.includes(lowerKeyword);
};

export const determineSafetyTone = (label: string): SafetyTone => {
  if (!label) {
    return 'info';
  }

  if (dangerKeywords.some((keyword) => includesKeyword(label, keyword))) {
    return 'danger';
  }

  if (warningKeywords.some((keyword) => includesKeyword(label, keyword))) {
    return 'warning';
  }

  return 'info';
};

