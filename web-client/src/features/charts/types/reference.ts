export interface MonshinSummaryItem {
  id: string;
  question: string;
  answer: string;
}

export interface VitalSignItem {
  id: string;
  label: string;
  value: string;
}

export interface PastSummaryItem {
  id: string;
  title: string;
  excerpt: string;
  recordedAt?: string;
}
