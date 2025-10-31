export type DecisionSupportSeverity = 'danger' | 'warning' | 'info';

export type DecisionSupportCategory = 'interaction' | 'allergy' | 'safety' | 'system';

export interface DecisionSupportMessage {
  id: string;
  severity: DecisionSupportSeverity;
  category: DecisionSupportCategory;
  headline: string;
  detail?: string;
  timestamp?: string;
}
