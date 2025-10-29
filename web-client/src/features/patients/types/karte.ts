export interface RawAllergyResource {
  factor?: string;
  severity?: string;
  memo?: string;
  identifiedDate?: string;
}

export interface RawDocInfoResource {
  docPk?: number;
  docType?: string;
  title?: string;
  confirmDate?: string | null;
  firstConfirmDate?: string | null;
  departmentDesc?: string | null;
  hasMark?: boolean;
  status?: string;
}

export interface RawMemoResource {
  id?: number;
  memo?: string;
  confirmed?: string | null;
  started?: string | null;
  status?: string | null;
}

export interface RawKarteBean {
  id?: number;
  created?: string;
  allergies?: RawAllergyResource[] | null;
  docInfoList?: RawDocInfoResource[] | null;
  memoList?: RawMemoResource[] | null;
  lastDocDate?: string | null;
}

export interface KarteSummary {
  id: number;
  created?: string;
  allergies: AllergySummary[];
  documents: DocInfoSummary[];
  memos: PatientMemoSummary[];
  lastDocDate?: string | null;
}

export interface AllergySummary {
  factor: string;
  severity?: string;
  memo?: string;
  identifiedDate?: string;
}

export interface DocInfoSummary {
  docPk: number;
  title: string;
  confirmDate?: string | null;
  departmentDesc?: string | null;
  hasMark?: boolean;
  status?: string;
}

export interface PatientMemoSummary {
  id: number;
  memo?: string;
  confirmed?: string | null;
  status?: string | null;
}
