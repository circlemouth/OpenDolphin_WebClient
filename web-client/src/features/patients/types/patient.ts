export type PatientSearchMode = 'name' | 'kana' | 'id' | 'digit';

export interface PatientSearchRequest {
  keyword: string;
  mode: PatientSearchMode;
}

export interface RawPatientResource {
  id?: number;
  patientId?: string;
  fullName?: string;
  kanaName?: string;
  gender?: string;
  genderDesc?: string;
  birthday?: string;
  pvtDate?: string;
  appMemo?: string;
  reserve1?: string;
  reserve2?: string;
  reserve3?: string;
  reserve4?: string;
  reserve5?: string;
  reserve6?: string;
  healthInsurances?: Array<{ beanBytes?: string }> | null;
}

export interface PatientSummary {
  id: number;
  patientId: string;
  fullName: string;
  kanaName?: string;
  gender?: string;
  genderDesc?: string;
  birthday?: string;
  lastVisitDate?: string;
  safetyNotes: string[];
  raw: RawPatientResource;
}

export interface PatientListResponse {
  list?: RawPatientResource[] | null;
}
