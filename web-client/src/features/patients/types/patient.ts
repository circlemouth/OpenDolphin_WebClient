export type PatientSearchMode = 'name' | 'kana' | 'id' | 'digit';

export type PatientSearchRequest =
  | {
      keyword: string;
      mode: PatientSearchMode;
    }
  | {
      nameKeyword?: string;
      kanaKeyword?: string;
      idKeyword?: string;
      digitKeyword?: string;
      keyword?: undefined;
      mode?: undefined;
    };

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
  memo?: string;
  relations?: string;
  telephone?: string;
  mobilePhone?: string;
  email?: string;
  simpleAddressModel?: {
    zipCode?: string;
    address?: string;
  } | null;
  healthInsurances?: Array<{ id?: number; beanBytes?: string | null }> | null;
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

export interface PatientHealthInsurance {
  id?: number;
  beanBytes: string;
}

export interface PatientDetailAddress {
  zipCode?: string;
  address?: string;
}

export interface PatientDetail {
  id: number;
  patientId: string;
  fullName: string;
  kanaName?: string;
  gender: string;
  genderDesc?: string;
  birthday?: string;
  memo?: string;
  appMemo?: string;
  relations?: string;
  telephone?: string;
  mobilePhone?: string;
  email?: string;
  address?: PatientDetailAddress | null;
  reserve1?: string;
  reserve2?: string;
  reserve3?: string;
  reserve4?: string;
  reserve5?: string;
  reserve6?: string;
  safetyNotes: string[];
  healthInsurances: PatientHealthInsurance[];
  raw: RawPatientResource;
}

export interface PatientUpsertPayload {
  id?: number;
  patientId: string;
  fullName: string;
  kanaName?: string;
  gender: string;
  genderDesc?: string;
  birthday?: string;
  memo?: string;
  appMemo?: string;
  relations?: string;
  telephone?: string;
  mobilePhone?: string;
  email?: string;
  address?: PatientDetailAddress | null;
  reserve1?: string;
  reserve2?: string;
  reserve3?: string;
  reserve4?: string;
  reserve5?: string;
  reserve6?: string;
  healthInsurances: PatientHealthInsurance[];
}
