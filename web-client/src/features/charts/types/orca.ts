import type { OrcaMasterAuditMeta } from '@/types/orca';

export interface TensuMasterEntry extends OrcaMasterAuditMeta {
  code: string;
  name: string;
  kana?: string;
  unitName?: string;
  point?: number | null;
  startDate?: string;
  endDate?: string;
  yakkaCode?: string;
  inpatientFlag?: string;
  routeFlag?: string;
  categoryFlag?: string;
}

export interface DiseaseMasterEntry extends OrcaMasterAuditMeta {
  code: string;
  name: string;
  kana?: string;
  icd10?: string;
  validUntil?: string | null;
}

export interface GeneralNameEntry extends OrcaMasterAuditMeta {
  code: string;
  name: string;
}

export interface DrugInteractionEntry {
  code1: string;
  code2: string;
  symptomCode?: string;
  symptomDescription?: string;
  severity?: 'critical' | 'warning' | 'info';
}
