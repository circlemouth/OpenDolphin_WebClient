export interface TensuMasterEntry {
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

export interface DiseaseMasterEntry {
  code: string;
  name: string;
  kana?: string;
  icd10?: string;
  validUntil?: string | null;
}

export interface GeneralNameEntry {
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
